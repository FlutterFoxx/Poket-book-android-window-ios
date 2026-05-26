/**
 * androidExport.js — Android Export Engine with graceful fallback
 *
 * Priority:
 * 1. @capacitor/filesystem + @capacitor/share (needs new APK v1.3.0+)
 * 2. navigator.share({files}) — works on Android Chrome 86+ without Capacitor plugins
 * 3. URL.createObjectURL + window.open — opens natively in Android
 * 4. a.download — desktop fallback
 *
 * Graceful fallback: if plugin not in APK, silently falls to next option.
 */
import { toast } from "sonner";

const BACKEND = process.env.REACT_APP_BACKEND_URL || "";

const isCapacitorApp = () => { try { return Boolean(window.Capacitor?.isNativePlatform?.()); } catch { return false; } };
const isAndroidDevice = () => /Android/i.test(navigator.userAgent);

function getToken() {
  try { return localStorage.getItem("access_token") || sessionStorage.getItem("access_token") || ""; } catch { return ""; }
}

// Export history for verification
const HISTORY_KEY = "pk_export_history";
function saveExportRecord(record) {
  try {
    const h = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    h.unshift({ ...record, timestamp: new Date().toISOString() });
    localStorage.setItem(HISTORY_KEY, JSON.stringify(h.slice(0, 50)));
  } catch {}
}
export function getExportHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); } catch { return []; }
}

// Fetch file from backend with token in query param
async function fetchFile(endpoint) {
  const token = getToken();
  if (!token) throw new Error("Please log in first");
  const url = `${BACKEND}${endpoint}${endpoint.includes("?") ? "&" : "?"}token=${encodeURIComponent(token)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Server error ${res.status}`);
  const blob = await res.blob();
  if (!blob || blob.size < 100) throw new Error("File generation failed — try again");
  return blob;
}

// Convert blob to base64
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result.split(",")[1]);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

// Strategy 1: Capacitor Filesystem + Share (requires APK v1.3.0+)
async function tryCapacitorExport(blob, fileName, action) {
  const { Filesystem, Directory } = await import("@capacitor/filesystem");
  const base64 = await blobToBase64(blob);
  const ext = fileName.split(".").pop().toLowerCase();
  const isPng = ["png", "jpg", "jpeg"].includes(ext);

  if (action === "save") {
    const dir = isPng ? Directory.External : Directory.ExternalStorage;
    const path = `PoketBook/${fileName}`;
    const result = await Filesystem.writeFile({ path, data: base64, directory: dir, recursive: true });
    return { success: true, method: "capacitor_save", path: result.uri };
  } else {
    // Share — write to cache then share URI
    const writeResult = await Filesystem.writeFile({
      path: `share_${Date.now()}_${fileName}`,
      data: base64, directory: Directory.Cache, recursive: true,
    });
    const { Share } = await import("@capacitor/share");
    await Share.share({ title: `PoketBook — ${fileName}`, url: writeResult.uri, dialogTitle: `Share ${fileName}` });
    return { success: true, method: "capacitor_share", path: writeResult.uri };
  }
}

// Strategy 2: navigator.share with file
async function tryWebShareFile(blob, fileName) {
  if (typeof navigator.share !== "function") throw new Error("navigator.share not available");
  const file = new File([blob], fileName, { type: blob.type });
  await navigator.share({ files: [file], title: fileName });
  return { success: true, method: "navigator_share" };
}

// Strategy 3: window.open blob URL (Android opens in PDF viewer)
async function tryOpenInViewer(blob, fileName) {
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
  setTimeout(() => URL.revokeObjectURL(url), 60000);
  return { success: true, method: "open_viewer" };
}

// Strategy 4: a.download (desktop)
function triggerDownload(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = fileName; a.style.display = "none";
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 30000);
  return { success: true, method: "a_download" };
}

/**
 * Export a backend-generated file (PDF/Excel).
 * Tries strategies in order, falls back gracefully.
 */
export async function androidExport(endpoint, fileName, action = "share") {
  const toastId = toast.loading(`Generating ${fileName}...`);
  try {
    const blob = await fetchFile(endpoint);
    toast.dismiss(toastId);

    let result = null;

    // Strategy 1: Capacitor plugins (APK v1.3.0+)
    if (isCapacitorApp()) {
      try {
        result = await tryCapacitorExport(blob, fileName, action);
      } catch (e) {
        // Plugin not in APK yet → fall through
        if (process.env.NODE_ENV === "development") console.warn("Capacitor plugin not ready:", e.message);
      }
    }

    // Strategy 2: navigator.share with file
    if (!result) {
      try {
        result = await tryWebShareFile(blob, fileName);
      } catch (e) {
        if (e.name === "AbortError") { saveExportRecord({ fileName, action, success: false, error: "cancelled" }); return { success: false, cancelled: true }; }
      }
    }

    // Strategy 3: Open in native viewer (Android)
    if (!result && (isCapacitorApp() || isAndroidDevice())) {
      result = await tryOpenInViewer(blob, fileName);
    }

    // Strategy 4: Direct download (desktop/web)
    if (!result) {
      result = triggerDownload(blob, fileName);
    }

    // Show success toast
    const msg = {
      capacitor_save: `Saved to device! Check Files → PoketBook`,
      capacitor_share: "Share sheet opened",
      navigator_share: "Shared!",
      open_viewer: "PDF opened — tap ⋮ to save or share",
      a_download: `Downloaded: ${fileName}`,
    }[result.method] || "File ready";

    if (result.method !== "navigator_share") {
      toast.success(msg, { duration: 3500 });
    }

    saveExportRecord({ fileName, sizeMB: (blob.size / 1024).toFixed(0) + "KB", action, method: result.method, path: result.path, success: true });
    return result;

  } catch (err) {
    toast.dismiss(toastId);
    if (process.env.NODE_ENV === "development") console.error("Export failed:", err);
    toast.error(err.message || "Export failed — try again", { duration: 3000 });
    saveExportRecord({ fileName, action, success: false, error: err.message });
    return { success: false, error: err.message };
  }
}

/**
 * Export a client-side blob (screenshot).
 */
export async function androidExportBlob(blob, fileName, action = "share") {
  if (!blob || blob.size < 50) { toast.error("Screenshot failed — try again"); return { success: false }; }
  const toastId = toast.loading("Saving screenshot...");
  try {
    let result = null;

    if (isCapacitorApp()) {
      try {
        result = await tryCapacitorExport(blob, fileName, "save");
      } catch (e) {
        if (process.env.NODE_ENV === "development") console.warn("Capacitor plugin not ready:", e.message);
      }
    }

    if (!result) {
      try { result = await tryWebShareFile(blob, fileName); }
      catch (e) {
        if (e.name === "AbortError") { toast.dismiss(toastId); return { success: false, cancelled: true }; }
      }
    }

    if (!result) result = triggerDownload(blob, fileName);

    toast.dismiss(toastId);
    const msg = result.method === "capacitor_save" ? "Screenshot saved to Gallery!" : result.method === "navigator_share" ? "Screenshot shared!" : "Screenshot saved!";
    toast.success(msg, { duration: 2500 });

    saveExportRecord({ fileName, sizeMB: (blob.size / 1024).toFixed(0) + "KB", action, method: result.method, path: result.path, success: true });
    return result;

  } catch (err) {
    toast.dismiss(toastId);
    toast.error(`Screenshot failed: ${err.message}`, { duration: 3000 });
    return { success: false };
  }
}
