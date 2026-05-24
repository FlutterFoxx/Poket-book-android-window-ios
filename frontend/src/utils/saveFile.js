/**
 * saveFile.js — Universal file save for Web, Android (Capacitor), Windows (Electron)
 *
 * Platform detection:
 *   - window.Capacitor?.isNativePlatform() → Android/iOS Capacitor WebView
 *   - navigator.userAgent includes "Electron" → Windows/Mac Electron desktop
 *   - otherwise → Web browser (Chrome, Safari, Firefox)
 *
 * Strategy per platform:
 *   1. navigator.canShare({files}) available → Web Share API (native share sheet)
 *      Works on: Android Chrome 75+, iOS Safari 15+, Capacitor modern WebView
 *   2. Electron → a.download (Electron Chromium supports it natively)
 *   3. Old Android Capacitor WebView → window.open(blobUrl) [user taps "Save/Share"]
 *   4. Web browser fallback → a.download
 */
import { toast } from "sonner";

// Detect running context
const isElectron = () => typeof navigator !== "undefined" && /Electron/i.test(navigator.userAgent);
const isCapacitorNative = () => {
  try { return Boolean(window.Capacitor?.isNativePlatform?.()); } catch { return false; }
};

export async function downloadBlob(blob, fileName) {
  // Validate blob content
  if (!blob || blob.size < 50) {
    toast.error("File generation failed — please try again", { duration: 3000 });
    return false;
  }

  const file = new File([blob], fileName, { type: blob.type });

  // ── Strategy 1: Web Share API ────────────────────────────────────────────
  // Best for: Android Chrome, iOS Safari, modern Capacitor WebViews
  // Opens native share sheet → user picks WhatsApp, Drive, Save, etc.
  if (typeof navigator.canShare === "function" && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: fileName });
      toast.success("Shared successfully!", { duration: 1500 });
      return true;
    } catch (err) {
      if (err.name === "AbortError") return false; // user cancelled — no toast
      // Other error → fall through to download
    }
  }

  const url = URL.createObjectURL(blob);

  // ── Strategy 2: Electron (Windows/Mac EXE) ───────────────────────────────
  // Electron Chromium fully supports a.download → triggers OS download dialog
  if (isElectron()) {
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 15000);
    toast.success(`Saved: ${fileName}`, { duration: 2000 });
    return true;
  }

  // ── Strategy 3: Capacitor Android/iOS (older WebView) ───────────────────
  // a.download saves to app-private temp folder (not user-accessible)
  // Instead: open blob URL in new tab → Android prompts "Open with" or "Share"
  // User can then save to Files, share on WhatsApp, etc.
  if (isCapacitorNative()) {
    window.open(url, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 30000);
    toast.success("File opened — tap Share or Save to keep it", { duration: 4000 });
    return true;
  }

  // ── Strategy 4: Web browser fallback (Chrome, Firefox, Safari desktop) ──
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 15000);
  const isAndroid = /Android/i.test(navigator.userAgent);
  toast.success(isAndroid ? "Saved to Downloads folder" : "File downloaded!", { duration: 1500 });
  return true;
}
