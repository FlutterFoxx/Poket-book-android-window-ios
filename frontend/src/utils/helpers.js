// Core accounting convention:
// balance = prev + naam (credit) - jama (debit)
// NAAM (credit) = DENA for party (they gave credit = they owe = BLUE)
// JAMA (debit)  = LENA for party (they received credit = they're owed = RED)
// positive balance → DENA HAI (BLUE) — they gave on credit, they will pay
// negative balance → LENA HAI (RED)  — they received credit, they will receive back
export const formatBalance = (amount) => {
  if (amount === 0 || amount === null || amount === undefined) {
    return { text: "₹0 Barabar", colorClass: "text-stone-400 italic", bgClass: "bg-stone-100", type: "settled" };
  }
  const abs = new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(amount));
  if (amount > 0) {
    // positive = DENA HAI = BLUE (gave credit, will pay)
    return { text: `₹${abs} Dena Hai`, colorClass: "text-blue-800", bgClass: "bg-blue-50", type: "dena" };
  }
  // negative = LENA HAI = RED (received credit, will receive back)
  return { text: `₹${abs} Lena Hai`, colorClass: "text-red-700", bgClass: "bg-red-50", type: "lena" };
};

export const formatDate = (dateStr) => {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  } catch { return dateStr; }
};

export const formatTime = (dateStr) => {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    // Force IST (Asia/Kolkata) for consistent display regardless of browser locale
    return d.toLocaleTimeString("en-IN", {
      hour: "2-digit", minute: "2-digit", second: "2-digit",
      hour12: true, timeZone: "Asia/Kolkata"
    });
  } catch { return ""; }
};

export const today = () => new Date().toISOString().split("T")[0];

// Title Case: "RAJ KUMAR & SONS" → "Raj Kumar & Sons"
export const toTitleCase = (str) => {
  if (!str) return "";
  return str.toLowerCase().split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
};
