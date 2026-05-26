// Shared utility functions for the Ledger feature

/**
 * Header balance label (operator's perspective):
 * positive → DENA (Blue), negative → LENA (Red)
 */
export const balLabel = (amount) => {
  if (!amount) return { text: "0.00  बराबर", color: "text-stone-500" };
  const abs = Math.abs(amount).toLocaleString("en-IN", { minimumFractionDigits: 2 });
  if (amount > 0) return { text: `${abs}  देने`, color: "text-blue-800" };
  return { text: `${abs}  लेने`, color: "text-red-700" };
};

/** Table balance column CSS class */
export const balColorClass = (amount) => {
  if (!amount) return "text-stone-400";
  return amount > 0 ? "text-blue-800" : "text-red-700";
};
