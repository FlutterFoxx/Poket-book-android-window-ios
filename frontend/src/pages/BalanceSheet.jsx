import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/contexts/AuthContext";
import { formatBalance, toTitleCase } from "@/utils/helpers";
import { androidExport, androidExportBlob } from "@/utils/androidExport";
import { RefreshCw, Printer, FileSpreadsheet, Camera } from "lucide-react";
import { toast } from "sonner";

// Detect native Android (Capacitor) — double-click only on web/PWA
const isNativeAndroid = () =>
  window.Capacitor?.isNativePlatform?.() &&
  /Android/i.test(navigator.userAgent || "");

const BalanceSheet = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const handleScreenshot = async () => {
    const toastId = toast.loading("Capturing screenshot...");
    try {
      const noCapture = document.querySelectorAll(".no-screenshot");
      noCapture.forEach(n => { n.style.visibility = "hidden"; });
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(document.body, {
        useCORS: true, allowTaint: false, backgroundColor: "#1a1a2e",
        scale: 1.5, logging: false, timeout: 15000, imageTimeout: 5000,
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

  const lena = data?.lena_hai || [];
  const dena = data?.dena_hai || [];
  const nativeAndroid = isNativeAndroid();

  // Party row click handler:
  // Web/PWA → double-click only | Android native → single click
  const makeClickProps = (partyId) => {
    if (nativeAndroid) {
      return { onClick: () => navigate(`/ledger/${partyId}`) };
    }
    return {
      onDoubleClick: () => navigate(`/ledger/${partyId}`),
      title: "Double-click to open ledger",
    };
  };

  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100%",
      background: "#0F172A", fontFamily: "var(--font-body)",
    }}>

      {/* ── Header ─────────────────────────────────────────────── */}
      <div style={{ background: "#0F1D35", color: "#fff", padding: "12px 16px", flexShrink: 0, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>

        {/* Desktop */}
        <div className="hidden md:flex" style={{ alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
          <div>
            <h1 style={{ fontSize: "20px", fontWeight: 800, fontFamily: "var(--font-heading)", margin: 0, letterSpacing: "-0.3px" }}>Balance Sheet</h1>
            <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.55)", margin: "2px 0 0" }}>
              {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button onClick={fetchData} style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "8px", padding: "8px", cursor: "pointer", color: "#fff", display: "flex" }} data-testid="bs-refresh-btn">
              <RefreshCw size={15} />
            </button>
            <button onClick={handlePrint} style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "8px", padding: "7px 13px", cursor: "pointer", color: "#fff", fontSize: "13px", fontWeight: 600, display: "flex", alignItems: "center", gap: "5px" }} data-testid="bs-export-pdf-btn">
              <Printer size={14} /> Print / PDF
            </button>
            <button onClick={handleExcelDownload} style={{ background: "#16A34A", border: "none", borderRadius: "8px", padding: "7px 13px", cursor: "pointer", color: "#fff", fontSize: "13px", fontWeight: 600, display: "flex", alignItems: "center", gap: "5px" }} data-testid="bs-export-excel-btn">
              <FileSpreadsheet size={14} /> Excel
            </button>
            <button onClick={handleScreenshot} style={{ background: "#0891B2", border: "none", borderRadius: "8px", padding: "7px 13px", cursor: "pointer", color: "#fff", fontSize: "13px", fontWeight: 600, display: "flex", alignItems: "center", gap: "5px" }} data-testid="bs-screenshot-btn">
              <Camera size={14} /> Screenshot
            </button>
          </div>
        </div>

        {/* Mobile */}
        <div className="flex md:hidden" style={{ alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
          <div>
            <h1 style={{ fontSize: "18px", fontWeight: 800, fontFamily: "var(--font-heading)", margin: 0 }}>Balance Sheet</h1>
            <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.55)", margin: "2px 0 0" }}>
              {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
            </p>
          </div>
          <button onClick={fetchData} style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "8px", padding: "8px", cursor: "pointer", color: "#fff", display: "flex", flexShrink: 0 }} data-testid="bs-refresh-btn">
            <RefreshCw size={15} />
          </button>
          <button onClick={handleScreenshot} style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "8px", padding: "8px", cursor: "pointer", color: "#fff", display: "flex", flexShrink: 0 }} data-testid="bs-screenshot-btn-mobile">
            <Camera size={15} />
          </button>
        </div>

        {/* Mobile print/excel */}
        <div className="flex md:hidden" style={{ gap: "8px", marginTop: "10px" }}>
          <button onClick={handlePrint} style={{ flex: 1, background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "8px", padding: "10px 8px", cursor: "pointer", color: "#fff", fontSize: "14px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }} data-testid="bs-export-pdf-btn-m">
            <Printer size={16} /> Print / PDF
          </button>
          <button onClick={handleExcelDownload} style={{ flex: 1, background: "#16A34A", border: "none", borderRadius: "8px", padding: "10px 8px", cursor: "pointer", color: "#fff", fontSize: "14px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }} data-testid="bs-export-excel-btn-m">
            <FileSpreadsheet size={16} /> Excel
          </button>
        </div>
      </div>

      {/* ── Double-click hint (web/PWA only) ── */}
      {!nativeAndroid && (
        <div style={{ background: "#1E293B", padding: "4px 16px", fontSize: "11px", color: "rgba(255,255,255,0.35)", textAlign: "center", flexShrink: 0 }}>
          Double-click a party to open ledger
        </div>
      )}

      {/* ── Two independently scrollable columns ── */}
      {loading ? (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "#0F172A" }}>
          <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#3B82F6", borderTopColor: "transparent" }} />
        </div>
      ) : (
        <div style={{ flex: 1, display: "flex", gap: 0, overflow: "hidden", minHeight: 0 }}>

          {/* ── LEFT: DENA HAI (Blue) ── */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", borderRight: "2px solid #1E3A5F", minWidth: 0, overflow: "hidden" }}>
            {/* Section header */}
            <div style={{ background: "#1E3A8A", color: "#fff", padding: "12px 16px", flexShrink: 0 }}>
              <div style={{ fontSize: "18px", fontWeight: 800, letterSpacing: "0.5px" }}>DENA HAI / देना है</div>
              <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.65)", marginTop: "2px" }}>Payable (Blue)</div>
            </div>
            {/* Sub-header */}
            <div style={{ display: "flex", background: "#1E40AF22", borderBottom: "1px solid #1E3A8A44", flexShrink: 0 }}>
              <div style={{ flex: 1, padding: "7px 16px", fontSize: "11px", fontWeight: 700, color: "#93C5FD", textTransform: "uppercase", letterSpacing: "0.8px" }}>Party Name</div>
              <div style={{ padding: "7px 16px", fontSize: "11px", fontWeight: 700, color: "#93C5FD", textTransform: "uppercase", letterSpacing: "0.8px", textAlign: "right" }}>Amount (₹)</div>
            </div>
            {/* Scrollable list */}
            <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
              {dena.length === 0 ? (
                <div style={{ padding: "32px 16px", textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: "14px" }}>Koi Dena party nahi</div>
              ) : dena.map((p, i) => (
                <div key={p.id}
                  {...makeClickProps(p.id)}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "12px 16px",
                    background: i % 2 === 0 ? "#1E293B" : "#162032",
                    borderBottom: "1px solid #1E3A5F55",
                    cursor: nativeAndroid ? "pointer" : "default",
                    transition: "background 0.12s",
                    userSelect: "none",
                  }}
                  onMouseEnter={e => { if (!nativeAndroid) e.currentTarget.style.background = "#1E3A8A33"; }}
                  onMouseLeave={e => { if (!nativeAndroid) e.currentTarget.style.background = i % 2 === 0 ? "#1E293B" : "#162032"; }}
                  data-testid={`dena-name-${p.id}`}>
                  <span style={{ fontSize: "17px", fontWeight: 700, color: "#60A5FA", letterSpacing: "0.2px" }}>{toTitleCase(p.name)}</span>
                  <span style={{ fontSize: "17px", fontWeight: 800, fontFamily: "var(--font-mono)", color: "#60A5FA" }} data-testid={`dena-amount-${p.id}`}>{fmt(p.amount)}</span>
                </div>
              ))}
            </div>
            {/* Footer total */}
            <div style={{ borderTop: "2px solid #1E40AF", background: "#BFDBFE", padding: "11px 16px", display: "flex", justifyContent: "space-between", flexShrink: 0 }}>
              <span style={{ fontSize: "14px", fontWeight: 800, color: "#1E3A8A" }}>Total Dena Hai</span>
              <span style={{ fontSize: "16px", fontWeight: 800, fontFamily: "var(--font-mono)", color: "#1D4ED8" }} data-testid="dena-total">₹{fmt(data.total_payable)}</span>
            </div>
          </div>

          {/* ── RIGHT: LENA HAI (Red) ── */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
            {/* Section header */}
            <div style={{ background: "#7F1D1D", color: "#fff", padding: "12px 16px", flexShrink: 0 }}>
              <div style={{ fontSize: "18px", fontWeight: 800, letterSpacing: "0.5px" }}>LENA HAI / लेना है</div>
              <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.65)", marginTop: "2px" }}>Receivable (Red)</div>
            </div>
            {/* Sub-header */}
            <div style={{ display: "flex", background: "#7F1D1D22", borderBottom: "1px solid #7F1D1D44", flexShrink: 0 }}>
              <div style={{ flex: 1, padding: "7px 16px", fontSize: "11px", fontWeight: 700, color: "#FCA5A5", textTransform: "uppercase", letterSpacing: "0.8px" }}>Party Name</div>
              <div style={{ padding: "7px 16px", fontSize: "11px", fontWeight: 700, color: "#FCA5A5", textTransform: "uppercase", letterSpacing: "0.8px", textAlign: "right" }}>Amount (₹)</div>
            </div>
            {/* Scrollable list */}
            <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
              {lena.length === 0 ? (
                <div style={{ padding: "32px 16px", textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: "14px" }}>Koi Lena party nahi</div>
              ) : lena.map((p, i) => (
                <div key={p.id}
                  {...makeClickProps(p.id)}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "12px 16px",
                    background: i % 2 === 0 ? "#1E293B" : "#1C2030",
                    borderBottom: "1px solid #7F1D1D44",
                    cursor: nativeAndroid ? "pointer" : "default",
                    transition: "background 0.12s",
                    userSelect: "none",
                  }}
                  onMouseEnter={e => { if (!nativeAndroid) e.currentTarget.style.background = "#7F1D1D33"; }}
                  onMouseLeave={e => { if (!nativeAndroid) e.currentTarget.style.background = i % 2 === 0 ? "#1E293B" : "#1C2030"; }}
                  data-testid={`lena-name-${p.id}`}>
                  <span style={{ fontSize: "17px", fontWeight: 700, color: "#FCA5A5", letterSpacing: "0.2px" }}>{toTitleCase(p.name)}</span>
                  <span style={{ fontSize: "17px", fontWeight: 800, fontFamily: "var(--font-mono)", color: "#FCA5A5" }} data-testid={`lena-amount-${p.id}`}>{fmt(p.amount)}</span>
                </div>
              ))}
            </div>
            {/* Footer total */}
            <div style={{ borderTop: "2px solid #991B1B", background: "#FEE2E2", padding: "11px 16px", display: "flex", justifyContent: "space-between", flexShrink: 0 }}>
              <span style={{ fontSize: "14px", fontWeight: 800, color: "#7F1D1D" }}>Total Lena Hai</span>
              <span style={{ fontSize: "16px", fontWeight: 800, fontFamily: "var(--font-mono)", color: "#B91C1C" }} data-testid="lena-total">₹{fmt(data.total_receivable)}</span>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default BalanceSheet;
