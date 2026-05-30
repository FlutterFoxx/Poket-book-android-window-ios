import { ChevronDown, ChevronUp } from "lucide-react";
import { toTitleCase } from "@/utils/helpers";

export default function FastEntryPanel({
  selectedId, parties, fastEntry, setFastEntry,
  saving, isEntryOpen, setIsEntryOpen, liveTime,
  handleSave, handleFastPartyChange, handleFastKeyDown,
  naamRef, jamaRef, narrationRef, partySelectRef, saveRef,
  unlocked, entries,
}) {
  if (!selectedId) return null;

  const otherParties = parties.filter(p => p.id !== selectedId);
  const balStr = (bal) =>
    bal > 0 ? ` [₹${Math.abs(bal).toLocaleString("en-IN", { maximumFractionDigits: 0 })} Dena]`
    : bal < 0 ? ` [₹${Math.abs(bal).toLocaleString("en-IN", { maximumFractionDigits: 0 })} Lena]`
    : " [0]";

  return (
    <div className="flex-shrink-0" style={{ background: "var(--primary)" }} data-testid="fast-entry-row">

      {/* ── MOBILE: Curtain panel < md ── */}
      <div className="block md:hidden">
        <button onClick={() => setIsEntryOpen(o => !o)} data-testid="entry-panel-toggle"
          style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", background: "var(--primary)", border: "none", cursor: "pointer", borderTop: isEntryOpen ? "none" : "2px solid rgba(255,255,255,0.2)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "6px", height: "6px", background: "#22C55E", borderRadius: "50%" }} className="animate-pulse" />
            <span style={{ color: "#fff", fontWeight: 700, fontSize: "14px" }}>New Entry</span>
            {!isEntryOpen && (
              <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "11px" }}>
                {liveTime.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}
              </span>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#fff" }}>
            {isEntryOpen ? <><span style={{ fontSize: "12px", opacity: 0.7 }}>Hide</span><ChevronDown size={18} /></> : <><span style={{ fontSize: "12px", opacity: 0.7 }}>Open</span><ChevronUp size={18} /></>}
          </div>
        </button>

        <div style={{ maxHeight: isEntryOpen ? "600px" : "0px", overflow: "hidden", transition: "max-height 0.3s ease" }}>
          <div className="pk-card" style={{ margin: "0 12px 12px", padding: "0", overflow: "hidden", fontFamily: "var(--font-body)", fontSize: "var(--app-font-size, 13px)" }}>
            <div style={{ padding: "14px", display: "flex", flexDirection: "column", gap: "12px" }}>
              {/* Date + Party */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label className="pk-label">Date</label>
                  <input type="date" value={fastEntry.date} onChange={e => setFastEntry(p => ({ ...p, date: e.target.value }))}
                    onKeyDown={e => handleFastKeyDown(e, naamRef)} tabIndex={1}
                    className="pk-input" style={{ fontFamily: "var(--font-mono)", fontSize: "13px" }} data-testid="fast-entry-date" />
                </div>
                <div>
                  <label className="pk-label">Party Name</label>
                  <div style={{ position: "relative" }}>
                    <select ref={partySelectRef} value={fastEntry.partyId}
                      onChange={e => {
                        const val = e.target.value;
                        handleFastPartyChange(val);
                        if (val) setTimeout(() => naamRef.current?.focus(), 50);
                      }}
                      tabIndex={0}
                      className="pk-input" style={{ appearance: "none", paddingRight: "28px", fontSize: "13px", fontWeight: 600 }}
                      data-testid="fast-entry-party-select">
                      <option value="">Select party</option>
                      {otherParties.map(p => <option key={p.id} value={p.id}>{toTitleCase(p.name)}{balStr(p.current_balance)}</option>)}
                    </select>
                    <ChevronDown size={14} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-tertiary)", pointerEvents: "none" }} />
                  </div>
                </div>
              </div>
              {/* Naam + Jama */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label className="pk-label" style={{ color: "var(--lena)" }}>Credit (नाम)</label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--lena)", fontWeight: 700, fontSize: "14px" }}>₹</span>
                    <input ref={naamRef} type="number" step="0.01" min="0" value={fastEntry.naam}
                      onChange={e => setFastEntry(p => ({ ...p, naam: e.target.value }))}
                      onKeyDown={e => handleFastKeyDown(e, jamaRef)} tabIndex={2} placeholder="0.00"
                      className="pk-input" style={{ paddingLeft: "28px", fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--lena)", textAlign: "right" }}
                      data-testid="fast-entry-naam-input" />
                  </div>
                </div>
                <div>
                  <label className="pk-label" style={{ color: "#166534" }}>Debit (जमा)</label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#166534", fontWeight: 700, fontSize: "14px" }}>₹</span>
                    <input ref={jamaRef} type="number" step="0.01" min="0" value={fastEntry.jama}
                      onChange={e => setFastEntry(p => ({ ...p, jama: e.target.value }))}
                      onKeyDown={e => handleFastKeyDown(e, narrationRef)} tabIndex={3} placeholder="0.00"
                      className="pk-input" style={{ paddingLeft: "28px", fontFamily: "var(--font-mono)", fontWeight: 700, color: "#166534", textAlign: "right" }}
                      data-testid="fast-entry-jama-input" />
                  </div>
                </div>
              </div>
              {/* Narration */}
              <div>
                <label className="pk-label">Narration / Vivaran</label>
                <input ref={narrationRef} type="text" value={fastEntry.narration}
                  onChange={e => setFastEntry(p => ({ ...p, narration: e.target.value }))}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleSave(); } else if (e.key === "Tab") { e.preventDefault(); saveRef.current?.focus(); } }}
                  tabIndex={4} placeholder="Optional: describe this entry..."
                  className="pk-input" style={{ fontWeight: 700 }} data-testid="fast-entry-narration-input" />
              </div>
              <button ref={saveRef} onClick={handleSave} disabled={saving} tabIndex={5}
                className="pk-btn pk-btn--success" style={{ width: "100%", fontSize: "15px", minHeight: "48px", borderRadius: "var(--radius-sm)" }}
                data-testid="fast-entry-save-btn">
                {saving ? "Saving..." : "Save Entry (OK)"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── DESKTOP: Horizontal bar md+ ── */}
      <div className="hidden md:flex flex-wrap items-end gap-2 px-4 py-3">
        {/* Live Clock + Date */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 bg-black/25 rounded px-2 py-1 border border-white/20">
            <div className="text-white font-mono text-xs font-bold">
              {liveTime.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true, timeZone: "Asia/Kolkata" })}
            </div>
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
          </div>
          <input type="date" value={fastEntry.date} onChange={e => setFastEntry(p => ({ ...p, date: e.target.value }))}
            onKeyDown={e => handleFastKeyDown(e, naamRef)} tabIndex={1}
            className="border-2 border-stone-600 px-2 py-1.5 text-sm font-mono bg-white focus:outline-none focus:ring-2 focus:ring-stone-900 w-36 sm:w-40"
            data-testid="fast-entry-date" />
          <span className="text-xs font-bold text-white text-center">Date</span>
        </div>
        {/* Party */}
        <div className="flex flex-col gap-1">
          <div className="relative">
            <select ref={partySelectRef} value={fastEntry.partyId}
              onChange={e => {
                const val = e.target.value;
                handleFastPartyChange(val);
                if (val) setTimeout(() => naamRef.current?.focus(), 50);
              }}
              tabIndex={0}
              className="appearance-none border-2 border-stone-600 px-2 py-1.5 text-sm font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-stone-900 w-44 pr-6"
              data-testid="fast-entry-party-select">
              <option value="">-- Party --</option>
              {otherParties.map(p => <option key={p.id} value={p.id}>{toTitleCase(p.name)}{balStr(p.current_balance)}</option>)}
            </select>
            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-500 pointer-events-none" />
          </div>
          <span className="text-xs font-bold text-white text-center">Party Name</span>
        </div>
        {/* Naam */}
        <div className="flex flex-col gap-1">
          <input ref={naamRef} type="number" step="0.01" min="0" value={fastEntry.naam}
            onChange={e => setFastEntry(p => ({ ...p, naam: e.target.value }))}
            onKeyDown={e => handleFastKeyDown(e, jamaRef)} tabIndex={2} placeholder="0.00"
            className="border-2 border-stone-600 px-2 py-1.5 text-sm font-mono font-bold bg-white focus:outline-none focus:ring-2 focus:ring-red-600 w-28 text-right"
            data-testid="fast-entry-naam-input" />
          <span className="text-xs font-bold text-white text-center">नाम (Credit)</span>
        </div>
        {/* Jama */}
        <div className="flex flex-col gap-1">
          <input ref={jamaRef} type="number" step="0.01" min="0" value={fastEntry.jama}
            onChange={e => setFastEntry(p => ({ ...p, jama: e.target.value }))}
            onKeyDown={e => handleFastKeyDown(e, narrationRef)} tabIndex={3} placeholder="0.00"
            className="border-2 border-stone-600 px-2 py-1.5 text-sm font-mono font-bold bg-white focus:outline-none focus:ring-2 focus:ring-green-700 w-28 text-right"
            data-testid="fast-entry-jama-input" />
          <span className="text-xs font-bold text-white text-center">जमा (Debit)</span>
        </div>
        {/* Narration */}
        <div className="flex flex-col gap-1 flex-1 min-w-[120px]">
          <input ref={narrationRef} type="text" value={fastEntry.narration}
            onChange={e => setFastEntry(p => ({ ...p, narration: e.target.value }))}
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleSave(); } else if (e.key === "Tab") { e.preventDefault(); saveRef.current?.focus(); } }}
            tabIndex={4} placeholder="Narration..."
            className="border-2 border-stone-600 px-2 py-1.5 text-sm font-bold bg-white focus:outline-none focus:ring-2 focus:ring-stone-900"
            data-testid="fast-entry-narration-input" />
          <span className="text-xs font-bold text-white text-center">Narration</span>
        </div>
        {/* OK button */}
        <div className="flex flex-col gap-1.5 pb-5">
          <button ref={saveRef} onClick={handleSave} disabled={saving} tabIndex={5}
            className="px-6 py-2 bg-white border-2 border-stone-700 text-stone-900 text-sm font-bold hover:bg-stone-100 disabled:opacity-50"
            data-testid="fast-entry-save-btn">{saving ? "..." : "OK"}</button>
        </div>
      </div>

      {/* Status strip */}
      <div className="px-4 py-1 flex items-center gap-6 text-xs text-white border-t border-white/10" style={{ background: "rgba(0,0,0,0.2)" }}>
        <span className="font-bold">Entries: {entries.length}</span>
        <span>|</span>
        <span className="font-bold">Locked: {entries.filter(e => e.is_locked).length}</span>
        <span>|</span>
        <span className="font-bold">Open: {unlocked}</span>
      </div>
    </div>
  );
}
