import { Pencil, Trash2 } from "lucide-react";
import { formatDate, formatTime, toTitleCase } from "@/utils/helpers";
import { balLabel, balColorClass } from "./ledgerUtils";

export default function LedgerTable({
  entries, visibleEntries, loading, selectedId,
  selectedEntries, focusedRowIdx,
  toggleEntry, toggleAll, setFocusedRowIdx, setSelectedEntries,
  setEditEntry, setEditForm, setDeleteEntry,
  visibleCount, sentinelRef, tableContainerRef,
}) {
  if (!selectedId) return null;

  return (
    <div className="flex-1" style={{ background: "var(--bg-page)", overflowX: "auto", overflowY: "auto" }} ref={tableContainerRef}>
      {loading ? (
        <div className="flex items-center justify-center h-full">
          <div className="w-8 h-8 border-4 border-stone-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* ── MOBILE: Compact cards < md ── */}
          <div className="block md:hidden">
            {entries.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 80px 90px", gap: "4px", background: "var(--primary)", padding: "6px 12px", fontSize: "10px", fontWeight: 700, color: "rgba(255,255,255,0.8)", letterSpacing: "0.3px", textTransform: "uppercase" }}>
                <span>Date / Party</span>
                <span style={{ textAlign: "right" }}>Credit</span>
                <span style={{ textAlign: "right" }}>Debit</span>
                <span style={{ textAlign: "right" }}>Balance</span>
              </div>
            )}
            <div className="p-2 space-y-1">
              {entries.length === 0 ? (
                <div className="pk-card text-center py-10">
                  <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>Koi entry nahi hai — neeche se add karein</p>
                </div>
              ) : visibleEntries.map((e, idx) => {
                const rowBalColor = e.balance > 0 ? "var(--dena)" : e.balance < 0 ? "var(--lena)" : "var(--text-tertiary)";
                const rowBg = idx % 2 === 0 ? "#FFE8CC" : "#FFDAB0";
                return (
                  <div key={e.id} data-testid={`ledger-row-${e.id}`}
                    style={{ background: rowBg, borderRadius: "6px", overflow: "hidden", border: "0.5px solid #e5c99b" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 80px 90px", gap: "4px", padding: "8px 10px", alignItems: "center" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span style={{ fontSize: "12px", fontWeight: 700, fontFamily: "var(--font-mono)", color: "#374151" }}>{formatDate(e.date)}</span>
                          {e.is_locked && <span style={{ fontSize: "9px", background: "#FEF3C7", color: "#92400E", padding: "1px 5px", borderRadius: "4px", fontWeight: 700 }}>★</span>}
                        </div>
                        <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--dena)", marginTop: "1px" }}>{toTitleCase(e.counterparty_name || "—")}</div>
                        {e.narration && <div style={{ fontSize: "11px", color: "#4B5563", fontStyle: "italic", fontWeight: "700", marginTop: "2px" }}>{e.narration}</div>}
                      </div>
                      <div style={{ textAlign: "right", fontSize: "13px", fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--lena)" }}>
                        {e.naam > 0 ? `₹${e.naam.toLocaleString("en-IN", { minimumFractionDigits: 2 })}` : ""}
                      </div>
                      <div style={{ textAlign: "right", fontSize: "13px", fontFamily: "var(--font-mono)", fontWeight: 700, color: "#166534" }}>
                        {e.jama > 0 ? `₹${e.jama.toLocaleString("en-IN", { minimumFractionDigits: 2 })}` : ""}
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "13px", fontFamily: "var(--font-mono)", fontWeight: 700, color: rowBalColor }}>
                          ₹{Math.abs(e.balance).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </div>
                        <div style={{ fontSize: "10px", color: rowBalColor, fontWeight: 600 }}>
                          {e.balance > 0 ? "देने" : e.balance < 0 ? "लेने" : "बराबर"}
                        </div>
                      </div>
                    </div>
                    {!e.is_locked && (
                      <div style={{ borderTop: "0.5px solid #e5c99b", padding: "5px 10px", display: "flex", gap: "6px", justifyContent: "flex-end", background: "rgba(0,0,0,0.04)" }}>
                        <button onClick={() => { setEditEntry(e); setEditForm({ date: e.date, naam: e.naam || "", jama: e.jama || "", narration: e.narration || "" }); }}
                          style={{ background: "var(--info-bg)", border: "none", borderRadius: "6px", padding: "4px 10px", color: "var(--info)", fontSize: "12px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "3px" }}
                          data-testid={`edit-entry-${e.id}`}>
                          <Pencil size={11} /> Edit
                        </button>
                        <button onClick={() => setDeleteEntry(e)}
                          style={{ background: "var(--danger-bg)", border: "none", borderRadius: "6px", padding: "4px 10px", color: "var(--danger)", fontSize: "12px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "3px" }}
                          data-testid={`delete-entry-${e.id}`}>
                          <Trash2 size={11} /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── DESKTOP: Table md+ ── */}
          <div className="hidden md:block" style={{ minWidth: "700px" }}>
            <table className="min-w-[700px] w-full border-collapse" data-testid="ledger-table">
              <thead style={{ position: "sticky", top: 0, zIndex: 20, background: "var(--primary)" }}>
                <tr style={{ background: "var(--primary)" }} className="text-white">
                  <th className="px-2 sm:px-3 py-1.5 text-center border-r border-amber-900 w-8 sm:w-10">
                    <input type="checkbox" className="w-3.5 h-3.5 sm:w-4 sm:h-4 accent-amber-400 cursor-pointer"
                      checked={entries.filter(e => !e.is_locked).length > 0 && entries.filter(e => !e.is_locked).every(e => selectedEntries.has(e.id))}
                      onChange={toggleAll} data-testid="select-all-checkbox" />
                  </th>
                  <th className="px-2 sm:px-3 py-1.5 text-center text-xs font-bold uppercase border-r border-amber-900 w-10">Sr.</th>
                  <th className="px-3 sm:px-4 py-1.5 text-left text-xs font-bold uppercase border-r border-amber-900 whitespace-nowrap">
                    Date<br /><span className="text-yellow-300 text-xs font-normal normal-case">Time</span>
                  </th>
                  <th className="px-3 sm:px-4 py-1.5 text-left text-xs font-bold uppercase border-r border-amber-900 w-28 sm:w-36">Party</th>
                  <th className="px-3 sm:px-4 py-1.5 text-right text-xs font-bold uppercase border-r border-amber-900">
                    Credit<br /><span className="text-yellow-300 text-xs font-normal">(नाम)</span>
                  </th>
                  <th className="px-3 sm:px-4 py-1.5 text-right text-xs font-bold uppercase border-r border-amber-900">
                    Debit<br /><span className="text-yellow-300 text-xs font-normal">(जमा)</span>
                  </th>
                  <th className="px-3 sm:px-4 py-1.5 text-left text-xs font-bold uppercase border-r border-amber-900 hidden md:table-cell">Narration</th>
                  <th className="px-3 sm:px-4 py-1.5 text-right text-xs font-bold uppercase border-r border-amber-900">Balance</th>
                  <th className="px-2 sm:px-4 py-1.5 text-center text-xs font-bold uppercase border-r border-amber-900 hidden sm:table-cell">T</th>
                  <th className="px-2 sm:px-4 py-1.5 text-center text-xs font-bold uppercase">Edit</th>
                </tr>
              </thead>
              <tbody>
                {selectedEntries.size > 0 && (
                  <tr style={{ background: "#1e3a5f" }}>
                    <td colSpan={10} className="px-4 py-2">
                      <div className="flex items-center gap-4 text-white">
                        <span className="text-sm font-bold">{selectedEntries.size} selected</span>
                        <button onClick={() => setSelectedEntries(new Set())} className="text-xs px-3 py-1 bg-white/20 hover:bg-white/30 rounded" data-testid="clear-selection-btn">Clear</button>
                      </div>
                    </td>
                  </tr>
                )}
                {entries.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-16 text-stone-600 text-base" style={{ background: "var(--bg-page)" }}>
                      Koi entry nahi hai — neeche se pehli entry add karein
                    </td>
                  </tr>
                ) : visibleEntries.map((e, i) => {
                  const bl = balLabel(e.balance);
                  const isSelected = selectedEntries.has(e.id);
                  const isFocused = focusedRowIdx === i;
                  const rowBg = isFocused ? "#FEF3C7" : isSelected ? "#c7d7f0" : (i % 2 === 0 ? "#FFE8CC" : "#FFDAB0");
                  return (
                    <tr key={e.id} onClick={() => setFocusedRowIdx(i)} data-row-idx={i}
                      style={{ background: rowBg, outline: isFocused ? "2px solid #F59E0B" : "none", cursor: "pointer" }}
                      className="border-b border-amber-300" data-testid={`ledger-row-${e.id}`}>
                      <td className="px-2 sm:px-3 py-1 sm:py-1.5 text-center border-r border-amber-200">
                        {!e.is_locked
                          ? <input type="checkbox" checked={isSelected} onChange={() => toggleEntry(e.id)} className="w-3.5 h-3.5 sm:w-4 sm:h-4 accent-blue-600 cursor-pointer" data-testid={`checkbox-${e.id}`} />
                          : <span className="text-stone-300 text-xs">—</span>}
                      </td>
                      <td className="px-3 sm:px-4 py-1 sm:py-1.5 text-center text-xs font-mono text-stone-500 border-r border-amber-200">{i + 1}</td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3 border-r border-amber-200 whitespace-nowrap">
                        <div className="text-base font-mono text-stone-800">{formatDate(e.date)}</div>
                        {e.created_at && <div className="text-xs text-stone-500 font-mono">{formatTime(e.created_at)}</div>}
                      </td>
                      <td className="px-3 sm:px-4 py-1 sm:py-1.5 text-base border-r border-amber-200 font-semibold">
                        {e.counterparty_name
                          ? <span className="text-blue-800">{toTitleCase(e.counterparty_name)}</span>
                          : <span className="text-stone-400 text-sm italic">—</span>}
                      </td>
                      <td className="px-3 sm:px-4 py-1 sm:py-1.5 text-right text-base font-mono font-bold text-red-800 border-r border-amber-200">
                        {e.naam > 0 ? e.naam.toLocaleString("en-IN", { minimumFractionDigits: 2 }) : ""}
                      </td>
                      <td className="px-3 sm:px-4 py-1 sm:py-1.5 text-right text-base font-mono font-bold text-green-900 border-r border-amber-200">
                        {e.jama > 0 ? e.jama.toLocaleString("en-IN", { minimumFractionDigits: 2 }) : ""}
                      </td>
                      <td className="px-3 sm:px-4 py-1 sm:py-1.5 text-base text-stone-800 border-r border-amber-200 max-w-[160px] truncate hidden md:table-cell" style={{ fontWeight: 600 }}>
                        {e.narration || "—"}
                      </td>
                      <td className="px-3 sm:px-4 py-1 sm:py-1.5 text-right border-r border-amber-200">
                        <span className={`text-base font-mono font-bold whitespace-nowrap ${balColorClass(e.balance)}`}>
                          {Math.abs(e.balance).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-center border-r border-amber-200 hidden sm:table-cell">
                        {e.is_locked
                          ? <span className="text-amber-800 font-black text-base" data-testid={`entry-locked-${e.id}`}>*</span>
                          : <span className="text-stone-400">—</span>}
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-center">
                        {!e.is_locked ? (
                          <div className="flex items-center justify-center gap-0.5 sm:gap-1">
                            <button onClick={() => { setEditEntry(e); setEditForm({ date: e.date, naam: e.naam || "", jama: e.jama || "", narration: e.narration || "" }); }}
                              className="p-1 sm:p-1.5 text-stone-600 hover:text-blue-800 hover:bg-blue-100 rounded"
                              data-testid={`edit-entry-${e.id}`}><Pencil size={13} /></button>
                            <button onClick={() => setDeleteEntry(e)}
                              className="p-1 sm:p-1.5 text-red-600 hover:text-red-800 hover:bg-red-100 rounded"
                              data-testid={`delete-entry-${e.id}`}><Trash2 size={13} /></button>
                          </div>
                        ) : <span className="text-stone-400 text-xs">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {visibleCount < entries.length && (
              <div ref={sentinelRef} className="flex items-center justify-center py-3 text-xs text-stone-400">
                Showing {visibleCount}/{entries.length} entries — scroll to load more
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
