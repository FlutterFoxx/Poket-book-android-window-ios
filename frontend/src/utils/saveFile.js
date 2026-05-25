/**
 * saveFile.js — Android-first file sharing with full fallback chain
 * Uses DOM overlay with direct button click (proper user gesture)
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

function showShareOverlay(blob, fileName) {
  return new Promise((resolve) => {
    const sizeKB = (blob.size / 1024).toFixed(0);
    const ext = fileName.split(".").pop().toUpperCase();
    const emoji = { PDF: "📄", PNG: "🖼️", XLSX: "📊", CSV: "📋" }[ext] || "📁";

    const overlay = document.createElement("div");
    overlay.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:99999;display:flex;align-items:flex-end;justify-content:center;padding-bottom:env(safe-area-inset-bottom,0px)";

    overlay.innerHTML = `
      <div style="background:#fff;border-radius:22px 22px 0 0;padding:24px 20px 30px;width:100%;max-width:480px;text-align:center">
        <div style="width:40px;height:4px;background:#ddd;border-radius:4px;margin:0 auto 18px;opacity:.6"></div>
        <div style="font-size:46px;margin-bottom:10px">${emoji}</div>
        <p style="font-size:15px;font-weight:700;color:#111;margin:0 0 4px;word-break:break-all;padding:0 8px">${fileName}</p>
        <p style="font-size:12px;color:#888;margin:0 0 22px">${sizeKB} KB · Ready to share</p>
        <button id="pb-share" style="width:100%;background:#25D366;color:#fff;border:none;border-radius:14px;padding:16px;font-size:16px;font-weight:700;cursor:pointer;margin-bottom:10px;display:flex;align-items:center;justify-content:center;gap:8px">
          <span style="font-size:20px">📤</span> Share / Save to Gallery
        </button>
        <button id="pb-cancel" style="width:100%;background:transparent;border:1.5px solid #e0e0e0;border-radius:14px;padding:13px;font-size:14px;color:#666;cursor:pointer">
          Cancel
        </button>
      </div>`;

    document.body.appendChild(overlay);
    const file = new File([blob], fileName, { type: blob.type });

    overlay.querySelector("#pb-share").addEventListener("click", async () => {
      overlay.querySelector("#pb-share").textContent = "Sharing...";
      overlay.querySelector("#pb-share").disabled = true;
      
      if (typeof navigator.share === "function") {
        // Try share with file first
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({ files: [file], title: fileName });
            if (overlay.parentNode) document.body.removeChild(overlay);
            toast.success("Shared!", { duration: 1500 });
            resolve(true); return;
          } catch (err) {
            if (err.name === "AbortError") {
              if (overlay.parentNode) document.body.removeChild(overlay);
              resolve(false); return;
            }
          }
        }
        // Fallback: share without file (text)
        try {
          await navigator.share({ title: "PoketBook Export", text: `${fileName} — download from poketbook.in` });
          if (overlay.parentNode) document.body.removeChild(overlay);
          resolve(true); return;
        } catch {}
      }
      
      // Last resort: trigger download
      if (overlay.parentNode) document.body.removeChild(overlay);
      _triggerDownload(blob, fileName);
      resolve(true);
    });

    overlay.querySelector("#pb-cancel").addEventListener("click", () => {
      if (overlay.parentNode) document.body.removeChild(overlay);
      resolve(false);
    });
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) { if (overlay.parentNode) document.body.removeChild(overlay); resolve(false); }
    });
  });
}

export async function downloadBlob(blob, fileName) {
  if (!blob || blob.size === 0) {
    toast.error("File generation failed — try again", { duration: 3000 });
    return false;
  }
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    toast.error("No internet connection", { duration: 2500 });
    return false;
  }

  if (isMobile()) {
    await showShareOverlay(blob, fileName);
    return true;
  }

  // Desktop / Electron
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
