import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "@/contexts/AuthContext";
import { useAuth } from "@/contexts/AuthContext";
import { formatBalance, toTitleCase } from "@/utils/helpers";
import { toast } from "sonner";
import { RefreshCw, Plus, ArrowRight, TrendingUp, TrendingDown, Users, IndianRupee } from "lucide-react";

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bs, setBs] = useState(null);
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [bsRes, partiesRes] = await Promise.all([
        api.get("/api/balance-sheet"),
        api.get("/api/parties"),
      ]);
      setBs(bsRes.data);
      setParties(partiesRes.data.slice(0, 10));
    } catch (err) {
      if (process.env.NODE_ENV === "development") { console.error(err); }
    }
    setLoading(false);
  }, []); // api and state setters are stable — intentional empty deps

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchData(); }, []);

  const fmt = (n) => new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2 }).format(Math.abs(n || 0));
  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Subah" : hour < 17 ? "Dopahar" : "Shaam";

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-page)", fontFamily: "var(--font-body)" }}>

      {/* ── Header ────────────────────────────────────────────── */}
      <div style={{ background: "var(--primary-gradient)", padding: "20px 16px 24px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "20px" }}>
          <div>
            <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "13px", marginBottom: "4px" }}>{today}</p>
            <h1 style={{ color: "#fff", fontSize: "22px", fontWeight: 600, fontFamily: "var(--font-heading)" }}>
              {greeting}, {user?.name?.split(" ")[0]} 👋
            </h1>
          </div>
          <button onClick={fetchData} style={{ background: "rgba(255,255,255,0.12)", border: "none", borderRadius: "8px", padding: "8px", cursor: "pointer", color: "#fff", display: "flex", alignItems: "center" }} data-testid="dashboard-refresh-btn">
            <RefreshCw size={16} />
          </button>
        </div>

        {/* ── Metric cards row ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          {/* You'll Get (Lena) */}
          <div style={{ background: "rgba(255,255,255,0.10)", borderRadius: "12px", padding: "14px 12px", border: "0.5px solid rgba(255,255,255,0.15)" }}>
            <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "11px", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>Lena Hai</p>
            <p style={{ color: "#fff", fontSize: "22px", fontWeight: 700, fontFamily: "var(--font-mono)", lineHeight: 1.2 }} data-testid="stat-total-receivable">
              {loading ? "—" : `₹${fmt(bs?.total_receivable)}`}
            </p>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "11px", marginTop: "2px" }}>{bs?.dena_hai?.length || 0} parties</p>
          </div>

          {/* You'll Give (Dena) */}
          <div style={{ background: "rgba(255,255,255,0.10)", borderRadius: "12px", padding: "14px 12px", border: "0.5px solid rgba(255,255,255,0.15)" }}>
            <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "11px", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>Dena Hai</p>
            <p style={{ color: "#fff", fontSize: "22px", fontWeight: 700, fontFamily: "var(--font-mono)", lineHeight: 1.2 }} data-testid="stat-total-payable">
              {loading ? "—" : `₹${fmt(bs?.total_payable)}`}
            </p>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "11px", marginTop: "2px" }}>{bs?.lena_hai?.length || 0} parties</p>
          </div>

          {/* Net Balance */}
          <div style={{ background: "rgba(255,255,255,0.10)", borderRadius: "12px", padding: "14px 12px", border: "0.5px solid rgba(255,255,255,0.15)" }}>
            <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "11px", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>Net Balance</p>
            {loading ? <p style={{ color: "#fff", fontSize: "22px", fontWeight: 700, fontFamily: "var(--font-mono)" }}>—</p> : (
              <p style={{ fontSize: "22px", fontWeight: 700, fontFamily: "var(--font-mono)", lineHeight: 1.2, color: bs?.net_balance === 0 ? "rgba(255,255,255,0.6)" : "#fff" }} data-testid="stat-net-balance">
                ₹{fmt(bs?.net_balance)}
              </p>
            )}
          </div>

          {/* Total Parties */}
          <div style={{ background: "rgba(255,255,255,0.10)", borderRadius: "12px", padding: "14px 12px", border: "0.5px solid rgba(255,255,255,0.15)" }}>
            <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "11px", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>Parties</p>
            <p style={{ color: "#fff", fontSize: "22px", fontWeight: 700, fontFamily: "var(--font-mono)", lineHeight: 1.2 }} data-testid="stat-total-parties">
              {loading ? "—" : parties.length}
            </p>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "11px", marginTop: "2px" }}>khatadar</p>
          </div>
        </div>
      </div>

      {/* ── Quick Actions ─────────────────────────────────────── */}
      <div style={{ padding: "16px 16px 0" }}>
        <div style={{ display: "flex", gap: "10px" }}>
          <Link to="/parties" style={{ flex: 1, background: "var(--primary)", color: "#fff", border: "none", borderRadius: "10px", padding: "12px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontWeight: 500, fontSize: "14px", textDecoration: "none", justifyContent: "center" }}>
            <Plus size={16} /> New Party
          </Link>
          <Link to="/ledger" style={{ flex: 1, background: "#fff", color: "var(--primary)", border: "0.5px solid var(--border)", borderRadius: "10px", padding: "12px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontWeight: 500, fontSize: "14px", textDecoration: "none", justifyContent: "center" }}>
            <IndianRupee size={16} /> New Entry
          </Link>
        </div>
      </div>

      {/* ── Party list ───────────────────────────────────────── */}
      <div style={{ padding: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
          <h2 style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-heading)" }}>Parties / Khatadar</h2>
          <Link to="/parties" style={{ fontSize: "13px", color: "var(--info)", textDecoration: "none", display: "flex", alignItems: "center", gap: "4px", fontWeight: 500 }}>
            Sab dekhein <ArrowRight size={13} />
          </Link>
        </div>

        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {[1,2,3].map(i => (
              <div key={i} className="pk-card" style={{ height: "72px", background: "var(--border-light)", animation: "pulse 1.5s infinite" }} />
            ))}
          </div>
        ) : parties.length === 0 ? (
          <div className="pk-card" style={{ textAlign: "center", padding: "40px 16px" }}>
            <Users size={40} style={{ color: "var(--border)", margin: "0 auto 12px" }} />
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "16px" }}>Koi party nahi hai abhi</p>
            <Link to="/parties" className="pk-btn pk-btn--primary" style={{ textDecoration: "none" }}>
              <Plus size={16} /> Pehli party add karein
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {parties.map((p) => {
              const bal = formatBalance(p.current_balance);
              return (
                <div
                  key={p.id}
                  className="pk-card animate-in"
                  onClick={() => navigate(`/ledger/${p.id}`)}
                  style={{ cursor: "pointer" }}
                  data-testid={`party-row-${p.id}`}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "10px" }}>
                    <div>
                      <p style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "2px" }}>{toTitleCase(p.name)}</p>
                      {p.mobile && <p style={{ fontSize: "12px", color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>{p.mobile}</p>}
                    </div>
                    {/* Entry count badge */}
                    <span className="pk-badge pk-badge--blue" style={{ fontSize: "11px" }}>
                      {p.has_unlocked_entries ? "Active" : "Settled"}
                    </span>
                  </div>
                  <div style={{ borderTop: "0.5px solid var(--border)", paddingTop: "10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>Balance</span>
                    <span style={{
                      fontSize: "15px", fontWeight: 700, fontFamily: "var(--font-mono)",
                      color: p.current_balance === 0 ? "var(--text-tertiary)" : p.current_balance > 0 ? "var(--dena)" : "var(--lena)"
                    }} data-testid={`party-balance-${p.id}`}>
                      {bal.text}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
