import { Lock, Printer, MessageCircle, Camera, ChevronDown, ChevronUp } from "lucide-react";
import { toTitleCase } from "@/utils/helpers";

export default function LedgerHeader({
  partyInfo, selectedId, parties, showHeader, setShowHeader,
  showFullAccount, setShowFullAccount, handlePartyChange,
  currentBalance, balInfo, unlocked, sharingPdf,
  handleWhatsAppShare, handlePrint, handleScreenshot, setTallyConfirm,
  entries, totalNaam, totalJama,
}) {
  return (
    <>
      {/* ── Mobile: collapse toggle ── */}
      <div className="flex-shrink-0 md:hidden">
        <button
          onClick={() => setShowHeader(h => !h)}
          data-testid="header-toggle-btn"
          style={{ width: "100%", background: "var(--primary)", border: "none", padding: "5px 12px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.1)" }}
        >
          <span style={{ color: "#fff", fontSize: "12px", fontWeight: 600 }}>
            {partyInfo ? toTitleCase(partyInfo.name) : "Settling Entry"}
          </span>
          <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "11px", display: "flex", alignItems: "center", gap: "4px" }}>
            {showHeader ? "Hide" : "Show"} {showHeader ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
          </span>
        </button>
      </div>

      {/* ── Collapsible upper bars ── */}
      <div className={`flex-shrink-0 ${showHeader ? "" : "hidden md:flex"}`}>
        {/* Control bar — Settling Entry title bar removed */}
        <div className="flex-shrink-0 bg-stone-100 border-b-2 border-stone-400 px-2 sm:px-3 py-1 flex items-center gap-1.5 sm:gap-3 flex-wrap">
          {/* Full/Only toggle */}
          <div className="flex items-center bg-stone-200 rounded-full p-0.5 gap-0">
            <button onClick={() => setShowFullAccount(true)}
              className={`px-2.5 py-1 rounded-full text-xs sm:text-sm font-bold transition-all ${showFullAccount ? "bg-blue-700 text-white shadow" : "text-stone-600"}`}
              data-testid="toggle-full">Full</button>
            <button onClick={() => setShowFullAccount(false)}
              className={`px-2.5 py-1 rounded-full text-xs sm:text-sm font-bold transition-all ${!showFullAccount ? "bg-blue-700 text-white shadow" : "text-stone-600"}`}
              data-testid="toggle-only">Only</button>
          </div>

          {/* Party dropdown */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-sm sm:text-base font-bold text-purple-700 hidden md:inline">Party Name</span>
            <div className="relative">
              <select value={selectedId}
                onChange={e => handlePartyChange(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && e.target.value) {
                    e.preventDefault();
                    // Move focus to fast-entry naam input after party is loaded
                    setTimeout(() => {
                      document.querySelector('[data-testid="fast-entry-naam-input"]')?.focus();
                    }, 100);
                  }
                }}
                className="appearance-none border-2 border-stone-400 bg-white px-2 sm:px-3 py-1.5 sm:py-2 text-sm sm:text-base font-semibold focus:outline-none focus:ring-2 focus:ring-stone-700 pr-7 max-w-[150px] sm:max-w-none"
                data-testid="party-selector">
                <option value="">-- Party --</option>
                {parties.map(p => <option key={p.id} value={p.id}>{toTitleCase(p.name)}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-500 pointer-events-none" />
            </div>
          </div>

          {/* Balance display */}
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs sm:text-base font-bold text-stone-700">
              <span className="inline sm:hidden">Bal:-</span>
              <span className="hidden sm:inline">Balance:-</span>
            </span>
            <div className={`font-mono font-bold text-base sm:text-lg px-2 sm:px-3 py-1.5 sm:py-2 border-2 border-stone-500 bg-white ${balInfo.color} whitespace-nowrap`} data-testid="current-balance-display">
              {selectedId ? balInfo.text : "0.00"}
            </div>
          </div>

          {/* Action buttons */}
          {selectedId && (
            <div className="flex items-center flex-wrap gap-1">
              {unlocked > 0 && (
                <button onClick={() => setTallyConfirm(true)}
                  className="flex items-center gap-1 px-2 py-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded transition-colors"
                  data-testid="tally-lock-btn">
                  <Lock size={12} /> <span className="hidden lg:inline">Tally</span> ({unlocked})
                </button>
              )}
              <button onClick={handleWhatsAppShare} disabled={sharingPdf}
                className="flex items-center gap-1 px-2 py-1.5 text-xs font-bold text-white rounded disabled:opacity-50"
                style={{ background: "#25D366" }} data-testid="whatsapp-share-btn">
                <MessageCircle size={13} className={sharingPdf ? "animate-spin" : ""} />
                <span className="hidden md:inline">{sharingPdf ? "..." : "Share"}</span>
              </button>
              <button onClick={handlePrint}
                className="flex items-center gap-1 px-2 py-1.5 text-xs font-bold bg-stone-600 text-white hover:bg-stone-700 rounded"
                data-testid="export-pdf-btn">
                <Printer size={12} /> <span className="hidden lg:inline">PDF</span>
              </button>
              <button onClick={handleScreenshot}
                className="flex items-center gap-1 px-2 py-1.5 text-xs font-bold text-white rounded"
                style={{ background: "#0891B2" }} data-testid="screenshot-btn">
                <Camera size={12} /> <span className="hidden lg:inline">Shot</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Keyboard shortcuts legend (desktop) ── */}
      <div className="hidden md:flex flex-shrink-0 items-center gap-3 px-4 py-1 text-xs text-stone-500 border-b border-stone-200" style={{ background: "#FAFAF9" }}>
        <span className="font-bold text-stone-600 mr-1">Shortcuts:</span>
        {[["F1","New Party"],["F4","Edit Entry"],["F5","Tally Lock"],["ESC","Close Modal"],["↑↓","Navigate Rows"]].map(([k, v]) => (
          <span key={k} className="flex items-center gap-1">
            <kbd className="bg-stone-200 text-stone-700 font-mono font-bold px-1.5 py-0.5 rounded text-xs border border-stone-300">{k}</kbd>
            <span>{v}</span>
          </span>
        ))}
      </div>

      {/* ── Full account info band ── */}
      {showFullAccount && partyInfo && selectedId && (
        <div className="flex-shrink-0 bg-amber-50 border-b border-amber-200 px-3 sm:px-5 py-2 flex flex-wrap items-center gap-3 sm:gap-6 text-sm">
          <div><span className="font-bold text-stone-700">Party:</span> <span className="text-stone-800">{toTitleCase(partyInfo.name)}</span></div>
          {partyInfo.mobile && <div><span className="font-bold text-stone-700">Mobile:</span> <span className="font-mono">{partyInfo.mobile}</span></div>}
          {partyInfo.address && <div className="hidden md:block"><span className="font-bold text-stone-700">Address:</span> <span className="text-stone-600">{partyInfo.address}</span></div>}
          <div><span className="font-bold text-stone-700">Entries:</span> <span>{entries.length}</span></div>
          <div><span className="font-bold text-stone-700">Total Credit:</span> <span className="text-red-700 font-mono font-bold">{totalNaam}</span></div>
          <div><span className="font-bold text-stone-700">Total Debit:</span> <span className="text-green-800 font-mono font-bold">{totalJama}</span></div>
        </div>
      )}
    </>
  );
}
