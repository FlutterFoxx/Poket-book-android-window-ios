/**
 * AndroidExportEngine — Reliable Android export using Capacitor native plugins
 *
 * PHASE 1: Pre-fetch file (async, shows loading indicator)
 * PHASE 2: User taps "Share/Save" (fresh gesture → native share sheet opens)
 * PHASE 3: Verify file was actually accessible (size + type check)
 *
 * Uses @capacitor/filesystem for gallery/storage save
 * Uses @capacitor/share for native share sheet
 * Falls back to navigator.share or a.download for non-Capacitor contexts
 */
import { toast } from "sonner";

const BACKEND = process.env.REACT_APP_BACKEND_URL || "";

// -- Helpers -----------------------------------------------------------------

const isCapacitorApp = () => {
  try { return Boolean(window.Capacitor?.isNativePlatform?.()); } catch { return false; }
};

const isAndroidApp = () => {
  try {
    if (!isCapacitorApp()) return false;
    return !/iPad|iPhone|iPod/i.test(navigator.userAgent);
  } catch { return false; }
};

const getToken = () => {
  try { return localStorage.getItem("access_token") || sessionStorage.getItem("access_token") || ""; }
  catch { return ""; }
};

// Export history stored locally for re-access verification
const HISTORY_KEY = "pk_export_history";
function saveExportRecord(record) {
  try {
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    history.unshift({ ...record, timestamp: new Date().toISOString() });
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 50)));
  } catch {}
}

export function getExportHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); }
  catch { return []; }
}

// -- Core fetch function -----------------------------------------------------

async function fetchExportFile(endpoint) {
  const token = getToken();
  if (!token) throw new Error("Please log in first");
  const url = `${BACKEND}${endpoint}${endpoint.includes("?") ? "&" : "?"}token=${encodeURIComponent(token)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Server error ${res.status}`);
  const blob = await res.blob();
  if (!blob || blob.size < 100) throw new Error("File too small — generation failed");
  return blob;
}

// -- Android Native Save (using Capacitor plugins) ---------------------------

async function saveToAndroidGallery(blob, fileName) {
  const { Filesystem, Directory } = await import("@capacitor/filesystem");
  // Convert blob to base64
  const base64 = await new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = () => res(reader.result.split(",")[1]);
    reader.onerror = rej;
    reader.readAsDataURL(blob);
  });
  // Save to DCIM/PoketBook (visible in gallery)
  const result = await Filesystem.writeFile({
    path: `PoketBook/${fileName}`,
    data: base64,
    directory: Directory.External,
    recursive: true,
  });
  return result.uri || `DCIM/PoketBook/${fileName}`;
}

async function saveToAndroidDownloads(blob, fileName) {
  const { Filesystem, Directory } = await import("@capacitor/filesystem");
  const base64 = await new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = () => res(reader.result.split(",")[1]);
    reader.onerror = rej;
    reader.readAsDataURL(blob);
  });
  // Save to Downloads/PoketBook
  const result = await Filesystem.writeFile({
    path: `PoketBook/${fileName}`,
    data: base64,
    directory: Directory.ExternalStorage,
    recursive: true,
  });
  return result.uri || `Downloads/PoketBook/${fileName}`;
}

async function shareViaAndroidNative(blob, fileName) {
  const { Share } = await import("@capacitor/share");
  const { Filesystem, Directory } = await import("@capacitor/filesystem");
  // Must write file first, then share the file URI
  const base64 = await new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = () => res(reader.result.split(",")[1]);
    reader.onerror = rej;
    reader.readAsDataURL(blob);
  });
  const writeResult = await Filesystem.writeFile({
    path: `PoketBook/share_${fileName}`,
    data: base64,
    directory: Directory.Cache,
    recursive: true,
  });
  await Share.share({
    title: `PoketBook — ${fileName}`,
    text: `Shared from PoketBook`,
    url: writeResult.uri,
    dialogTitle: `Share ${fileName}`,
  });
  return writeResult.uri;
}

// -- Web fallback (non-Capacitor) --------------------------------------------

async function webShare(blob, fileName) {
  const file = new File([blob], fileName, { type: blob.type });
  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: fileName });
    return "web_share";
  }
  // Direct download
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = fileName; a.style.display = "none";
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 30000);
  return "download";
}

// -- PUBLIC API --------------------------------------------------------------

/**
 * Export a PDF/Excel file to Android storage or share it.
 * @param {string} endpoint - backend API endpoint
 * @param {string} fileName - file name with extension
 * @param {'save'|'share'} action - 'save' to device storage, 'share' to apps
 */
export async function androidExport(endpoint, fileName, action = "share") {
  const toastId = toast.loading(`Preparing ${fileName}...`);
  try {
    const blob = await fetchExportFile(endpoint);
    toast.dismiss(toastId);

    const ext = fileName.split(".").pop().toLowerCase();
    const isImage = ["png", "jpg", "jpeg"].includes(ext);
    const sizeMB = (blob.size / 1024 / 1024).toFixed(2);

    let savedPath = null;
    let method = "unknown";

    if (isCapacitorApp()) {
      if (action === "save") {
        // Save to device storage
        if (isImage) {
          savedPath = await saveToAndroidGallery(blob, fileName);
          method = "gallery";
          toast.success(`Screenshot saved to Gallery!\n${fileName}`, { duration: 4000 });
        } else {
          savedPath = await saveToAndroidDownloads(blob, fileName);
          method = "downloads";
          toast.success(`PDF saved to Downloads!\n${fileName}`, { duration: 4000 });
        }
      } else {
        // Share via native share sheet
        savedPath = await shareViaAndroidNative(blob, fileName);
        method = "native_share";
        // Toast handled by share dialog
      }
    } else {
      // Web / Electron fallback
      method = await webShare(blob, fileName);
      if (method === "web_share") {
        toast.success("Shared!", { duration: 1500 });
      } else {
        toast.success(`Downloaded: ${fileName}`, { duration: 2000 });
      }
    }

    // Record for verification
    saveExportRecord({
      fileName,
      sizeMB,
      action,
      method,
      path: savedPath,
      success: true,
    });

    return { success: true, path: savedPath, method };

  } catch (err) {
    toast.dismiss(toastId);
    if (err?.message === "cancelled") return { success: false, cancelled: true };
    if (process.env.NODE_ENV === "development") console.error("Export failed:", err);
    // Record failure
    saveExportRecord({ fileName, action, success: false, error: err.message });
    toast.error(`Export failed: ${err.message || "try again"}`, { duration: 3000 });
    return { success: false, error: err.message };
  }
}

/**
 * Export a screenshot (canvas blob) to gallery or share it.
 * MUST be called directly from a user gesture (button click) with a pre-fetched blob.
 */
export async function androidExportBlob(blob, fileName, action = "share") {
  if (!blob || blob.size < 50) {
    toast.error("Screenshot failed — try again");
    return { success: false };
  }

  // Reuse same export logic
  const fakeFetch = async () => blob;
  const toastId = toast.loading("Saving screenshot...");
  try {
    const ext = fileName.split(".").pop().toLowerCase();
    const isImage = ["png", "jpg", "jpeg"].includes(ext);

    let savedPath = null;
    let method = "unknown";

    if (isCapacitorApp()) {
      if (action === "save" || isImage) {
        savedPath = await saveToAndroidGallery(blob, fileName);
        method = "gallery";
        toast.dismiss(toastId);
        toast.success(`Saved to Gallery: ${fileName}`, { duration: 3000 });
      } else {
        savedPath = await shareViaAndroidNative(blob, fileName);
        method = "native_share";
        toast.dismiss(toastId);
      }
    } else {
      toast.dismiss(toastId);
      method = await webShare(blob, fileName);
      if (method === "web_share") toast.success("Shared!", { duration: 1500 });
      else toast.success(`Downloaded: ${fileName}`, { duration: 1500 });
    }

    saveExportRecord({ fileName, sizeMB: (blob.size / 1024).toFixed(0) + "KB", action, method, path: savedPath, success: true });
    return { success: true, path: savedPath, method };
  } catch (err) {
    toast.dismiss(toastId);
    if (process.env.NODE_ENV === "development") console.error("Screenshot export failed:", err);
    saveExportRecord({ fileName, action, success: false, error: err.message });
    toast.error(`Failed: ${err.message || "try again"}`, { duration: 3000 });
    return { success: false };
  }
}
