/**
 * saveFile.js — Clean file save utility (fresh rewrite)
 * Two strategies only: Web Share API (mobile) → blob download (desktop/fallback)
 */
import { toast } from "sonner";

export async function downloadBlob(blob, fileName) {
  // Guard: ensure blob has real content
  if (!blob || blob.size < 50) {
    toast.error("File generation failed — please try again", { duration: 3000 });
    return false;
  }

  const file = new File([blob], fileName, { type: blob.type });

  // Mobile: Web Share API with file (Android Chrome, iOS Safari 15+)
  if (typeof navigator.canShare === "function" && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: fileName });
      toast.success("File shared!", { duration: 1500 });
      return true;
    } catch (err) {
      if (err.name === "AbortError") return false; // user cancelled, no toast
      // fall through to download
    }
  }

  // Desktop + Android fallback: standard <a> download
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  // Revoke after 15s — enough time for any download manager
  setTimeout(() => URL.revokeObjectURL(url), 15000);
  toast.success("File downloaded!", { duration: 1500 });
  return true;
}
