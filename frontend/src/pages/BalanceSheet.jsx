import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/contexts/AuthContext";
import { toTitleCase } from "@/utils/helpers";
import { androidExport, androidExportBlob } from "@/utils/androidExport";
import { RefreshCw, Printer, FileSpreadsheet, Camera, Search, X } from "lucide-react";
import { toast } from "sonner";

// Web / PWA desktop — enhanced interactions
// Native Android (Capacitor) — keep original single-click, no search boxes
const isNativeAndroid = () =>
  !!(window.Capacitor?.isNativePlatform?.() && /Android/i.test(navigator.userAgent || ""));

// ── Reusable column search input ──────────────────────────────────────────────
const ColSearch = ({ value, onChange, color, rowListId }) => (
  <div style={{
    display: "flex", alignItems: "center", gap: "6px",
    background: "#fff", borderBottom: `2px solid ${color}`,
    padding: "5px 6px", flexShrink: 0,
  }}>
    <Search size={13} style={{ color, flexShrink: 0, opacity: 0.6 }} />
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder="Search parties..."
      aria-label="Search parties"
      aria-controls={rowListId}
      onKeyDown={e => {
        if (e.key === "Escape") { onChange(""); }
        if (e.key === "ArrowDown") {
          e.preventDefault();
          // move focus to first row in the list
          const list = document.getElementById(rowListId);
          const first = list?.querySelector("[data-row]");
          if (first) first.focus();
        }
      }}
      style={{
        flex: 1, border: "none", outline: "none",
        fontSize: "13px", fontWeight: 500, color: "#1F2937",
        background: "transparent",
      }}
    />
    {value && (
      <button onClick={() => onChange("")} tabIndex={-1}
        style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", padding: "0 2px", display: "flex" }}>
        <X size={12} />
      </button>
    )}
  </div>
);

const BalanceSheet = () => {
  const navigate = useNavigate();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchDena, setSearchDena] = useState("");
  const [searchLena, setSearchLena] = useState("");
  const native = isNativeAndroid();

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

  // ── Filter with starts-with priority ─────────────────────────────────────
  const filterParties = (list, q) => {
    if (!q || native) return list;
    const lq = q.toLowerCase();
    const startsWith = list.filter(p => p.name.toLowerCase().startsWith(lq));
    const contains   = list.filter(p => !p.name.toLowerCase().startsWith(lq) && p.name.toLowerCase().includes(lq));
    return [...startsWith, ...contains];
  };

  const allDena = data?.dena_hai || [];
  const allLena = data?.lena_hai || [];
  const dena = filterParties(allDena, searchDena);
  const lena = filterParties(allLena, searchLena);

  // ── Highlight matching text ───────────────────────────────────────────────
  const highlight = (name, q) => {
    if (!q) return toTitleCase(name);
    const tc = toTitleCase(name);
    const idx = tc.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return tc;
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

  // ── Row keyboard navigation helper ───────────────────────────────────────
  const handleRowKeyDown = (e, partyId, listId) => {
    if (e.key === "Enter") { navigate(`/ledger/${partyId}`); return; }
    const list = document.getElementById(listId);
    if (!list) return;
    const rows = Array.from(list.querySelectorAll("[data-row]"));
    const idx  = rows.indexOf(e.currentTarget);
    if (e.key === "ArrowDown") { e.preventDefault(); rows[idx + 1]?.focus(); }
    if (e.key === "ArrowUp")   {
      e.preventDefault();
      if (idx === 0) {
        // jump back to the search input
        list.closest("[data-col]")?.querySelector("input")?.focus();
      } else {
        rows[idx - 1]?.focus();
      }
    }
  };

  // ── Party row props ───────────────────────────────────────────────────────
  const rowProps = (partyId, idx, isBlue, listId) => {
    const bg      = isBlue ? (idx % 2 === 0 ? "#fff" : "#F8FAFF") : (idx % 2 === 0 ? "#fff" : "#FFF8F8");
    const hoverBg = isBlue ? "#EFF6FF" : "#FEF2F2";
    const border  = isBlue ? "0.5px solid #DBEAFE" : "0.5px solid #FECACA";
    return {
      "data-row": true,
      tabIndex: native ? undefined : 0,
      style: {
        display: "flex", alignItems: "center", gap: "12px",
        padding: "5px 4px",
        background: bg, borderBottom: border,
        cursor: native ? "pointer" : "default",
        transition: "background 0.15s", outline: "none",
      },
      ...(native
        ? { onClick: () => navigate(`/ledger/${partyId}`) }
        : {
            onDoubleClick: () => navigate(`/ledger/${partyId}`),
            onKeyDown: (e) => handleRowKeyDown(e, partyId, listId),
          }
      ),
      onMouseEnter: (e) => { e.currentTarget.style.background = hoverBg; },
      onMouseLeave: (e) => { e.currentTarget.style.background = bg; },
      onFocus:      (e) => { e.currentTarget.style.background = hoverBg; },
      onBlur:       (e) => { e.currentTarget.style.background = bg; },
    };
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

      {/* ── Two independently scrollable columns ───────────────────────────── */}
      {loading ? (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} />
        </div>
      ) : (
        <div style={{ flex: 1, display: "flex", gap: 0, overflow: "hidden", minHeight: 0 }}>

          {/* ── LEFT: DENA HAI (Blue) ─────────────────────────────────────────── */}
          <div data-col="dena" style={{ flex: 1, display: "flex", flexDirection: "column", borderRight: "2px solid var(--border)", minWidth: 0, overflow: "hidden" }}>
            {/* Section header */}
            <div style={{ background: "#1E40AF", color: "#fff", padding: "10px 16px", flexShrink: 0 }}>
              <div style={{ fontSize: "13px", fontWeight: 700, letterSpacing: "0.5px" }}>DENA HAI / देना है</div>
              <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.7)", marginTop: "1px" }}>Payable (Blue)</div>
            </div>

            {/* Search box — web/desktop only */}
            {!native && (
              <ColSearch
                value={searchDena}
                onChange={setSearchDena}
                color="#1E40AF"
                rowListId="dena-list"
              />
            )}

            {/* Column sub-header */}
            <div style={{ display: "flex", background: "#EFF6FF", borderBottom: "0.5px solid #BFDBFE", flexShrink: 0 }}>
              <div style={{ flex: 1, padding: "6px 4px", fontSize: "12px", fontWeight: 700, color: "#1E40AF", textTransform: "uppercase", letterSpacing: "0.5px" }}>Party Name</div>
              <div style={{ padding: "6px 4px", fontSize: "12px", fontWeight: 700, color: "#1E40AF", textTransform: "uppercase", letterSpacing: "0.5px", textAlign: "right" }}>Amount (₹)</div>
            </div>

            {/* Scrollable list */}
            <div id="dena-list" style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
              {dena.length === 0 ? (
                <div style={{ padding: "24px 8px", textAlign: "center", color: "var(--text-tertiary)", fontSize: "14px" }}>
                  {searchDena ? `No match for "${searchDena}"` : "Koi Dena party nahi"}
                </div>
              ) : dena.map((p, i) => (
                <div key={p.id} {...rowProps(p.id, i, true, "dena-list")} data-testid={`dena-name-${p.id}`}>
                  <span style={{ fontSize: "14px", fontWeight: 800, color: "#1D4ED8", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{highlight(p.name, searchDena)}</span>
                  <span style={{ fontSize: "14px", fontWeight: 800, fontFamily: "var(--font-mono)", color: "#1D4ED8", flexShrink: 0 }} data-testid={`dena-amount-${p.id}`}>{fmt(p.amount)}</span>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div style={{ borderTop: "2px solid #BFDBFE", background: "#DBEAFE", padding: "9px 4px", display: "flex", justifyContent: "space-between", flexShrink: 0 }}>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "#1E40AF" }}>Total Dena Hai</span>
              <span style={{ fontSize: "15px", fontWeight: 700, fontFamily: "var(--font-mono)", color: "#1D4ED8" }} data-testid="dena-total">₹{fmt(data.total_payable)}</span>
            </div>
          </div>

          {/* ── RIGHT: LENA HAI (Red) ─────────────────────────────────────────── */}
          <div data-col="lena" style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
            {/* Section header */}
            <div style={{ background: "#991B1B", color: "#fff", padding: "10px 16px", flexShrink: 0 }}>
              <div style={{ fontSize: "13px", fontWeight: 700, letterSpacing: "0.5px" }}>LENA HAI / लेना है</div>
              <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.7)", marginTop: "1px" }}>Receivable (Red)</div>
            </div>

            {/* Search box — web/desktop only */}
            {!native && (
              <ColSearch
                value={searchLena}
                onChange={setSearchLena}
                color="#991B1B"
                rowListId="lena-list"
              />
            )}

            {/* Column sub-header */}
            <div style={{ display: "flex", background: "#FEF2F2", borderBottom: "0.5px solid #FECACA", flexShrink: 0 }}>
              <div style={{ flex: 1, padding: "6px 4px", fontSize: "12px", fontWeight: 700, color: "#991B1B", textTransform: "uppercase", letterSpacing: "0.5px" }}>Party Name</div>
              <div style={{ padding: "6px 4px", fontSize: "12px", fontWeight: 700, color: "#991B1B", textTransform: "uppercase", letterSpacing: "0.5px", textAlign: "right" }}>Amount (₹)</div>
            </div>

            {/* Scrollable list */}
            <div id="lena-list" style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
              {lena.length === 0 ? (
                <div style={{ padding: "24px 8px", textAlign: "center", color: "var(--text-tertiary)", fontSize: "14px" }}>
                  {searchLena ? `No match for "${searchLena}"` : "Koi Lena party nahi"}
                </div>
              ) : lena.map((p, i) => (
                <div key={p.id} {...rowProps(p.id, i, false, "lena-list")} data-testid={`lena-name-${p.id}`}>
                  <span style={{ fontSize: "14px", fontWeight: 800, color: "#B91C1C", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{highlight(p.name, searchLena)}</span>
                  <span style={{ fontSize: "14px", fontWeight: 800, fontFamily: "var(--font-mono)", color: "#B91C1C", flexShrink: 0 }} data-testid={`lena-amount-${p.id}`}>{fmt(p.amount)}</span>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div style={{ borderTop: "2px solid #FECACA", background: "#FEE2E2", padding: "9px 4px", display: "flex", justifyContent: "space-between", flexShrink: 0 }}>
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
