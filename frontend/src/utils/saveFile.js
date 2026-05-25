/**
 * saveFile.js — Mobile-first file save that actually works on Android Capacitor
 *
 * Root cause of the bug: On Android Capacitor WebView, a.download saves to
 * the app's PRIVATE storage (not user-accessible). navigator.share({files})
 * requires a direct user gesture but fails after async fetch (gesture expired).
 *
 * Solution: Fetch the file async, then show a toast with a "Tap to Share" button.
 * The button click IS a fresh user gesture → navigator.share succeeds.
 * Desktop: direct a.download (works fine outside WebView).
 */
import { toast } from "sonner";

const isMobileWebView = () => {
  try {
    // Android Capacitor WebView or iOS WKWebView
    if (window.Capacitor?.isNativePlatform?.()) return true;
    // Android WebView user agent
    if (/wv|WebView/i.test(navigator.userAgent)) return true;
    // iOS WebView
    if (/iPhone|iPad|iPod/i.test(navigator.userAgent) && !/Safari/i.test(navigator.userAgent)) return true;
  } catch {}
  return false;
};

const isElectron = () => /Electron/i.test(navigator.userAgent || "");

export async function downloadBlob(blob, fileName) {
  if (!blob || blob.size === 0) {
    toast.error("File generation failed — please try again", { duration: 3000 });
    return false;
  }

  const file = new File([blob], fileName, { type: blob.type });

  // ── MOBILE (Android Capacitor / iOS WebView) ──────────────────────────────
  // a.download saves to app's private folder (not user-accessible!)
  // Solution: Show a toast with "Tap to Share" button — fresh user gesture
  if (isMobileWebView()) {
    toast(fileName, {
      description: "Your file is ready",
      action: {
        label: "Tap to Share",
        onClick: async () => {
          if (typeof navigator.share === "function") {
            try {
              await navigator.share({ files: [file], title: fileName });
            } catch (err) {
              if (err.name !== "AbortError") {
                // Share with files failed — try text share with instructions
                try {
                  await navigator.share({
                    title: "PoketBook Export",
                    text: `Your file "${fileName}" is ready. Check poketbook.in to download.`
                  });
                } catch {}
              }
            }
          } else {
            // Very old Android — last resort download
            _triggerDownload(blob, fileName);
          }
        }
      },
      duration: 30000, // 30s to let user tap the button
    });
    return true;
  }

  // ── DESKTOP (Electron, Chrome, Firefox, Safari) ───────────────────────────
  // a.download works reliably outside WebView
  _triggerDownload(blob, fileName);
  const label = isElectron() ? "Saved to Downloads" : "Downloaded!";
  toast.success(label, { duration: 1500 });
  return true;
}

function _triggerDownload(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
