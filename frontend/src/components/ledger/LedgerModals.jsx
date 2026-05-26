import { X, Lock } from "lucide-react";
import { toTitleCase } from "@/utils/helpers";

/** Edit Entry Modal */
export function EditEntryModal({ editEntry, editForm, setEditForm, setEditEntry, handleEditSave, saving }) {
  if (!editEntry) return null;
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white shadow-2xl w-full max-w-lg border-2 border-stone-500" data-testid="edit-entry-modal">
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b" style={{ background: "var(--primary)" }}>
          <h2 className="text-base sm:text-lg font-bold text-white">Entry Modify</h2>
          <button onClick={() => setEditEntry(null)}><X size={18} className="text-white" /></button>
        </div>
        <div className="px-4 sm:px-6 py-4 sm:py-5 space-y-3 sm:space-y-4" style={{ background: "#FFE8CC" }}>
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">Date</label>
            <input type="date" value={editForm.date} onChange={e => setEditForm(p => ({ ...p, date: e.target.value }))}
              className="w-full border-2 border-stone-400 px-3 py-2 text-base font-mono bg-white focus:outline-none focus:ring-2 focus:ring-stone-700" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-red-700 mb-1">नाम / Credit (₹)</label>
              <input type="number" step="0.01" min="0" value={editForm.naam} onChange={e => setEditForm(p => ({ ...p, naam: e.target.value }))}
                className="w-full border-2 border-red-300 px-3 py-2 text-base font-mono bg-white text-right focus:outline-none focus:ring-2 focus:ring-red-400" data-testid="edit-naam-input" />
            </div>
            <div>
              <label className="block text-xs font-bold text-green-800 mb-1">जमा / Debit (₹)</label>
              <input type="number" step="0.01" min="0" value={editForm.jama} onChange={e => setEditForm(p => ({ ...p, jama: e.target.value }))}
                className="w-full border-2 border-green-300 px-3 py-2 text-base font-mono bg-white text-right focus:outline-none focus:ring-2 focus:ring-green-500" data-testid="edit-jama-input" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">Narration</label>
            <input type="text" value={editForm.narration} onChange={e => setEditForm(p => ({ ...p, narration: e.target.value }))}
              className="w-full border-2 border-stone-400 px-3 py-2 text-base bg-white focus:outline-none focus:ring-2 focus:ring-stone-700" data-testid="edit-narration-input" />
          </div>
          <div className="flex gap-3 pt-1">
            <button onClick={() => setEditEntry(null)} className="flex-1 border-2 border-stone-400 text-stone-700 py-2 text-sm font-semibold bg-white hover:bg-stone-50 rounded">Cancel</button>
            <button onClick={handleEditSave} disabled={saving} className="flex-1 text-white py-2 text-sm font-bold rounded disabled:opacity-50" style={{ background: "var(--primary)" }} data-testid="edit-entry-save-btn">
              {saving ? "Saving..." : "Modify / Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Delete Confirm Modal */
export function DeleteConfirmModal({ deleteEntry, setDeleteEntry, handleDeleteEntry }) {
  if (!deleteEntry) return null;
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white shadow-2xl w-full max-w-md border-2 border-red-500" data-testid="delete-entry-modal">
        <div className="px-4 sm:px-5 py-3 border-b bg-red-600 text-white text-base font-bold">Entry Delete Karein?</div>
        <div className="px-4 sm:px-6 py-4 sm:py-5" style={{ background: "#FFE8CC" }}>
          <p className="text-sm sm:text-base text-stone-700 mb-4">Yeh entry permanently delete ho jaayegi.</p>
          <div className="flex gap-3">
            <button onClick={() => setDeleteEntry(null)} className="flex-1 border-2 border-stone-400 text-stone-700 py-2 text-sm font-semibold bg-white hover:bg-stone-50 rounded" data-testid="delete-entry-cancel-btn">Cancel</button>
            <button onClick={handleDeleteEntry} className="flex-1 bg-red-600 text-white py-2 text-sm font-bold rounded hover:bg-red-700" data-testid="delete-entry-confirm-btn">Delete</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Tally / Lock Confirm Modal */
export function TallyConfirmModal({ tallyConfirm, setTallyConfirm, unlocked, balInfo, handleTally }) {
  if (!tallyConfirm) return null;
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white shadow-2xl w-full max-w-md border-2 border-amber-600" data-testid="tally-confirm-modal">
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b" style={{ background: "var(--primary)" }}>
          <h3 className="text-base sm:text-lg font-bold text-white">Tally / Lock Karein?</h3>
          <Lock size={18} className="text-white" />
        </div>
        <div className="px-4 sm:px-6 py-4 sm:py-5" style={{ background: "#FFE8CC" }}>
          <p className="text-sm sm:text-base text-stone-700 mb-2">{unlocked} entries lock ho jaayengi.</p>
          <p className={`text-xl font-mono font-bold mb-4 ${balInfo.color}`}>{balInfo.text}</p>
          <div className="bg-amber-50 border border-amber-400 rounded p-3 mb-4 text-xs text-amber-800">Lock hone ke baad entries edit nahi ho sakti.</div>
          <div className="flex gap-3">
            <button onClick={() => setTallyConfirm(false)} className="flex-1 border-2 border-stone-400 text-stone-700 py-2 text-sm font-semibold bg-white hover:bg-stone-50 rounded" data-testid="tally-cancel-btn">Cancel</button>
            <button onClick={handleTally} className="flex-1 text-white py-2 text-sm font-bold rounded" style={{ background: "var(--primary)" }} data-testid="tally-confirm-btn">Lock Karein</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** WhatsApp Date Range Modal */
export function WhatsAppModal({ waModal, setWaModal, waFrom, setWaFrom, waTo, setWaTo, waMode, setWaMode, handleWaSend, partyInfo }) {
  if (!waModal) return null;
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl" style={{ background: "#fff" }}>
        <div className="px-5 py-4 flex items-center justify-between" style={{ background: "#25D366" }}>
          <p className="text-white font-bold text-base">Share Statement on WhatsApp</p>
          <button onClick={() => setWaModal(false)} className="text-white/80 hover:text-white"><X size={18} /></button>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div style={{ display: "flex", background: "#F3F4F6", borderRadius: "10px", padding: "3px" }}>
            {[["latest", "Latest Entries"], ["range", "Custom Range"]].map(([val, label]) => (
              <button key={val} onClick={() => setWaMode(val)}
                style={{ flex: 1, padding: "7px", borderRadius: "8px", border: "none", fontSize: "13px", fontWeight: 600, cursor: "pointer", background: waMode === val ? "#25D366" : "transparent", color: waMode === val ? "#fff" : "#374151" }}>
                {label}
              </button>
            ))}
          </div>
          {waMode === "range" && (
            <div className="space-y-2">
              <div>
                <label className="text-xs font-bold text-stone-600 block mb-1">From Date</label>
                <input type="date" value={waFrom} onChange={e => setWaFrom(e.target.value)} className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs font-bold text-stone-600 block mb-1">To Date</label>
                <input type="date" value={waTo} onChange={e => setWaTo(e.target.value)} className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
          )}
          {waMode === "latest" && (
            <p className="text-xs text-stone-500">Shares all entries for <strong>{toTitleCase(partyInfo?.name)}</strong> — last 7 days.</p>
          )}
          <button onClick={handleWaSend} className="w-full py-3 rounded-xl text-white font-bold text-base" style={{ background: "#25D366" }}>
            Generate & Share PDF
          </button>
        </div>
      </div>
    </div>
  );
}
