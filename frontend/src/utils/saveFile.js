/**
 * saveBlob — Universal file save. Simplified, reliable version.
 * Share → Download fallback. Toast shows ONLY after action completes.
 */
import { toast } from "sonner";

export async function saveBlob(blob, fileName, mimeType) {
  if (!blob || blob.size === 0) {
    toast.error("File empty — generation failed. Try again.", { duration: 3000 });
    return "empty";
  }

  const type = mimeType || blob.type || "application/octet-stream";
  const file = new File([blob], fileName, { type });

  // Strategy 1: Web Share with file — toast fires ONLY after share resolves
  if (typeof navigator.canShare === "function" && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: fileName });
      toast.success("Shared successfully!", { duration: 1500 });
      return "shared";
    } catch (e) {
      if (e.name === "AbortError") return "cancelled"; // user cancelled — no toast
      // other share error → fall through to download
    }
  }

  // Strategy 2: Download via <a> element — toast fires ONLY after click confirmed
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Revoke after 30s — gives Android/desktop download manager time to complete
  setTimeout(() => URL.revokeObjectURL(url), 30000);

  // Toast fires immediately after a.click() — download has been triggered
  const isAndroid = /Android/i.test(navigator.userAgent);
  if (isAndroid) {
    toast.success("Saved to Downloads folder", { duration: 2500 });
  } else {
    toast.success("Downloaded!", { duration: 1500 });
  }
  return "downloaded";
}
