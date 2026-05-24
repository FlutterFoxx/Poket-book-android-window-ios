/**
 * saveFile.js — Universal file save for Web + Android Capacitor + Windows Electron
 *
 * IMPORTANT: Do NOT check navigator.canShare({files}) before calling share —
 * it returns false on many Android WebViews even when sharing works.
 * Always attempt share directly and catch errors.
 */
import { toast } from "sonner";

const isElectron = () => typeof navigator !== "undefined" && /Electron/i.test(navigator.userAgent);

export async function downloadBlob(blob, fileName) {
  // Validate — but allow smaller blobs (screenshots can be <50 bytes for tiny captures)
  if (!blob || blob.size === 0) {
    toast.error("File generation failed — please try again", { duration: 3000 });
    return false;
  }

  const file = new File([blob], fileName, { type: blob.type });

  // ── Strategy 1: Web Share API ──────────────────────────────────────────────
  // Try unconditionally — works on Android Chrome WebView, iOS Safari
  // Do NOT gate on canShare({files}) — it's unreliable on many Android devices
  if (typeof navigator.share === "function") {
    try {
      await navigator.share({ files: [file], title: fileName });
      toast.success("File shared!", { duration: 1500 });
      return true;
    } catch (err) {
      if (err.name === "AbortError") return false; // user cancelled — no toast
      // DataError / NotAllowedError / other → fall through to download
    }
  }

  // ── Strategy 2: Blob download (works on Electron, desktop browsers, Android Chrome) ──
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  // Keep URL alive for 30s — Android download manager may need time
  setTimeout(() => URL.revokeObjectURL(url), 30000);

  const isAndroid = /Android/i.test(navigator.userAgent);
  const label = isElectron() ? "Saved to Downloads" : isAndroid ? "Saved to Downloads folder" : "Downloaded!";
  toast.success(label, { duration: 2000 });
  return true;
}
