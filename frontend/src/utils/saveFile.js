/**
 * saveBlob — Universal file save for all devices.
 * - Primary: navigator.share({files}) — success toast ONLY after promise resolves
 * - Fallback: URL.createObjectURL + a.download — success toast ONLY after click
 * - Validates blob.size > 0 before attempting any save
 * - 30s revoke delay so Android download manager can complete
 */
import { toast } from "sonner";

export async function saveBlob(blob, fileName, mimeType) {
  // Validate blob has actual content
  if (!blob || blob.size === 0) {
    toast.error("File is empty — generation failed. Try again.", { duration: 3000 });
    return "empty";
  }
  if (blob.size < 50) {
    toast.error("File too small — generation failed. Try again.", { duration: 3000 });
    return "too_small";
  }

  const type = mimeType || blob.type || "application/octet-stream";
  const file = new File([blob], fileName, { type });

  // Strategy 1: Web Share API with file — success toast ONLY after share resolves
  if (typeof navigator.canShare === "function" && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: fileName });
      // Toast fires HERE — only after the share dialog closes successfully
      toast.success("File shared!", { duration: 1500 });
      return "shared";
    } catch (e) {
      if (e.name === "AbortError") return "cancelled"; // User dismissed — no toast
      // Other error (permissions, etc.) — fall through to download
    }
  }

  // Strategy 2: Programmatic download via <a> element
  const url = URL.createObjectURL(blob);
  try {
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Delay revoke — Android download manager needs time to read the blob
    setTimeout(() => URL.revokeObjectURL(url), 30000);

    const isAndroid = /Android/i.test(navigator.userAgent);
    const isIOS = /iPad|iPhone|iPod/i.test(navigator.userAgent);

    if (isIOS) {
      // iOS Safari doesn't support a.download — open blob in new tab instead
      URL.revokeObjectURL(url);
      const reader = new FileReader();
      reader.onload = () => {
        const w = window.open(reader.result, "_blank");
        // Toast ONLY after new tab opened
        if (w) toast.success("Opened — tap & hold to save", { duration: 4000 });
        else toast.error("Unable to open — try sharing from the Share button", { duration: 4000 });
      };
      reader.readAsDataURL(blob);
      return "opened_ios";
    }

    // Toast fires ONLY after a.click() — download confirmed to start
    if (isAndroid) {
      toast.success("Saved to Downloads folder", { duration: 2500 });
    } else {
      toast.success("Downloaded!", { duration: 1500 });
    }
    return "downloaded";

  } catch (err) {
    URL.revokeObjectURL(url);
    toast.error("Download failed — try again", { duration: 2500 });
    return "failed";
  }
}
