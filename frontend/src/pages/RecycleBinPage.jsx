import { useEffect, useState, useCallback } from "react";
import { api } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toTitleCase, formatDate } from "@/utils/helpers";
import { toast } from "sonner";
import { Trash2, RotateCcw, AlertTriangle, BookOpen, Users } from "lucide-react";

export default function RecycleBinPage() {
  const navigate = useNavigate();
  const [data, setData] = useState({ parties: [], entries: [] });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("parties");

  const fetchBin = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/recycle-bin");
      setData(res.data);
    } catch { toast.error("Could not load recycle bin"); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchBin(); }, [fetchBin]);

  const restore = async (type, id, name) => {
    try {
      await api.post(`/api/recycle-bin/restore/${type}/${id}`);
      toast.success(`${name} restored!`, { duration: 2000 });
      fetchBin();
    } catch (err) { toast.error(err.response?.data?.detail || "Restore failed"); }
  };

  const permanentDelete = async (type, id, name) => {
    if (!window.confirm(`Permanently delete "${name}"? This CANNOT be undone.`)) return;
    try {
      await api.delete(`/api/recycle-bin/permanent/${type}/${id}`);
      toast.success(`Permanently deleted`, { duration: 1500 });
      fetchBin();
    } catch { toast.error("Delete failed"); }
  };

  const DaysChip = ({ days }) => (
    <span style={{
      background: days <= 3 ? "#FEE2E2" : days <= 7 ? "#FEF3C7" : "#F0FDF4",
      color: days <= 3 ? "#991B1B" : days <= 7 ? "#92400E" : "#166534",
      fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "20px"
    }}>{days}d left</span>
  );

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-page)", fontFamily: "var(--font-body)" }}>
      {/* Header */}
      <div style={{ background: "var(--primary-gradient)", padding: "16px", color: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Trash2 size={20} />
          <div>
            <h1 style={{ fontSize: "18px", fontWeight: 700, margin: 0 }}>Recycle Bin</h1>
            <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)", margin: 0 }}>
              Deleted items auto-purge in 15 days
            </p>
          </div>
        </div>
        {/* Tabs */}
        <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
          {[["parties", `Parties (${data.parties.length})`, Users], ["entries", `Entries (${data.entries.length})`, BookOpen]].map(([t, label, Icon]) => (
            <button key={t} onClick={() => setTab(t)}
              style={{
                background: tab === t ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.1)",
                border: tab === t ? "1px solid rgba(255,255,255,0.5)" : "1px solid transparent",
                borderRadius: "8px", padding: "6px 14px", color: "#fff", fontSize: "13px",
                fontWeight: tab === t ? 700 : 500, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px"
              }}>
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: "12px", maxWidth: "600px", margin: "0 auto" }}>
        {/* Warning */}
        <div style={{ background: "#FEF3C7", border: "1px solid #F59E0B", borderRadius: "8px", padding: "10px 14px", marginBottom: "12px", display: "flex", gap: "8px", alignItems: "flex-start" }}>
          <AlertTriangle size={16} color="#B45309" style={{ flexShrink: 0, marginTop: "1px" }} />
          <p style={{ fontSize: "12px", color: "#92400E", margin: 0 }}>
            Deleted items are kept for <strong>15 days</strong> and then permanently removed. Restore them before the timer runs out.
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--text-tertiary)" }}>Loading...</div>
        ) : tab === "parties" ? (
          data.parties.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "var(--text-tertiary)" }}>
              <Trash2 size={40} style={{ margin: "0 auto 12px", display: "block", opacity: 0.3 }} />
              <p>No deleted parties</p>
            </div>
          ) : data.parties.map(p => (
            <div key={p.id} className="pk-card" style={{ marginBottom: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ fontWeight: 700, fontSize: "15px", color: "var(--text-primary)", margin: "0 0 2px" }}>{toTitleCase(p.name)}</p>
                  {p.mobile && <p style={{ fontSize: "12px", color: "var(--text-tertiary)", margin: 0 }}>{p.mobile}</p>}
                  <p style={{ fontSize: "11px", color: "var(--text-tertiary)", margin: "4px 0 0" }}>Deleted: {formatDate(p.deleted_at)}</p>
                </div>
                <DaysChip days={p.days_left} />
              </div>
              <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                <button onClick={() => restore("party", p.id, p.name)}
                  style={{ flex: 1, background: "#DCFCE7", border: "none", borderRadius: "8px", padding: "8px", color: "#166534", fontSize: "13px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                  <RotateCcw size={13} /> Restore
                </button>
                <button onClick={() => permanentDelete("party", p.id, p.name)}
                  style={{ flex: 1, background: "#FEE2E2", border: "none", borderRadius: "8px", padding: "8px", color: "#991B1B", fontSize: "13px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                  <Trash2 size={13} /> Delete Forever
                </button>
              </div>
            </div>
          ))
        ) : (
          data.entries.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "var(--text-tertiary)" }}>
              <Trash2 size={40} style={{ margin: "0 auto 12px", display: "block", opacity: 0.3 }} />
              <p>No deleted entries</p>
            </div>
          ) : data.entries.map(e => (
            <div key={e.id} className="pk-card" style={{ marginBottom: "8px", borderLeft: "3px solid var(--border)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <p style={{ fontWeight: 700, fontSize: "14px", margin: "0 0 2px" }}>{formatDate(e.date)}</p>
                  <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0 }}>{toTitleCase(e.counterparty_name || "—")}</p>
                  {e.narration && <p style={{ fontSize: "12px", fontStyle: "italic", color: "var(--text-tertiary)", margin: "2px 0 0" }}>{e.narration}</p>}
                </div>
                <div style={{ textAlign: "right" }}>
                  {e.naam > 0 && <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--lena)", margin: 0 }}>Credit ₹{e.naam.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>}
                  {e.jama > 0 && <p style={{ fontSize: "13px", fontWeight: 700, color: "#166534", margin: 0 }}>Debit ₹{e.jama.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>}
                  <DaysChip days={e.days_left} />
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                <button onClick={() => restore("entry", e.id, "Entry")}
                  style={{ flex: 1, background: "#DCFCE7", border: "none", borderRadius: "8px", padding: "7px", color: "#166534", fontSize: "12px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                  <RotateCcw size={12} /> Restore
                </button>
                <button onClick={() => permanentDelete("entry", e.id, "Entry")}
                  style={{ flex: 1, background: "#FEE2E2", border: "none", borderRadius: "8px", padding: "7px", color: "#991B1B", fontSize: "12px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                  <Trash2 size={12} /> Delete Forever
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
