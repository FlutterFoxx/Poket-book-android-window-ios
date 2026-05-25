/**
 * saveFile.js — Injects a native-style bottom sheet for mobile sharing
 * 
 * On Android Capacitor: toast action buttons don't have user-gesture context.
 * Solution: Inject a real DOM bottom sheet with a button — its click() IS a
 * valid user gesture for navigator.share({files}).
 */
import { toast } from "sonner";

const isMobile = () => {
  try {
    if (window.Capacitor?.isNativePlatform?.()) return true;
    if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) return true;
  } catch {}
  return false;
};

const isElectron = () => /Electron/i.test(navigator.userAgent || "");

/** Show a bottom-sheet overlay and return a Promise that resolves when user taps Share or Cancel */
function showShareSheet(blob, fileName) {
  return new Promise((resolve) => {
    const file = new File([blob], fileName, { type: blob.type });
    const isPDF = fileName.endsWith(".pdf");
    const isImg = fileName.endsWith(".png") || fileName.endsWith(".jpg");
    const emoji = isPDF ? "📄" : isImg ? "🖼️" : "📊";

    const overlay = document.createElement("div");
    overlay.style.cssText = [
      "position:fixed", "inset:0", "background:rgba(0,0,0,0.55)",
      "z-index:99999", "display:flex", "align-items:flex-end",
      "justify-content:center", "padding:0 0 env(safe-area-inset-bottom,0)",
    ].join(";");

    overlay.innerHTML = `
      <div style="background:#fff;border-radius:20px 20px 0 0;padding:24px 20px 28px;width:100%;max-width:500px;text-align:center;box-shadow:0 -4px 24px rgba(0,0,0,0.15)">
        <div style="font-size:42px;margin-bottom:10px">${emoji}</div>
        <p style="font-size:15px;font-weight:700;color:#111;margin:0 0 4px;word-break:break-all">${fileName}</p>
        <p style="font-size:12px;color:#888;margin:0 0 20px">${(blob.size / 1024).toFixed(0)} KB • Tap Share to save or send</p>
        <button id="pb-share-btn" style="width:100%;background:#25D366;color:#fff;border:none;border-radius:14px;padding:15px;font-size:16px;font-weight:700;cursor:pointer;margin-bottom:10px;letter-spacing:0.3px">
          Share / Save to Gallery
        </button>
        <button id="pb-cancel-btn" style="width:100%;background:transparent;border:1.5px solid #e0e0e0;border-radius:14px;padding:13px;font-size:14px;color:#555;cursor:pointer">
          Cancel
        </button>
      </div>`;

    document.body.appendChild(overlay);

    const cleanup = () => {
      if (overlay.parentNode) document.body.removeChild(overlay);
    };

    overlay.querySelector("#pb-share-btn").addEventListener("click", async () => {
      cleanup();
      if (typeof navigator.share === "function") {
        try {
          // Try with file (opens WhatsApp, Drive, Gallery, etc.)
          await navigator.share({ files: [file], title: fileName });
          toast.success("Shared!", { duration: 1500 });
        } catch (err) {
          if (err.name !== "AbortError") {
            // File share not supported — fall back to download
            _triggerDownload(blob, fileName);
          }
        }
      } else {
        _triggerDownload(blob, fileName);
      }
      resolve(true);
    });

    overlay.querySelector("#pb-cancel-btn").addEventListener("click", () => {
      cleanup(); resolve(false);
    });

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) { cleanup(); resolve(false); }
    });
  });
}

export async function downloadBlob(blob, fileName) {
  if (!blob || blob.size === 0) {
    toast.error("File generation failed — please try again", { duration: 3000 });
    return false;
  }
  // Network check (checklist item #9)
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    toast.error("No internet connection — check your network", { duration: 3000 });
    return false;
  }

  // Mobile: show bottom-sheet with Share button (proper user gesture)
  if (isMobile()) {
    await showShareSheet(blob, fileName);
    return true;
  }

  // Desktop / Electron: direct download
  _triggerDownload(blob, fileName);
  toast.success(isElectron() ? "Saved to Downloads" : "Downloaded!", { duration: 1500 });
  return true;
}

function _triggerDownload(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = fileName; a.style.display = "none";
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
