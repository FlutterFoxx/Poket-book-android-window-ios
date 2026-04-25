import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/contexts/AuthContext";
import { formatBalance, toTitleCase } from "@/utils/helpers";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, BookOpen, X, Search, Users } from "lucide-react";

const EMPTY = { name: "", mobile: "", address: "" };

const PartyManagement = () => {
  const navigate = useNavigate();
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editParty, setEditParty] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteText, setDeleteText] = useState("");
  const [formData, setFormData] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const nameRef = useRef(null);

  // Renamed from `fetch` to avoid shadowing the global Fetch API (caused blank page)
  const loadParties = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/parties");
      setParties(res.data);
    } catch (err) {
      if (process.env.NODE_ENV === 'development') { console.error("Failed to fetch parties:", err); }
      toast.error("Parties load nahi hui");
    }
    setLoading(false);
  }, []); // api, toast, and state setters are stable — intentional empty dep array

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadParties(); }, []);
  useEffect(() => { if (showForm) setTimeout(() => nameRef.current?.focus(), 100); }, [showForm]);

  const openAdd = () => { setEditParty(null); setFormData(EMPTY); setShowForm(true); };
  const openEdit = (p) => { setEditParty(p); setFormData({ name: p.name, mobile: p.mobile || "", address: p.address || "" }); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditParty(null); setFormData(EMPTY); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) { toast.error("Party ka naam likhein"); return; }
    setSaving(true);
    try {
      if (editParty) { await api.put(`/api/parties/${editParty.id}`, formData); toast.success("Party update ho gayi"); }
      else { await api.post("/api/parties", formData); toast.success("Party add ho gayi"); }
      closeForm(); loadParties();
    } catch (err) { toast.error(err.response?.data?.detail || "Error aaya"); }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (deleteText !== "DELETE") return;
    try {
      await api.delete(`/api/parties/${deleteTarget.id}`);
      toast.success("Party delete ho gayi");
      setDeleteTarget(null); setDeleteText(""); loadParties();
    } catch (err) { toast.error(err.response?.data?.detail || "Delete nahi hua"); }
  };

  const filtered = parties.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) || p.mobile?.includes(search)
  );

  return (
    <div className="p-4 sm:p-8">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-stone-900">Parties / Khatadar</h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">{parties.length} parties registered</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-1.5 sm:gap-2 bg-stone-900 text-white px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium hover:bg-stone-800 rounded-md" data-testid="add-party-btn">
          <Plus size={14} /> <span className="hidden sm:inline">Naya Party Add Karein</span><span className="sm:hidden">Add</span>
        </button>
      </div>

      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Party naam ya mobile search karein..."
          className="w-full max-w-md border border-stone-300 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900 bg-white rounded-md"
          data-testid="party-search-input" />
      </div>

      <div className="bg-white border border-stone-200 rounded-lg overflow-hidden overflow-x-auto">
        <table className="w-full" data-testid="parties-table">
          <thead>
            <tr className="bg-stone-100 border-b border-stone-200">
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-stone-500 uppercase tracking-wide">Naam</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-stone-500 uppercase tracking-wide">Mobile</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-stone-500 uppercase tracking-wide">Address</th>
              <th className="text-right px-4 py-2.5 text-xs font-semibold text-stone-500 uppercase tracking-wide">Balance</th>
              <th className="px-4 py-2.5 text-center text-xs font-semibold text-stone-500 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? Array(5).fill(0).map((_, i) => (
              <tr key={`skeleton-${i}`} className="border-b border-stone-100">
                {[1,2,3,4,5].map((j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-stone-50 rounded animate-pulse"/></td>)}
              </tr>
            )) : filtered.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-12 text-stone-400"><Users size={32} className="mx-auto mb-2 text-stone-200"/>{search ? "Koi party nahi mili" : "Abhi koi party nahi hai"}</td></tr>
            ) : (
              filtered.map((p) => {
                const bal = formatBalance(p.current_balance);
                return (
                  <tr key={p.id} className="border-b border-stone-100 hover:bg-stone-50" data-testid={`party-row-${p.id}`}>
                    <td className="px-4 py-2.5 text-sm font-medium text-stone-900">{toTitleCase(p.name)}</td>
                    <td className="px-4 py-2.5 text-sm text-stone-500 font-mono">{p.mobile || "—"}</td>
                    <td className="px-4 py-2.5 text-sm text-stone-500">{p.address || "—"}</td>
                    <td className="px-4 py-2.5 text-right"><span className={`text-sm font-mono font-semibold ${bal.colorClass}`} data-testid={`party-balance-${p.id}`}>{bal.text}</span></td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => navigate(`/ledger/${p.id}`)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded" data-testid={`view-ledger-btn-${p.id}`} title="Ledger dekho"><BookOpen size={14} /></button>
                        <button onClick={() => openEdit(p)} className="p-1.5 text-stone-600 hover:bg-stone-100 rounded" data-testid={`edit-party-btn-${p.id}`} title="Edit karein"><Pencil size={14} /></button>
                        {p.is_deletable ? (
                          <button
                            onClick={() => { setDeleteTarget(p); setDeleteText(""); }}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                            data-testid={`delete-party-btn-${p.id}`}
                            title="Delete karein"
                          >
                            <Trash2 size={14} />
                          </button>
                        ) : (
                          <span
                            className="p-1.5 text-stone-300 cursor-not-allowed rounded"
                            title={p.delete_reason || "Delete nahi ho sakta"}
                            data-testid={`delete-party-btn-${p.id}`}
                          >
                            <Trash2 size={14} />
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && closeForm()}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md" data-testid="party-form-modal">
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200">
              <h2 className="text-base font-semibold text-stone-900">{editParty ? "Party Edit Karein" : "Naya Party Add Karein"}</h2>
              <button onClick={closeForm} className="text-stone-400 hover:text-stone-600"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">Naam / Name *</label>
                <input ref={nameRef} type="text" value={formData.name} onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Party ka naam" className="w-full border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900 bg-white" data-testid="party-name-input" />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">Mobile Number</label>
                <input type="text" value={formData.mobile} onChange={(e) => setFormData((p) => ({ ...p, mobile: e.target.value }))}
                  placeholder="9876543210" className="w-full border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900 bg-white font-mono" data-testid="party-mobile-input" />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">Address / Pata</label>
                <textarea value={formData.address} onChange={(e) => setFormData((p) => ({ ...p, address: e.target.value }))}
                  placeholder="Ghar ya dukaan ka pata" rows={2}
                  className="w-full border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900 bg-white resize-none" data-testid="party-address-input" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeForm} className="flex-1 border border-stone-300 text-stone-700 py-2 text-sm font-medium hover:bg-stone-50 rounded-md">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 bg-stone-900 text-white py-2 text-sm font-medium hover:bg-stone-800 disabled:opacity-50 rounded-md" data-testid="save-party-btn">
                  {saving ? "Saving..." : editParty ? "Update Karein" : "Add Karein"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6" data-testid="delete-confirm-modal">
            <h3 className="text-base font-semibold text-stone-900 mb-2">Party Delete Karein?</h3>
            <p className="text-sm text-stone-500 mb-4">"{deleteTarget.name}" ko permanently delete karein?</p>
            <div className="bg-red-50 border border-red-200 rounded p-3 mb-4 text-xs text-red-700">Yeh action undo nahi hoga.</div>
            <p className="text-xs text-stone-600 mb-2 font-medium">Confirm karne ke liye "DELETE" type karein:</p>
            <input type="text" value={deleteText} onChange={(e) => setDeleteText(e.target.value)} placeholder="DELETE"
              className="w-full border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 font-mono tracking-widest mb-4"
              data-testid="delete-confirm-input" autoFocus />
            <div className="flex gap-3">
              <button onClick={() => { setDeleteTarget(null); setDeleteText(""); }} className="flex-1 border border-stone-300 text-stone-700 py-2 text-sm rounded-md" data-testid="delete-cancel-btn">Cancel</button>
              <button onClick={handleDelete} disabled={deleteText !== "DELETE"} className="flex-1 bg-red-600 text-white py-2 text-sm rounded-md hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed" data-testid="delete-confirm-btn">Delete Karein</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PartyManagement;
