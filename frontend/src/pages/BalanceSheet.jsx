import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/contexts/AuthContext";
import { toTitleCase } from "@/utils/helpers";
import { androidExport, androidExportBlob } from "@/utils/androidExport";
import { RefreshCw, Printer, FileSpreadsheet, Camera, Search, X } from "lucide-react";
import { toast } from "sonner";

const isNativeAndroid = () =>
  !!(window.Capacitor?.isNativePlatform?.() && /Android/i.test(navigator.userAgent || ""));

// ── Search bar inside the coloured section header ────────────────────────────
const ColSearch = ({ value, onChange, listId, ownRef, siblingRef, isLeft }) => {
  useEffect(() => { if (ownRef) ownRef.current = inputRef.current; }); // eslint-disable-line
  const inputRef = useRef(null);
  // expose to parent via ownRef
  useEffect(() => { if (ownRef) ownRef.current = inputRef.current; }, []); // eslint-disable-line

  const onKeyDown = (e) => {
    if (e.key === "Escape")    { onChange(""); return; }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      document.getElementById(listId)?.querySelector("[data-row]")?.focus();
      return;
    }
    // Left column → Right arrow jumps to Lena search
    // Right column → Left arrow jumps to Dena search
    if ((isLeft && e.key === "ArrowRight") || (!isLeft && e.key === "ArrowLeft")) {
      e.preventDefault();
      siblingRef?.current?.focus();
    }
  };

  return (
    <div style={{ position: "relative", marginTop: "8px" }}>
      <Search size={13} style={{
        position: "absolute", left: "9px", top: "50%",
        transform: "translateY(-50%)",
        color: "rgba(255,255,255,0.55)", pointerEvents: "none",
      }} />
      <input
        ref={inputRef}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Search parties..."
        aria-label="Search parties"
        aria-controls={listId}
        style={{
          width: "100%", boxSizing: "border-box",
          background: "rgba(255,255,255,0.15)",
          border: "1px solid rgba(255,255,255,0.3)",
          borderRadius: "6px",
          padding: "6px 28px 6px 28px",
          color: "#fff",
          fontSize: "12px", fontWeight: 500,
          outline: "none", caretColor: "#fff",
        }}
      />
      {value && (
        <button onClick={() => { onChange(""); inputRef.current?.focus(); }}
          style={{
            position: "absolute", right: "7px", top: "50%", transform: "translateY(-50%)",
            background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "4px",
            cursor: "pointer", color: "#fff", padding: "1px 4px", display: "flex",
          }}>
          <X size={11} />
        </button>
      )}
    </div>
  );
};

const BalanceSheet = () => {
  const navigate = useNavigate();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchDena, setSearchDena] = useState("");
  const [searchLena, setSearchLena] = useState("");
  const native = isNativeAndroid();

  // refs so each column's search can focus the sibling
  const denaSearchRef = useRef(null);
  const lenaSearchRef = useRef(null);

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

  const filterParties = (list, q) => {
    if (!q || native) return list;
    const lq = q.toLowerCase();
    const sw = list.filter(p => p.name.toLowerCase().startsWith(lq));
    const ct = list.filter(p => !p.name.toLowerCase().startsWith(lq) && p.name.toLowerCase().includes(lq));
    return [...sw, ...ct];
  };

  const allDena = data?.dena_hai || [];
  const allLena = data?.lena_hai || [];
  const dena = filterParties(allDena, searchDena);
  const lena = filterParties(allLena, searchLena);

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

  // row keyboard: ↑↓ within list, Left/Right crosses to sibling search
  const handleRowKey = (e, partyId, listId, isLeft) => {
    if (e.key === "Enter") { navigate(`/ledger/${partyId}`); return; }
    const list = document.getElementById(listId);
    const rows = list ? Array.from(list.querySelectorAll("[data-row]")) : [];
    const idx  = rows.indexOf(e.currentTarget);
    if (e.key === "ArrowDown") { e.preventDefault(); rows[idx + 1]?.focus(); }
    if (e.key === "ArrowUp")   {
      e.preventDefault();
      if (idx === 0) { (isLeft ? denaSearchRef : lenaSearchRef).current?.focus(); }
      else           { rows[idx - 1]?.focus(); }
    }
    // cross to sibling column search
    if ((isLeft && e.key === "ArrowRight") || (!isLeft && e.key === "ArrowLeft")) {
      e.preventDefault();
      (isLeft ? lenaSearchRef : denaSearchRef).current?.focus();
    }
  };

  const rowProps = (partyId, idx, isBlue, listId) => {
    const bg      = isBlue ? (idx % 2 === 0 ? "#fff" : "#F8FAFF") : (idx % 2 === 0 ? "#fff" : "#FFF8F8");
    const hoverBg = isBlue ? "#EFF6FF" : "#FEF2F2";
    const border  = isBlue ? "0.5px solid #DBEAFE" : "0.5px solid #FECACA";
    const isLeft  = isBlue;
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
            onKeyDown: (e) => handleRowKey(e, partyId, listId, isLeft),
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

      {/* ── Columns ──────────────────────────────────────────────────────────── */}
      {loading ? (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} />
        </div>
      ) : (
        <div style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>

          {/* ── DENA HAI (Blue) ─────────────────────────────────────────────── */}
          <div data-col="dena" style={{ flex: 1, display: "flex", flexDirection: "column", borderRight: "2px solid var(--border)", minWidth: 0, overflow: "hidden" }}>

            {/* Section header — search lives inside here */}
            <div style={{ background: "#1E40AF", color: "#fff", padding: "10px 12px", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 700, letterSpacing: "0.5px" }}>DENA HAI / देना है</div>
                  <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.7)", marginTop: "1px" }}>Payable (Blue)</div>
                </div>
                {searchDena && (
                  <span style={{ fontSize: "11px", background: "rgba(255,255,255,0.2)", borderRadius: "4px", padding: "2px 7px", color: "rgba(255,255,255,0.9)" }}>
                    {dena.length} result{dena.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
              {/* Search input embedded in header */}
              {!native && (
                <ColSearch
                  value={searchDena}
                  onChange={setSearchDena}
                  listId="dena-list"
                  ownRef={denaSearchRef}
                  siblingRef={lenaSearchRef}
                  isLeft={true}
                />
              )}
            </div>

            {/* Sub-header */}
            <div style={{ display: "flex", background: "#EFF6FF", borderBottom: "0.5px solid #BFDBFE", flexShrink: 0 }}>
              <div style={{ flex: 1, padding: "6px 4px", fontSize: "12px", fontWeight: 700, color: "#1E40AF", textTransform: "uppercase", letterSpacing: "0.5px" }}>Party Name</div>
              <div style={{ padding: "6px 4px", fontSize: "12px", fontWeight: 700, color: "#1E40AF", textTransform: "uppercase", letterSpacing: "0.5px", textAlign: "right" }}>Amount (₹)</div>
            </div>

            {/* List */}
            <div id="dena-list" style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
              {dena.length === 0 ? (
                <div style={{ padding: "24px 8px", textAlign: "center", color: "var(--text-tertiary)", fontSize: "14px" }}>
                  {searchDena ? `No match for "${searchDena}"` : "Koi Dena party nahi"}
                </div>
              ) : dena.map((p, i) => (
                <div key={p.id} {...rowProps(p.id, i, true, "dena-list")} data-testid={`dena-name-${p.id}`}>
                  <span style={{ fontSize: "14px", fontWeight: 800, color: "#1D4ED8", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{highlight(p.name, searchDena)}</span>
                  <span style={{ fontSize: "14px", fontWeight: 900, color: "#1D4ED8", flexShrink: 0 }} data-testid={`dena-amount-${p.id}`}>{fmt(p.amount)}</span>
                </div>
              ))}
            </div>

            <div style={{ borderTop: "2px solid #BFDBFE", background: "#DBEAFE", padding: "9px 4px", display: "flex", justifyContent: "space-between", flexShrink: 0 }}>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "#1E40AF" }}>Total Dena Hai</span>
              <span style={{ fontSize: "15px", fontWeight: 700, fontFamily: "var(--font-mono)", color: "#1D4ED8" }} data-testid="dena-total">₹{fmt(data.total_payable)}</span>
            </div>
          </div>

          {/* ── LENA HAI (Red) ──────────────────────────────────────────────── */}
          <div data-col="lena" style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>

            {/* Section header — search lives inside here */}
            <div style={{ background: "#991B1B", color: "#fff", padding: "10px 12px", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 700, letterSpacing: "0.5px" }}>LENA HAI / लेना है</div>
                  <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.7)", marginTop: "1px" }}>Receivable (Red)</div>
                </div>
                {searchLena && (
                  <span style={{ fontSize: "11px", background: "rgba(255,255,255,0.2)", borderRadius: "4px", padding: "2px 7px", color: "rgba(255,255,255,0.9)" }}>
                    {lena.length} result{lena.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
              {/* Search input embedded in header */}
              {!native && (
                <ColSearch
                  value={searchLena}
                  onChange={setSearchLena}
                  listId="lena-list"
                  ownRef={lenaSearchRef}
                  siblingRef={denaSearchRef}
                  isLeft={false}
                />
              )}
            </div>

            {/* Sub-header */}
            <div style={{ display: "flex", background: "#FEF2F2", borderBottom: "0.5px solid #FECACA", flexShrink: 0 }}>
              <div style={{ flex: 1, padding: "6px 4px", fontSize: "12px", fontWeight: 700, color: "#991B1B", textTransform: "uppercase", letterSpacing: "0.5px" }}>Party Name</div>
              <div style={{ padding: "6px 4px", fontSize: "12px", fontWeight: 700, color: "#991B1B", textTransform: "uppercase", letterSpacing: "0.5px", textAlign: "right" }}>Amount (₹)</div>
            </div>

            {/* List */}
            <div id="lena-list" style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
              {lena.length === 0 ? (
                <div style={{ padding: "24px 8px", textAlign: "center", color: "var(--text-tertiary)", fontSize: "14px" }}>
                  {searchLena ? `No match for "${searchLena}"` : "Koi Lena party nahi"}
                </div>
              ) : lena.map((p, i) => (
                <div key={p.id} {...rowProps(p.id, i, false, "lena-list")} data-testid={`lena-name-${p.id}`}>
                  <span style={{ fontSize: "14px", fontWeight: 800, color: "#B91C1C", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{highlight(p.name, searchLena)}</span>
                  <span style={{ fontSize: "14px", fontWeight: 900, color: "#B91C1C", flexShrink: 0 }} data-testid={`lena-amount-${p.id}`}>{fmt(p.amount)}</span>
                </div>
              ))}
            </div>

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
