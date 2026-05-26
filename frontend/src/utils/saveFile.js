/**
 * saveFile.js — Universal file save
 * Shows a bottom sheet overlay which gives a fresh user gesture for navigator.share
 * Strategy: share({files}) → share({url}) → a.download fallback
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

export async function downloadBlob(blob, fileName) {
  if (!blob || blob.size === 0) {
    toast.error("File generation failed — try again", { duration: 3000 });
    return false;
  }

  const sizeKB = Math.round(blob.size / 1024);
  const ext = fileName.split(".").pop().toUpperCase();
  const emoji = { PDF: "📄", PNG: "🖼️", XLSX: "📊", CSV: "📋" }[ext] || "📁";

  // Desktop / Electron: direct download, no overlay needed
  if (!isMobile()) {
    _download(blob, fileName);
    toast.success(isElectron() ? `Saved: ${fileName}` : "Downloaded!", { duration: 1500 });
    return true;
  }

  // Mobile: show bottom sheet for user gesture context
  return new Promise((resolve) => {
    const file = new File([blob], fileName, { type: blob.type });

    const overlay = document.createElement("div");
    overlay.style.cssText = [
      "position:fixed", "inset:0", "background:rgba(0,0,0,0.55)",
      "z-index:99999", "display:flex", "align-items:flex-end", "justify-content:center",
    ].join(";");

    overlay.innerHTML = `
      <div style="background:#fff;border-radius:22px 22px 0 0;padding:28px 20px 32px;width:100%;max-width:480px;text-align:center;box-shadow:0 -4px 24px rgba(0,0,0,0.12)">
        <div style="width:36px;height:4px;background:#ddd;border-radius:2px;margin:0 auto 20px"></div>
        <div style="font-size:48px;margin-bottom:12px">${emoji}</div>
        <p style="font-size:16px;font-weight:700;color:#111;margin:0 0 4px;word-break:break-all;padding:0 12px">${fileName}</p>
        <p style="font-size:13px;color:#999;margin:0 0 24px">${sizeKB} KB</p>
        <button id="pb-share" style="width:100%;background:#075E54;color:#fff;border:none;border-radius:14px;padding:16px;font-size:16px;font-weight:700;cursor:pointer;margin-bottom:10px">
          📤 Share / Save File
        </button>
        <button id="pb-dl" style="width:100%;background:#f1f5f9;color:#374151;border:none;border-radius:14px;padding:14px;font-size:14px;font-weight:600;cursor:pointer;margin-bottom:10px">
          ⬇️ Download to Device
        </button>
        <button id="pb-cancel" style="width:100%;background:transparent;border:none;padding:10px;font-size:14px;color:#aaa;cursor:pointer">
          Cancel
        </button>
      </div>`;

    document.body.appendChild(overlay);

    const close = () => { if (overlay.parentNode) document.body.removeChild(overlay); };

    // Share button — uses navigator.share (fresh user gesture from THIS click)
    overlay.querySelector("#pb-share").addEventListener("click", async () => {
      overlay.querySelector("#pb-share").textContent = "Opening...";
      overlay.querySelector("#pb-share").disabled = true;

      if (typeof navigator.share === "function") {
        // Try with file (works on Android Chrome 86+, iOS Safari 15+)
        try {
          await navigator.share({ files: [file], title: fileName });
          close();
          toast.success("File shared!", { duration: 1500 });
          resolve(true); return;
        } catch (e) {
          if (e.name === "AbortError") { close(); resolve(false); return; }
          // File share failed — try URL share as last resort
          try {
            await navigator.share({ title: "PoketBook", url: window.location.href });
            close();
            resolve(true); return;
          } catch {}
        }
      }

      // navigator.share not available — fallback to download
      close();
      _download(blob, fileName);
      toast.success("Saved to Downloads folder", { duration: 2500 });
      resolve(true);
    });

    // Download button — direct download
    overlay.querySelector("#pb-dl").addEventListener("click", () => {
      close();
      _download(blob, fileName);
      toast.success("Check your Downloads folder", { duration: 2500 });
      resolve(true);
    });

    overlay.querySelector("#pb-cancel").addEventListener("click", () => { close(); resolve(false); });
    overlay.addEventListener("click", (e) => { if (e.target === overlay) { close(); resolve(false); } });
  });
}

function _download(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = fileName; a.style.display = "none";
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 60000); // 60s to ensure download starts
}
