import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/contexts/AuthContext";
import { formatBalance, toTitleCase } from "@/utils/helpers";
import { RefreshCw, Printer, FileSpreadsheet } from "lucide-react";

const BalanceSheet = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/balance-sheet");
      setData(res.data);
    } catch (err) {
      // Balance sheet failure is non-critical — shows empty state gracefully
      if (err.response?.status !== 401) if (process.env.NODE_ENV === 'development') { console.error("Balance sheet load failed:", err.message); }
    }
    setLoading(false);
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchData(); }, []);

  const fmt = (n) => new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(n || 0));

  // Direct browser print dialog for all devices
  const handlePrint = () => {
    if (!data) return;
    const lenaRows = data.lena_hai.map((p, i) => `<tr style="background:${i%2===0?"#FFE8CC":"#FFDAB0"}">
      <td>${p.name}</td><td style="text-align:right;color:#1e40af;font-weight:700">${fmt(p.amount)}</td></tr>`).join("");
    const denaRows = data.dena_hai.map((p, i) => `<tr style="background:${i%2===0?"#fff5e6":"#fee2e2"}">
      <td>${p.name}</td><td style="text-align:right;color:#991b1b;font-weight:700">${fmt(p.amount)}</td></tr>`).join("");
    const html = `<!DOCTYPE html><html><head><title>Balance Sheet</title><meta charset="utf-8">
<style>
  body { font-family: Arial, sans-serif; font-size: 12px; padding: 16px; }
  h1 { color: #b91c1c; font-size: 16px; margin-bottom: 8px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  table { width: 100%; border-collapse: collapse; }
  th { padding: 6px 8px; text-align: left; font-size: 11px; color: white; }
  td { padding: 5px 8px; border-bottom: 1px solid #f0d9b5; font-size: 11px; }
  .dena-head { background: #b91c1c; } .lena-head { background: #1e40af; }
  .total-row td { font-weight: bold; background: #e2e8f0; }
  @page { margin: 1.5cm; } @media print { button { display:none; } }
</style></head><body>
<h1>Balance Sheet — ${new Date().toLocaleDateString("en-IN")}</h1>
<div class="grid">
  <div>
    <table><thead><tr class="dena-head"><th colspan="2">DENA HAI / देना है (Receivable from them)</th></tr></thead>
    <tbody>${lenaRows}</tbody>
    <tfoot><tr class="total-row"><td>Total</td><td style="text-align:right">${fmt(data.total_receivable)}</td></tr></tfoot>
    </table>
  </div>
  <div>
    <table><thead><tr class="lena-head"><th colspan="2">LENA HAI / लेना है (Payable to them)</th></tr></thead>
    <tbody>${denaRows}</tbody>
    <tfoot><tr class="total-row"><td>Total</td><td style="text-align:right">${fmt(data.total_payable)}</td></tr></tfoot>
    </table>
  </div>
</div>
<div style="margin-top:12px;font-weight:bold">Net Balance: ${formatBalance(data.net_balance).text}</div>
</body></html>`;
    // Use Blob URL instead of document.write to prevent XSS
    const blob = new Blob([html], { type: "text/html; charset=utf-8" });
    const blobUrl = URL.createObjectURL(blob);
    const w = window.open(blobUrl, "_blank", "width=900,height=600");
    if (w) {
      w.addEventListener("load", () => {
        setTimeout(() => { w.print(); URL.revokeObjectURL(blobUrl); }, 500);
      });
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-full bg-[#FDFBF7]">
      <div className="w-8 h-8 border-4 border-stone-700 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const lena = data?.lena_hai || [];
  const dena = data?.dena_hai || [];
  const maxRows = Math.max(lena.length, dena.length, 1);
  const rows = Array.from({ length: maxRows }, (_, i) => ({ lena: lena[i], dena: dena[i] }));

  const filteredRows = rows.filter(row => {
    if (filter === "lena") return !!row.lena;
    if (filter === "dena") return !!row.dena;
    return true;
  });

  return (
    <div className="flex flex-col h-full" style={{ fontFamily: "'Work Sans', sans-serif" }}>

      {/* ── Red Header Bar ─────────────────────────────────────────── */}
      <div className="flex-shrink-0 text-white px-5 py-2 flex items-center gap-6" style={{ background: "#0F172A" }}>
        <h1 className="text-xl font-bold tracking-wide" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>
          Settling Report / Balance Sheet
        </h1>

        {/* Filter toggles */}
        <div className="flex items-center gap-5 ml-4">
          <label className="flex items-center gap-2 text-base cursor-pointer font-medium">
            <input type="radio" name="bs-filter" checked={filter === "all"} onChange={() => setFilter("all")} className="w-4 h-4 accent-white" />
            <span>All Party Show</span>
          </label>
          <label className="flex items-center gap-2 text-base cursor-pointer font-medium">
            <input type="radio" name="bs-filter" checked={filter === "lena"} onChange={() => setFilter("lena")} className="w-4 h-4 accent-white" />
            <span>Only Lena Show</span>
          </label>
          <label className="flex items-center gap-2 text-base cursor-pointer font-medium">
            <input type="radio" name="bs-filter" checked={filter === "dena"} onChange={() => setFilter("dena")} className="w-4 h-4 accent-white" />
            <span>Only Dena Show</span>
          </label>
        </div>

        <div className="ml-auto">
          <span className="text-base font-bold bg-red-800 px-3 py-1.5 rounded">
            {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" })}
          </span>
        </div>
      </div>

      {/* ── Main Two-Column Table — stacks on mobile ─────────────── */}
      <div className="flex-1 overflow-auto bg-white">
        {/* Mobile: Stacked layout — DENA first (left), LENA second (right) */}
        <div className="block md:hidden">
          {/* DENA HAI section — BLUE */}
          <div className="bg-blue-700 text-white px-4 py-2 text-sm font-bold">DENA HAI / देना है</div>
          <table className="w-full border-collapse">
            <thead><tr className="bg-blue-50 border-b border-blue-200">
              <th className="text-left px-4 py-2 text-xs font-bold text-blue-800 uppercase">Name</th>
              <th className="text-right px-4 py-2 text-xs font-bold text-blue-800 uppercase">Amount</th>
            </tr></thead>
            <tbody>
              {dena.map((p, i) => (
                <tr key={p.id} className={`border-b ${i%2===0?"bg-white":"bg-stone-50"}`} onClick={() => navigate(`/ledger/${p.id}`)}>
                  <td className="px-4 py-2.5 text-base font-semibold text-blue-700">{p.name}</td>
                  <td className="px-4 py-2.5 text-right text-base font-mono font-bold text-blue-700">{fmt(p.amount)}</td>
                </tr>
              ))}
              {dena.length === 0 && <tr><td colSpan={2} className="px-4 py-6 text-center text-stone-400 text-sm">Koi party nahi</td></tr>}
            </tbody>
            <tfoot><tr className="bg-blue-100"><td className="px-4 py-2 text-sm font-bold text-blue-800">Total</td><td className="px-4 py-2 text-right text-base font-mono font-bold text-blue-700">{fmt(data?.total_payable)}</td></tr></tfoot>
          </table>

          {/* LENA HAI section — RED */}
          <div className="text-white px-4 py-2 text-sm font-bold mt-2" style={{ background: "#1D4ED8" }}>LENA HAI / लेना है</div>
          <table className="w-full border-collapse">
            <thead><tr className="bg-red-50 border-b border-red-200">
              <th className="text-left px-4 py-2 text-xs font-bold text-red-800 uppercase">Name</th>
              <th className="text-right px-4 py-2 text-xs font-bold text-red-800 uppercase">Amount</th>
            </tr></thead>
            <tbody>
              {lena.map((p, i) => (
                <tr key={p.id} className={`border-b ${i%2===0?"bg-white":"bg-stone-50"}`} onClick={() => navigate(`/ledger/${p.id}`)}>
                  <td className="px-4 py-2.5 text-base font-semibold text-red-700">{p.name}</td>
                  <td className="px-4 py-2.5 text-right text-base font-mono font-bold text-red-700">{fmt(p.amount)}</td>
                </tr>
              ))}
              {lena.length === 0 && <tr><td colSpan={2} className="px-4 py-6 text-center text-stone-400 text-sm">Koi party nahi</td></tr>}
            </tbody>
            <tfoot><tr className="bg-red-100"><td className="px-4 py-2 text-sm font-bold text-red-800">Total</td><td className="px-4 py-2 text-right text-base font-mono font-bold text-red-700">{fmt(data?.total_receivable)}</td></tr></tfoot>
          </table>
        </div>

        {/* Desktop: LEFT=DENA(BLUE), RIGHT=LENA(RED) */}
        <table className="hidden md:table w-full border-collapse" data-testid="balance-sheet-table">
          <thead className="sticky top-0 z-10">
            <tr className="bg-stone-200 border-b-2 border-stone-500">
              {/* LEFT — DENA HAI = BLUE (we owe them = they are Lena = we Dena to them) */}
              <th className="text-left px-5 py-3 text-base font-bold text-blue-900 uppercase tracking-wide border-r border-stone-300 w-[40%]">
                Name (Dena Hai / देना है)
              </th>
              <th className="text-right px-5 py-3 text-base font-bold text-blue-900 uppercase tracking-wide border-r-4 border-stone-500 w-[10%]">
                Amount
              </th>
              {/* RIGHT — LENA HAI = RED (they owe us = they are Dena = we Lena from them) */}
              <th className="text-left px-5 py-3 text-base font-bold text-red-800 uppercase tracking-wide border-r border-stone-300 w-[40%]">
                Name (Lena Hai / लेना है)
              </th>
              <th className="text-right px-5 py-3 text-base font-bold text-red-800 uppercase tracking-wide w-[10%]">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-20 text-stone-500 text-xl">Koi party nahi hai</td></tr>
            ) : filteredRows.map((row, i) => {
              const rowKey = `${row.dena?.id ?? "no-dena"}-${row.lena?.id ?? "no-lena"}-${i}`;
              return (
              <tr key={rowKey} className={`border-b border-stone-200 ${i%2===0?"bg-white":"bg-stone-50"} hover:bg-blue-50 transition-colors`}>
                {/* LEFT — dena_hai data — BLUE */}
                <td className="px-5 py-3 border-r border-stone-200 w-[40%]">
                  {row.dena ? <button onClick={() => navigate(`/ledger/${row.dena.id}`)} className="text-lg font-semibold text-blue-700 hover:underline text-left w-full" data-testid={`dena-name-${row.dena.id}`}>{toTitleCase(row.dena.name)}</button> : null}
                </td>
                <td className="px-5 py-3 text-right border-r-4 border-stone-400 w-[10%]">
                  {row.dena ? <span className="text-lg font-mono font-bold text-blue-800" data-testid={`dena-amount-${row.dena.id}`}>{fmt(row.dena.amount)}</span> : null}
                </td>
                {/* RIGHT — lena_hai data — RED */}
                <td className="px-5 py-3 border-r border-stone-200 w-[40%]">
                  {row.lena ? <button onClick={() => navigate(`/ledger/${row.lena.id}`)} className="text-lg font-semibold text-red-700 hover:underline text-left w-full" data-testid={`lena-name-${row.lena.id}`}>{toTitleCase(row.lena.name)}</button> : null}
                </td>
                <td className="px-5 py-3 text-right w-[10%]">
                  {row.lena ? <span className="text-lg font-mono font-bold text-red-800" data-testid={`lena-amount-${row.lena.id}`}>{fmt(row.lena.amount)}</span> : null}
                </td>
              </tr>
            );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 border-t-2 border-stone-500 bg-stone-100">
        {/* Totals Row: LEFT=Dena(BLUE), RIGHT=Lena(RED) — compact size */}
        <div className="flex items-center border-b border-stone-400 flex-wrap">
          <div className="flex-1 min-w-[200px] flex items-center px-3 sm:px-5 py-1.5 sm:py-2 gap-2 sm:gap-3 border-r-4 border-stone-500">
            <span className="text-xs sm:text-sm font-bold text-stone-700">Total Dena Hai :-</span>
            <span className="text-base sm:text-lg font-mono font-bold text-blue-800" data-testid="dena-total">{fmt(data?.total_payable)}</span>
            <span className="ml-auto text-xs text-stone-500 font-semibold">[{dena.length}]</span>
          </div>
          <div className="flex-1 min-w-[200px] flex items-center px-3 sm:px-5 py-1.5 sm:py-2 gap-2 sm:gap-3">
            <span className="text-xs sm:text-sm font-bold text-stone-700">Total Lena Hai :-</span>
            <span className="text-base sm:text-lg font-mono font-bold text-red-700" data-testid="lena-total">{fmt(data?.total_receivable)}</span>
            <span className="ml-auto text-xs text-stone-500 font-semibold">[{lena.length}]</span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-2 flex-wrap">
          {/* Party counts */}
          <div className="flex items-center gap-2 border border-stone-300 bg-white px-3 py-1 rounded text-sm">
            <span className="font-bold text-blue-700">{dena.length}</span>
            <span className="text-stone-300">|</span>
            <span className="font-bold text-red-600">{lena.length}</span>
          </div>

          {/* Net balance — Barabar in italic muted style */}
          <div className="flex items-center gap-2 bg-white border border-stone-300 rounded px-3 py-1">
            <span className="text-sm font-bold text-stone-600">Net Balance :-</span>
            <span
              className={`text-base font-mono font-bold ${
                data?.net_balance === 0 ? "text-stone-400 italic font-normal" : formatBalance(data?.net_balance).colorClass
              }`}
              style={data?.net_balance === 0 ? { fontFamily: "Georgia, serif", letterSpacing: "0.02em" } : {}}
              data-testid="bs-net-balance"
            >
              {formatBalance(data?.net_balance).text}
            </span>
          </div>

          <div className="flex-1" />

          {/* Action buttons */}
          <button onClick={fetchData}
            className="flex items-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 text-sm sm:text-base font-semibold border-2 border-stone-400 bg-white hover:bg-stone-50 rounded transition-colors"
            data-testid="bs-refresh-btn">
            <RefreshCw size={14} /> <span className="hidden sm:inline">Refresh</span>
          </button>

          <button onClick={handlePrint}
            className="flex items-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 text-sm sm:text-base font-bold bg-stone-700 text-white hover:bg-stone-800 rounded transition-colors"
            data-testid="bs-export-pdf-btn">
            <Printer size={14} /> <span className="hidden sm:inline">Print / PDF</span><span className="sm:hidden">Print</span>
          </button>

          <a href={`${process.env.REACT_APP_BACKEND_URL}/api/export/balance-sheet/excel`} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 text-sm sm:text-base font-bold bg-green-700 text-white hover:bg-green-800 rounded transition-colors"
            data-testid="bs-export-excel-btn">
            <FileSpreadsheet size={14} /> <span className="hidden sm:inline">Excel Export</span><span className="sm:hidden">Excel</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default BalanceSheet;
