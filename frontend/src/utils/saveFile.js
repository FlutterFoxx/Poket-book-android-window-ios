/**
 * Universal file save utility — works on all devices.
 * 
 * Strategy order:
 * 1. navigator.share({files}) — Native share sheet (Android Chrome 75+, iOS 15+)
 * 2. Blob URL download — Chrome/Firefox desktop, Android Downloads folder  
 * 3. Data URL open — fallback for older browsers
 * 
 * NOTE: Never use window.open() after async operations — blocked by mobile browsers.
 * Always use a.click() or navigator.share() for file saves after async.
 */
import { toast } from "sonner";

/**
 * Save a blob as a file. Returns 'shared', 'downloaded', 'cancelled', or 'failed'.
 * Shows appropriate success/error toast automatically.
 * @param {Blob} blob - The file data
 * @param {string} fileName - Filename with extension
 * @param {string} [mimeType] - Optional MIME type override
 * @returns {Promise<string>} - outcome
 */
export async function saveBlob(blob, fileName, mimeType) {
  if (!blob || blob.size < 10) {
    toast.error("File generation failed — try again", { duration: 2500 });
    return "failed";
  }

  const type = mimeType || blob.type;
  const file = new File([blob], fileName, { type });

  // Strategy 1: Web Share API with file (native share sheet on mobile)
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: fileName });
      toast.success("File shared!", { duration: 1500 });
      return "shared";
    } catch (e) {
      if (e.name === "AbortError") return "cancelled"; // User cancelled — no toast
      // Other error — fall through to download
    }
  }

  // Strategy 2: Programmatic download via <a> element
  // Works on: Desktop Chrome/Firefox/Edge, Android Chrome (saves to Downloads)
  const url = URL.createObjectURL(blob);
  try {
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Delay revoke so browser has time to start the download
    setTimeout(() => URL.revokeObjectURL(url), 30000);

    const isAndroid = /Android/i.test(navigator.userAgent);
    const isIOS = /iPad|iPhone|iPod/i.test(navigator.userAgent);

    if (isIOS) {
      // iOS Safari: a.download doesn't work — show data URL instead
      URL.revokeObjectURL(url);
      const dataUrl = await blobToDataUrl(blob);
      const w = window.open(dataUrl, "_blank");
      if (w) {
        toast.success("Opened — tap & hold image to save", { duration: 4000 });
        return "opened";
      }
      toast.error("Unable to save on iOS — try sharing via the Share button", { duration: 4000 });
      return "failed";
    }

    if (isAndroid) {
      toast.success(`${type.includes("pdf") ? "PDF" : "Image"} saved to Downloads folder`, { duration: 3000 });
    } else {
      toast.success("File downloaded!", { duration: 1500 });
    }
    return "downloaded";
  } catch {
    URL.revokeObjectURL(url);
    toast.error("Download failed — try again", { duration: 2500 });
    return "failed";
  }
}

/** Helper: convert Blob to base64 data URL */
function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
