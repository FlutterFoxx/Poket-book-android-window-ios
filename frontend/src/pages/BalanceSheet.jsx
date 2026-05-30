import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/contexts/AuthContext";
import { formatBalance, toTitleCase } from "@/utils/helpers";
import { androidExport, androidExportBlob } from "@/utils/androidExport";
import { RefreshCw, Printer, FileSpreadsheet, Camera, Search, X } from "lucide-react";
import { toast } from "sonner";

// Web / PWA desktop — all three enhancements apply here
// Native Android (Capacitor) — keep original single-click, no keyboard search
const isNativeAndroid = () =>
  !!(window.Capacitor?.isNativePlatform?.() && /Android/i.test(navigator.userAgent || ""));

const BalanceSheet = () => {
  const navigate = useNavigate();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");   // keyboard search term
  const searchRef = useRef("");                  // mutable ref keeps value in keydown closure

  // ── Keyboard search — only on web/desktop ────────────────────────────────
  useEffect(() => {
    if (isNativeAndroid()) return;

    const onKey = (e) => {
      // Ignore if focus is inside an input / textarea / button
      const tag = document.activeElement?.tagName;
      if (["INPUT","TEXTAREA","SELECT","BUTTON"].includes(tag)) return;
      // Ignore modifier-only combos
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (e.key === "Escape") {
        searchRef.current = "";
        setSearch("");
      } else if (e.key === "Backspace") {
        const next = searchRef.current.slice(0, -1);
        searchRef.current = next;
        setSearch(next);
      } else if (e.key.length === 1) {
        // single printable character
        const next = searchRef.current + e.key;
        searchRef.current = next;
        setSearch(next);
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // ── Data fetch ────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/balance-sheet");
      setData(res.data);
    } catch (err) {
      if (process.env.NODE_ENV === "development") console.error("Balance sheet load failed:", err.message);
    }
    setLoading(false);
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchData(); }, []);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const fmt = (n) => new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2 }).format(Math.abs(n || 0));

  const handlePrint = async () => {
    if (!data) return;
    const date = new Date().toISOString().split("T")[0];
    await androidExport("/api/export/balance-sheet/pdf", `PoketBook_BalanceSheet_${date}.pdf`, "save");
  };

  const handleExcelDownload = async () => {
    const date = new Date().toISOString().split("T")[0];
    await androidExport("/api/export/balance-sheet/excel", `PoketBook_BalanceSheet_${date}.xlsx`, "save");
  };

  const handleScreenshot = async () => {
    const toastId = toast.loading("Capturing screenshot...");
    try {
      const noCapture = document.querySelectorAll(".no-screenshot");
      noCapture.forEach(n => { n.style.visibility = "hidden"; });
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(document.body, {
        useCORS: true, allowTaint: false, backgroundColor: "#ffffff", scale: 1.5,
        logging: false, timeout: 15000, imageTimeout: 5000,
        windowWidth: window.innerWidth, windowHeight: window.innerHeight,
        onclone: (doc) => { doc.querySelectorAll("img").forEach(img => { img.crossOrigin = "anonymous"; }); },
      });
      noCapture.forEach(n => { n.style.visibility = ""; });
      toast.dismiss(toastId);
      canvas.toBlob(async (blob) => {
        const date = new Date().toISOString().split("T")[0];
        await androidExportBlob(blob, `balance-sheet_${date}.png`, "save");
      }, "image/png");
    } catch (err) {
      document.querySelectorAll(".no-screenshot").forEach(n => { n.style.visibility = ""; });
      toast.dismiss(toastId);
      if (process.env.NODE_ENV === "development") console.error(err);
      toast.error("Screenshot failed — try again", { duration: 2500 });
    }
  };

  // ── Filter parties by search (web/desktop only) ───────────────────────────
  const filterParties = (list) => {
    if (!search || isNativeAndroid()) return list;
    const q = search.toLowerCase();
    // Starts-with first, then contains
    const startsWith = list.filter(p => p.name.toLowerCase().startsWith(q));
    const contains   = list.filter(p => !p.name.toLowerCase().startsWith(q) && p.name.toLowerCase().includes(q));
    return [...startsWith, ...contains];
  };

  const allLena = data?.lena_hai || [];
  const allDena = data?.dena_hai || [];
  const lena = filterParties(allLena);
  const dena = filterParties(allDena);
  const native = isNativeAndroid();

  // ── Party row interaction (web: dblclick + Enter; Android: single click) ──
  const rowProps = (partyId, idx, isBlue) => {
    const bg     = isBlue ? (idx % 2 === 0 ? "#fff" : "#F8FAFF") : (idx % 2 === 0 ? "#fff" : "#FFF8F8");
    const hoverBg = isBlue ? "#EFF6FF" : "#FEF2F2";
    const border = isBlue ? "0.5px solid #DBEAFE" : "0.5px solid #FECACA";

    return {
      tabIndex: native ? undefined : 0,
      style: {
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "5px 14px",               // ← compact rows
        background: bg,
        borderBottom: border,
        cursor: native ? "pointer" : "default",
        transition: "background 0.15s",
        outline: "none",
      },
      ...(native
        ? { onClick: () => navigate(`/ledger/${partyId}`) }
        : {
            onDoubleClick: () => navigate(`/ledger/${partyId}`),
            onKeyDown: (e) => { if (e.key === "Enter") navigate(`/ledger/${partyId}`); },
          }
      ),
      onMouseEnter: (e) => { e.currentTarget.style.background = hoverBg; },
      onMouseLeave: (e) => { e.currentTarget.style.background = bg; },
      onFocus:      (e) => { e.currentTarget.style.background = hoverBg; },
      onBlur:       (e) => { e.currentTarget.style.background = bg; },
    };
  };

  // highlight matching chars in party name
  const highlight = (name, q) => {
    if (!q) return toTitleCase(name);
    const idx = name.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return toTitleCase(name);
    const tc = toTitleCase(name);
    return (
      <>
        {tc.slice(0, idx)}
        <mark style={{ background: "#FDE68A", color: "inherit", borderRadius: "2px", padding: "0 1px" }}>
          {tc.slice(idx, idx + q.length)}
        </mark>
        {tc.slice(idx + q.length)}
      </>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--bg-page)", fontFamily: "var(--font-body)" }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ background: "var(--primary-gradient)", color: "#fff", padding: "12px 16px", flexShrink: 0 }}>

        {/* Desktop */}
        <div className="hidden md:flex" style={{ alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
          <div>
            <h1 style={{ fontSize: "18px", fontWeight: 700, fontFamily: "var(--font-heading)", margin: 0 }}>Balance Sheet</h1>
            <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)", margin: "2px 0 0" }}>
              {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button onClick={fetchData} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "8px", padding: "8px", cursor: "pointer", color: "#fff", display: "flex" }} data-testid="bs-refresh-btn"><RefreshCw size={15} /></button>
            <button onClick={handlePrint} style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: "8px", padding: "7px 13px", cursor: "pointer", color: "#fff", fontSize: "13px", fontWeight: 600, display: "flex", alignItems: "center", gap: "5px" }} data-testid="bs-export-pdf-btn"><Printer size={14} /> Print / PDF</button>
            <button onClick={handleExcelDownload} style={{ background: "#16A34A", border: "none", borderRadius: "8px", padding: "7px 13px", cursor: "pointer", color: "#fff", fontSize: "13px", fontWeight: 600, display: "flex", alignItems: "center", gap: "5px" }} data-testid="bs-export-excel-btn"><FileSpreadsheet size={14} /> Excel</button>
            <button onClick={handleScreenshot} style={{ background: "#0891B2", border: "none", borderRadius: "8px", padding: "7px 13px", cursor: "pointer", color: "#fff", fontSize: "13px", fontWeight: 600, display: "flex", alignItems: "center", gap: "5px" }} data-testid="bs-screenshot-btn"><Camera size={14} /> Screenshot</button>
          </div>
        </div>

        {/* Mobile */}
        <div className="flex md:hidden" style={{ alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
          <div>
            <h1 style={{ fontSize: "18px", fontWeight: 700, fontFamily: "var(--font-heading)", margin: 0 }}>Balance Sheet</h1>
            <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)", margin: "2px 0 0" }}>
              {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
            </p>
          </div>
          <button onClick={fetchData} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "8px", padding: "8px", cursor: "pointer", color: "#fff", display: "flex", flexShrink: 0 }} data-testid="bs-refresh-btn"><RefreshCw size={15} /></button>
          <button onClick={handleScreenshot} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "8px", padding: "8px", cursor: "pointer", color: "#fff", display: "flex", flexShrink: 0 }} data-testid="bs-screenshot-btn-mobile"><Camera size={15} /></button>
        </div>

        <div className="flex md:hidden" style={{ gap: "8px", marginTop: "10px" }}>
          <button onClick={handlePrint} style={{ flex: 1, background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: "8px", padding: "10px 8px", cursor: "pointer", color: "#fff", fontSize: "14px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }} data-testid="bs-export-pdf-btn-m"><Printer size={16} /> Print / PDF</button>
          <button onClick={handleExcelDownload} style={{ flex: 1, background: "#16A34A", border: "none", borderRadius: "8px", padding: "10px 8px", cursor: "pointer", color: "#fff", fontSize: "14px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }} data-testid="bs-export-excel-btn-m"><FileSpreadsheet size={16} /> Excel</button>
        </div>
      </div>

      {/* ── Keyboard search bar (web/desktop only, visible when typing) ───── */}
      {!native && search && (
        <div style={{
          background: "#1E3A5F", color: "#fff", padding: "6px 16px",
          display: "flex", alignItems: "center", gap: "8px", flexShrink: 0,
          fontSize: "13px", fontWeight: 600,
        }}>
          <Search size={14} style={{ flexShrink: 0, opacity: 0.7 }} />
          <span style={{ flex: 1 }}>
            Searching: <span style={{ fontFamily: "var(--font-mono)", background: "#FDE68A", color: "#1E293B", borderRadius: "3px", padding: "1px 6px" }}>{search}</span>
            <span style={{ fontWeight: 400, opacity: 0.7, marginLeft: "8px", fontSize: "12px" }}>
              — {dena.length + lena.length} result{dena.length + lena.length !== 1 ? "s" : ""}
            </span>
          </span>
          <button onClick={() => { setSearch(""); searchRef.current = ""; }}
            style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "4px", padding: "3px 6px", cursor: "pointer", color: "#fff", display: "flex", alignItems: "center", gap: "3px", fontSize: "12px" }}>
            <X size={12} /> Clear (Esc)
          </button>
        </div>
      )}

      {/* ── Hint bar (web/desktop, no search active) ───────────────────────── */}
      {!native && !search && !loading && (
        <div style={{ background: "var(--bg-subtle, #F9FAFB)", borderBottom: "0.5px solid var(--border)", padding: "4px 16px", fontSize: "11px", color: "var(--text-tertiary)", flexShrink: 0, display: "flex", gap: "16px" }}>
          <span>Type to search parties</span>
          <span>Double-click or <kbd style={{ background: "#E5E7EB", borderRadius: "3px", padding: "0 4px", fontSize: "10px", fontWeight: 700 }}>Enter</kbd> to open ledger</span>
        </div>
      )}

      {/* ── Two independently scrollable columns ───────────────────────────── */}
      {loading ? (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} />
        </div>
      ) : (
        <div style={{ flex: 1, display: "flex", gap: 0, overflow: "hidden", minHeight: 0 }}>

          {/* ── LEFT: DENA HAI (Blue) ───────────────────────────────────────── */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", borderRight: "2px solid var(--border)", minWidth: 0, overflow: "hidden" }}>
            <div style={{ background: "#1E40AF", color: "#fff", padding: "10px 16px", flexShrink: 0 }}>
              <div style={{ fontSize: "13px", fontWeight: 700, letterSpacing: "0.5px" }}>DENA HAI / देना है</div>
              <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.7)", marginTop: "1px" }}>Payable (Blue)</div>
            </div>
            <div style={{ display: "flex", background: "#EFF6FF", borderBottom: "0.5px solid #BFDBFE", flexShrink: 0 }}>
              <div style={{ flex: 1, padding: "6px 14px", fontSize: "12px", fontWeight: 700, color: "#1E40AF", textTransform: "uppercase", letterSpacing: "0.5px" }}>Party Name</div>
              <div style={{ padding: "6px 14px", fontSize: "12px", fontWeight: 700, color: "#1E40AF", textTransform: "uppercase", letterSpacing: "0.5px", textAlign: "right" }}>Amount (₹)</div>
            </div>
            <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
              {dena.length === 0 ? (
                <div style={{ padding: "24px 16px", textAlign: "center", color: "var(--text-tertiary)", fontSize: "14px" }}>
                  {search ? `No match for "${search}"` : "Koi Dena party nahi"}
                </div>
              ) : dena.map((p, i) => (
                <div key={p.id} {...rowProps(p.id, i, true)} data-testid={`dena-name-${p.id}`}>
                  <span style={{ fontSize: "14px", fontWeight: 600, color: "#1D4ED8" }}>{highlight(p.name, search)}</span>
                  <span style={{ fontSize: "14px", fontWeight: 700, fontFamily: "var(--font-mono)", color: "#1D4ED8" }} data-testid={`dena-amount-${p.id}`}>{fmt(p.amount)}</span>
                </div>
              ))}
            </div>
            <div style={{ borderTop: "2px solid #BFDBFE", background: "#DBEAFE", padding: "9px 14px", display: "flex", justifyContent: "space-between", flexShrink: 0 }}>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "#1E40AF" }}>Total Dena Hai</span>
              <span style={{ fontSize: "15px", fontWeight: 700, fontFamily: "var(--font-mono)", color: "#1D4ED8" }} data-testid="dena-total">₹{fmt(data.total_payable)}</span>
            </div>
          </div>

          {/* ── RIGHT: LENA HAI (Red) ───────────────────────────────────────── */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
            <div style={{ background: "#991B1B", color: "#fff", padding: "10px 16px", flexShrink: 0 }}>
              <div style={{ fontSize: "13px", fontWeight: 700, letterSpacing: "0.5px" }}>LENA HAI / लेना है</div>
              <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.7)", marginTop: "1px" }}>Receivable (Red)</div>
            </div>
            <div style={{ display: "flex", background: "#FEF2F2", borderBottom: "0.5px solid #FECACA", flexShrink: 0 }}>
              <div style={{ flex: 1, padding: "6px 14px", fontSize: "12px", fontWeight: 700, color: "#991B1B", textTransform: "uppercase", letterSpacing: "0.5px" }}>Party Name</div>
              <div style={{ padding: "6px 14px", fontSize: "12px", fontWeight: 700, color: "#991B1B", textTransform: "uppercase", letterSpacing: "0.5px", textAlign: "right" }}>Amount (₹)</div>
            </div>
            <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
              {lena.length === 0 ? (
                <div style={{ padding: "24px 16px", textAlign: "center", color: "var(--text-tertiary)", fontSize: "14px" }}>
                  {search ? `No match for "${search}"` : "Koi Lena party nahi"}
                </div>
              ) : lena.map((p, i) => (
                <div key={p.id} {...rowProps(p.id, i, false)} data-testid={`lena-name-${p.id}`}>
                  <span style={{ fontSize: "14px", fontWeight: 600, color: "#B91C1C" }}>{highlight(p.name, search)}</span>
                  <span style={{ fontSize: "14px", fontWeight: 700, fontFamily: "var(--font-mono)", color: "#B91C1C" }} data-testid={`lena-amount-${p.id}`}>{fmt(p.amount)}</span>
                </div>
              ))}
            </div>
            <div style={{ borderTop: "2px solid #FECACA", background: "#FEE2E2", padding: "9px 14px", display: "flex", justifyContent: "space-between", flexShrink: 0 }}>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "#991B1B" }}>Total Lena Hai</span>
              <span style={{ fontSize: "15px", fontWeight: 700, fontFamily: "var(--font-mono)", color: "#B91C1C" }} data-testid="lena-total">₹{fmt(data.total_receivable)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BalanceSheet;
