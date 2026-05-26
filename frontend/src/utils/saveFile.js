/**
 * saveFile.js — PDF/file download utility
 * 
 * For mobile: uses direct URL with token so the native PDF viewer opens automatically.
 * For desktop: direct a.download or window.open.
 * 
 * This avoids ALL blob/share API complexity that fails on Android WebViews.
 */
import { toast } from "sonner";

const BACKEND = process.env.REACT_APP_BACKEND_URL || "";

// Get stored JWT token
function getToken() {
  try { return localStorage.getItem("access_token") || sessionStorage.getItem("access_token") || ""; }
  catch { return ""; }
}

const isMobile = () => {
  try {
    if (window.Capacitor?.isNativePlatform?.()) return true;
    if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) return true;
  } catch {}
  return false;
};

const isElectron = () => /Electron/i.test(navigator.userAgent || "");

/**
 * Open a backend export endpoint directly — PDF/Excel opens in native viewer on mobile.
 * @param {string} endpoint - e.g. "/api/export/ledger/ID/pdf"
 * @param {string} fileName - display name
 */
export async function openDirectDownload(endpoint, fileName) {
  const token = getToken();
  if (!token) { toast.error("Please log in first"); return; }

  const url = `${BACKEND}${endpoint}${endpoint.includes("?") ? "&" : "?"}token=${encodeURIComponent(token)}`;
  const toastId = toast.loading(`Generating ${fileName}...`);

  try {
    // Verify the file generates correctly first
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Server error: ${res.status}`);
    const blob = await res.blob();
    if (blob.size < 100) throw new Error("File too small — generation failed");

    toast.dismiss(toastId);

    // Create object URL for the verified blob
    const objUrl = URL.createObjectURL(blob);

    if (isMobile()) {
      // Mobile: try Web Share API with file (opens native share sheet with WhatsApp, Save, etc.)
      const file = new File([blob], fileName, { type: blob.type });
      if (typeof navigator.share === "function") {
        try {
          await navigator.share({ files: [file], title: fileName });
          URL.revokeObjectURL(objUrl);
          return;
        } catch (e) {
          if (e.name === "AbortError") { URL.revokeObjectURL(objUrl); return; }
          // share failed → fall through to window.open
        }
      }
      // Fallback: open in new tab (Android opens PDF/Excel natively)
      window.open(objUrl, "_blank");
      toast.success("File opened — tap ⋮ to save or share", { duration: 4000 });
      setTimeout(() => URL.revokeObjectURL(objUrl), 60000);
    } else {
      // Desktop / Electron: direct download
      const a = document.createElement("a");
      a.href = objUrl; a.download = fileName; a.style.display = "none";
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(objUrl), 30000);
      toast.success(`Downloaded: ${fileName}`, { duration: 2000 });
    }
  } catch (err) {
    toast.dismiss(toastId);
    if (process.env.NODE_ENV === "development") console.error("Download failed:", err);
    toast.error(`Failed: ${err.message || "try again"}`, { duration: 3000 });
  }
}

// Legacy blob download (for screenshots which are generated client-side)
export async function downloadBlob(blob, fileName) {
  if (!blob || blob.size === 0) {
    toast.error("File generation failed — try again"); return false;
  }
  const file = new File([blob], fileName, { type: blob.type });

  if (isMobile() && typeof navigator.share === "function") {
    try {
      await navigator.share({ files: [file], title: fileName });
      return true;
    } catch (e) {
      if (e.name === "AbortError") return false;
    }
  }
  const url = URL.createObjectURL(blob);
  if (isMobile()) {
    window.open(url, "_blank");
    toast.success("Image opened — tap ⋮ to save", { duration: 4000 });
  } else {
    const a = document.createElement("a");
    a.href = url; a.download = fileName; a.style.display = "none";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    toast.success(`Downloaded: ${fileName}`, { duration: 1500 });
  }
  setTimeout(() => URL.revokeObjectURL(url), 30000);
  return true;
}
