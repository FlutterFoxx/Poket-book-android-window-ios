import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/contexts/AuthContext";
import { formatBalance, toTitleCase } from "@/utils/helpers";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, BookOpen, X, Search, Users, Phone, MapPin } from "lucide-react";

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

  const loadParties = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/parties");
      setParties(res.data);
    } catch (err) {
      if (process.env.NODE_ENV === "development") { console.error(err); }
      toast.error("Parties load nahi hui");
    }
    setLoading(false);
  }, []); // api and state setters are stable — intentional empty deps

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadParties(); }, []);
  useEffect(() => { if (showForm) setTimeout(() => nameRef.current?.focus(), 100); }, [showForm]);

  const openAdd  = () => { setEditParty(null); setFormData(EMPTY); setShowForm(true); };
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

  const filtered = parties.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.mobile?.includes(search));

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-page)", fontFamily: "var(--font-body)" }}>

      {/* ── Header ─────────────────────────────────────────────── */}
      <div style={{ background: "var(--primary-gradient)", padding: "20px 16px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ color: "#fff", fontSize: "20px", fontWeight: 600, fontFamily: "var(--font-heading)" }}>Parties / Khatadar</h1>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", marginTop: "2px" }}>{parties.length} registered</p>
          </div>
          <button onClick={openAdd} className="pk-btn pk-btn--success" style={{ minHeight: "40px", padding: "8px 16px", fontSize: "13px" }} data-testid="add-party-btn">
            <Plus size={16} /> Add Party
          </button>
        </div>
      </div>

      {/* ── Search ─────────────────────────────────────────────── */}
      <div style={{ padding: "14px 16px" }}>
        <div style={{ position: "relative" }}>
          <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-tertiary)" }} />
          <input
            type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Naam ya mobile se search karein..."
            className="pk-input" style={{ paddingLeft: "38px" }}
            data-testid="party-search-input"
          />
        </div>
      </div>

      {/* ── Party Cards ────────────────────────────────────────── */}
      <div style={{ padding: "0 16px 24px", display: "flex", flexDirection: "column", gap: "10px" }} data-testid="parties-table">
        {loading ? (
          Array(4).fill(0).map((_, i) => (
            <div key={`skeleton-${i}`} className="pk-card" style={{ height: "96px", background: "var(--border-light)" }} />
          ))
        ) : filtered.length === 0 ? (
          <div className="pk-card" style={{ textAlign: "center", padding: "40px 16px" }}>
            <Users size={40} style={{ color: "var(--border)", margin: "0 auto 12px" }} />
            <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
              {search ? "Koi party nahi mili" : "Abhi koi party nahi hai — upar se add karein"}
            </p>
          </div>
        ) : filtered.map((p) => {
          const bal = formatBalance(p.current_balance);
          return (
            <div key={p.id} className="pk-card animate-in" data-testid={`party-row-${p.id}`}>
              {/* Top row */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "8px" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "4px" }}>{toTitleCase(p.name)}</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    {p.mobile && (
                      <span style={{ fontSize: "12px", color: "var(--text-tertiary)", display: "flex", alignItems: "center", gap: "4px", fontFamily: "var(--font-mono)" }}>
                        <Phone size={11} /> {p.mobile}
                      </span>
                    )}
                    {p.address && (
                      <span style={{ fontSize: "12px", color: "var(--text-tertiary)", display: "flex", alignItems: "center", gap: "4px" }}>
                        <MapPin size={11} /> {p.address}
                      </span>
                    )}
                  </div>
                </div>
                {/* Actions */}
                <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
                  <button onClick={() => navigate(`/ledger/${p.id}`)} style={{ background: "var(--info-bg)", border: "none", borderRadius: "8px", padding: "8px", cursor: "pointer", color: "var(--info)" }} data-testid={`view-ledger-btn-${p.id}`}>
                    <BookOpen size={15} />
                  </button>
                  <button onClick={() => openEdit(p)} style={{ background: "var(--bg-page)", border: "0.5px solid var(--border)", borderRadius: "8px", padding: "8px", cursor: "pointer", color: "var(--text-secondary)" }} data-testid={`edit-party-btn-${p.id}`}>
                    <Pencil size={15} />
                  </button>
                  {p.is_deletable ? (
                    <button onClick={() => { setDeleteTarget(p); setDeleteText(""); }} style={{ background: "var(--danger-bg)", border: "none", borderRadius: "8px", padding: "8px", cursor: "pointer", color: "var(--danger)" }} data-testid={`delete-party-btn-${p.id}`}>
                      <Trash2 size={15} />
                    </button>
                  ) : (
                    <button title={p.delete_reason} style={{ background: "var(--border-light)", border: "0.5px solid var(--border)", borderRadius: "8px", padding: "8px", cursor: "not-allowed", color: "var(--text-tertiary)" }} data-testid={`delete-party-btn-${p.id}`}>
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
              {/* Balance row */}
              <div style={{ borderTop: "0.5px solid var(--border)", paddingTop: "10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "12px", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 500 }}>Balance</span>
                <span style={{ fontSize: "15px", fontWeight: 700, fontFamily: "var(--font-mono)", color: p.current_balance === 0 ? "var(--text-tertiary)" : p.current_balance > 0 ? "var(--dena)" : "var(--lena)" }} data-testid={`party-balance-${p.id}`}>
                  {bal.text}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Add/Edit Modal ─────────────────────────────────────── */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 50, display: "flex", alignItems: "flex-end", justifyContent: "center", padding: "0" }}
          onClick={(e) => e.target === e.currentTarget && closeForm()}>
          <div style={{ background: "#fff", borderRadius: "20px 20px 0 0", width: "100%", maxWidth: "600px", padding: "24px 20px", paddingBottom: "calc(24px + env(safe-area-inset-bottom))" }} data-testid="party-form-modal">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-heading)" }}>
                {editParty ? "Party Edit Karein" : "Naya Party Add Karein"}
              </h2>
              <button onClick={closeForm} style={{ background: "var(--bg-page)", border: "none", borderRadius: "8px", padding: "8px", cursor: "pointer" }}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label className="pk-label">Naam / Name *</label>
                <input ref={nameRef} type="text" value={formData.name} onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Party ka naam" className="pk-input" data-testid="party-name-input" />
              </div>
              <div>
                <label className="pk-label">Mobile Number</label>
                <input type="tel" value={formData.mobile} onChange={(e) => setFormData((p) => ({ ...p, mobile: e.target.value }))}
                  placeholder="9876543210" className="pk-input" style={{ fontFamily: "var(--font-mono)" }} data-testid="party-mobile-input" />
              </div>
              <div>
                <label className="pk-label">Address / Pata</label>
                <textarea value={formData.address} onChange={(e) => setFormData((p) => ({ ...p, address: e.target.value }))}
                  placeholder="Ghar ya dukaan ka pata" rows={2}
                  className="pk-input" style={{ resize: "none", minHeight: "unset" }} data-testid="party-address-input" />
              </div>
              <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
                <button type="button" onClick={closeForm} className="pk-btn pk-btn--outline" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" disabled={saving} className="pk-btn pk-btn--primary" style={{ flex: 1 }} data-testid="save-party-btn">
                  {saving ? "Saving..." : editParty ? "Update Karein" : "Add Karein"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ───────────────────────────────── */}
      {deleteTarget && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 50, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div style={{ background: "#fff", borderRadius: "20px 20px 0 0", width: "100%", maxWidth: "600px", padding: "24px 20px" }} data-testid="delete-confirm-modal">
            <h3 style={{ fontSize: "17px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "8px" }}>Party Delete Karein?</h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "16px" }}>"{toTitleCase(deleteTarget.name)}" permanently delete ho jaayegi.</p>
            <div style={{ background: "var(--danger-bg)", borderRadius: "8px", padding: "12px 14px", marginBottom: "16px", fontSize: "13px", color: "var(--danger)" }}>
              Yeh action undo nahi hoga.
            </div>
            <label className="pk-label" style={{ marginBottom: "8px" }}>Confirm karne ke liye "DELETE" type karein:</label>
            <input type="text" value={deleteText} onChange={(e) => setDeleteText(e.target.value)}
              placeholder="DELETE" className="pk-input" style={{ fontFamily: "var(--font-mono)", letterSpacing: "2px", marginBottom: "16px", textTransform: "uppercase" }}
              data-testid="delete-confirm-input" autoFocus />
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => { setDeleteTarget(null); setDeleteText(""); }} className="pk-btn pk-btn--outline" style={{ flex: 1 }} data-testid="delete-cancel-btn">Cancel</button>
              <button onClick={handleDelete} disabled={deleteText !== "DELETE"} className="pk-btn pk-btn--danger" style={{ flex: 1, opacity: deleteText !== "DELETE" ? 0.4 : 1 }} data-testid="delete-confirm-btn">
                Delete Karein
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PartyManagement;
