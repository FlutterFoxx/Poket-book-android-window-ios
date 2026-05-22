import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "@/contexts/AuthContext";
import { useAuth } from "@/contexts/AuthContext";
import { formatBalance, toTitleCase } from "@/utils/helpers";
import { toast } from "sonner";
import { Plus, ArrowRight, IndianRupee, Cloud, Bell, Download, RefreshCw, CheckCircle, Loader } from "lucide-react";

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [parties, setParties] = useState([]);
  const [sheetsStatus, setSheetsStatus] = useState(null);
  const [backupSettings, setBackupSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [backing, setBacking] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [partiesRes, statusRes, settingsRes] = await Promise.all([
        api.get("/api/parties"),
        api.get("/api/export/sheets-status").catch(() => ({ data: null })),
        api.get("/api/backup/settings").catch(() => ({ data: null })),
      ]);
      setParties(partiesRes.data.slice(0, 8));
      setSheetsStatus(statusRes.data);
      setBackupSettings(settingsRes.data);
    } catch (err) {
      if (process.env.NODE_ENV === "development") { console.error(err); }
    }
    setLoading(false);
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchData(); }, []);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const res = await api.get("/api/oauth/sheets/connect");
      if (res.data.configured && res.data.url) {
        const isNative = window.Capacitor?.isNativePlatform?.() || navigator.userAgent?.includes("wv");
        if (isNative) {
          // Try _system first (Chrome Custom Tabs), then _blank fallback
          const w = window.open(res.data.url, "_system");
          if (!w) window.open(res.data.url, "_blank");
        } else {
          // Web: open in new tab to avoid losing app state
          window.open(res.data.url, "_blank", "noopener,noreferrer");
        }
        toast.info("Google login page opened — complete login and return here", { duration: 4000 });
      } else {
        toast.error(res.data.error || "Google Sheets not configured");
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || "Connection failed — try again");
    }
    setConnecting(false);
  };

  const handleBackupNow = async () => {
    if (!sheetsStatus?.connected) { toast.error("Connect Google Sheets first"); return; }
    setBacking(true);
    try {
      const res = await api.post("/api/export/google-sheets-backup");
      toast.success(`Backup complete! ${res.data.parties_count} parties synced`);
      fetchData();
    } catch (err) { toast.error(err.response?.data?.detail || "Backup failed"); }
    setBacking(false);
  };

  const handleDownloadCSV = async () => {
    try {
      const res = await api.get("/api/export/csv-backup", { responseType: "blob" });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url; a.download = `poketbook_backup_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("CSV backup downloaded!");
    } catch { toast.error("Download failed"); }
  };

  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Subah" : hour < 17 ? "Dopahar" : "Shaam";
  const fmtDate = (d) => { try { return new Date(d).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }); } catch { return ""; } };

  const sub = user?.subscription;
  const subDays = sub?.days_remaining ?? null;
  const subType = sub?.type || "trial";
  const subActive = sub?.is_active;
  const subColor = subDays !== null && subDays <= 3 ? "#EF4444" : subDays !== null && subDays <= 7 ? "#F59E0B" : "#22C55E";

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-page)", fontFamily: "var(--font-body)" }}>

      {/* ── Header ────────────────────────────────────────────── */}
      <div style={{ background: "var(--primary-gradient)", padding: "20px 16px 24px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "13px", marginBottom: "4px" }}>{today}</p>
            <h1 style={{ color: "#fff", fontSize: "22px", fontWeight: 600, fontFamily: "var(--font-heading)" }}>
              {greeting}, {user?.name?.split(" ")[0]} 👋
            </h1>
          </div>
          <button onClick={fetchData} style={{ background: "rgba(255,255,255,0.12)", border: "none", borderRadius: "8px", padding: "8px", cursor: "pointer", color: "#fff" }}>
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "14px" }}>

        {/* ── Quick Actions ─────────────────────────────────────── */}
        <div style={{ display: "flex", gap: "10px" }}>
          <Link to="/parties" style={{ flex: 1, background: "var(--primary)", color: "#fff", border: "none", borderRadius: "10px", padding: "12px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontWeight: 600, fontSize: "14px", textDecoration: "none", justifyContent: "center" }}>
            <Plus size={16} /> New Party
          </Link>
          <Link to="/ledger" style={{ flex: 1, background: "#fff", color: "var(--primary)", border: "0.5px solid var(--border)", borderRadius: "10px", padding: "12px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontWeight: 600, fontSize: "14px", textDecoration: "none", justifyContent: "center" }}>
            <IndianRupee size={16} /> New Entry
          </Link>
        </div>

        {/* ── Subscription Status ───────────────────────────────── */}
        {sub && (
          <div className="pk-card" style={{ borderLeft: `4px solid ${subColor}`, padding: "12px 16px" }} data-testid="subscription-card">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>
                  {subType.toUpperCase()} PLAN
                </p>
                {subDays !== null && subActive ? (
                  <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                    <span style={{ fontSize: "28px", fontWeight: 800, fontFamily: "var(--font-mono)", color: subColor, lineHeight: 1 }}>{subDays}</span>
                    <span style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: 500 }}>days remaining</span>
                  </div>
                ) : (
                  <p style={{ fontSize: "13px", color: "#EF4444", fontWeight: 600 }}>Expired — Renew now</p>
                )}
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ background: subActive ? "#DCFCE7" : "#FEE2E2", color: subActive ? "#166534" : "#991B1B", borderRadius: "20px", padding: "4px 12px", fontSize: "12px", fontWeight: 700 }}>
                  {subActive ? "Active" : "Expired"}
                </span>
                {subDays !== null && subDays <= 7 && subActive && (
                  <p style={{ fontSize: "11px", color: subColor, marginTop: "6px", fontWeight: 600 }}>Renew soon!</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Backup Section ────────────────────────────────────── */}
        <div className="pk-card">
          <h2 style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Cloud size={16} style={{ color: "var(--info)" }} /> Data Backup
          </h2>

          {/* Google Sheets */}
          <div style={{ marginBottom: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "32px", height: "32px", background: "#0F9D58", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Cloud size={16} color="#fff" />
                </div>
                <div>
                  <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>Google Sheets</p>
                  <p style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>
                    {sheetsStatus?.connected
                      ? (backupSettings?.last_backup ? `Last: ${fmtDate(backupSettings.last_backup)}` : "Connected — backup now")
                      : "Not connected"}
                  </p>
                </div>
              </div>
              {sheetsStatus?.connected
                ? <span className="pk-badge pk-badge--green" style={{ fontSize: "11px" }}>Connected ✓</span>
                : <span className="pk-badge pk-badge--gray" style={{ fontSize: "11px" }}>Not connected</span>}
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              {sheetsStatus?.connected ? (
                <>
                  <button onClick={handleBackupNow} disabled={backing}
                    style={{ flex: 1, background: "#0F9D58", color: "#fff", border: "none", borderRadius: "8px", padding: "9px 14px", fontSize: "13px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", opacity: backing ? 0.6 : 1 }}>
                    {backing ? <><Loader size={14} className="animate-spin" /> Syncing...</> : <><RefreshCw size={14} /> Sync Now</>}
                  </button>
                  {sheetsStatus?.sheet_url && (
                    <a href={sheetsStatus.sheet_url} target="_blank" rel="noopener noreferrer"
                      style={{ padding: "9px 14px", fontSize: "13px", fontWeight: 600, color: "#0F9D58", border: "0.5px solid #0F9D58", borderRadius: "8px", textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}>
                      Open ↗
                    </a>
                  )}
                </>
              ) : (
                <button onClick={handleConnect} disabled={connecting}
                  style={{ flex: 1, background: "#0F9D58", color: "#fff", border: "none", borderRadius: "8px", padding: "9px 14px", fontSize: "13px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", opacity: connecting ? 0.6 : 1 }}>
                  {connecting ? <Loader size={14} className="animate-spin" /> : <Cloud size={14} />}
                  {connecting ? "Connecting..." : "Connect Google Sheets"}
                </button>
              )}
            </div>
          </div>

          <div style={{ borderTop: "0.5px solid var(--border)", paddingTop: "12px" }}>
            {/* Auto Email Backup status */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "32px", height: "32px", background: "#EA4335", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Bell size={16} color="#fff" />
                </div>
                <div>
                  <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>Email Backup</p>
                  <p style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>
                    {backupSettings?.backup_frequency && backupSettings.backup_frequency !== "off"
                      ? `${backupSettings.backup_frequency} • ${backupSettings.backup_email}`
                      : "Not scheduled — set in Statement page"}
                  </p>
                </div>
              </div>
              {backupSettings?.backup_frequency && backupSettings.backup_frequency !== "off"
                ? <span className="pk-badge pk-badge--green" style={{ fontSize: "11px" }}>Active</span>
                : <span className="pk-badge pk-badge--gray" style={{ fontSize: "11px" }}>Off</span>}
            </div>

            {/* CSV Download */}
            <button onClick={handleDownloadCSV}
              style={{ width: "100%", background: "var(--bg-page)", border: "0.5px solid var(--border)", borderRadius: "8px", padding: "9px 14px", fontSize: "13px", fontWeight: 600, cursor: "pointer", color: "var(--text-primary)", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
              <Download size={14} /> Download CSV Backup
            </button>
          </div>
        </div>

        {/* ── Recent Parties ───────────────────────────────────── */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <h2 style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-heading)" }}>Recent Parties</h2>
            <Link to="/parties" style={{ fontSize: "13px", color: "var(--info)", textDecoration: "none", display: "flex", alignItems: "center", gap: "4px", fontWeight: 500 }}>
              View all <ArrowRight size={13} />
            </Link>
          </div>

          {loading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={`skeleton-party-${i}`} className="pk-card" style={{ height: "70px", marginBottom: "10px", background: "var(--border-light)" }} />
            ))
          ) : parties.length === 0 ? (
            <div className="pk-card" style={{ textAlign: "center", padding: "32px 16px" }}>
              <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "14px" }}>Koi party nahi hai abhi</p>
              <Link to="/parties" className="pk-btn pk-btn--primary" style={{ textDecoration: "none", display: "inline-flex" }}>
                <Plus size={15} /> Add First Party
              </Link>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {parties.map((p) => {
                const bal = formatBalance(p.current_balance);
                return (
                  <div key={p.id} className="pk-card" onClick={() => navigate(`/ledger/${p.id}`)} style={{ cursor: "pointer" }} data-testid={`party-row-${p.id}`}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <p style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-primary)" }}>{toTitleCase(p.name)}</p>
                      <span style={{ fontSize: "14px", fontWeight: 700, fontFamily: "var(--font-mono)", color: p.current_balance === 0 ? "var(--text-tertiary)" : p.current_balance > 0 ? "var(--dena)" : "var(--lena)" }}>
                        {bal.text}
                      </span>
                    </div>
                    {p.mobile && <p style={{ fontSize: "12px", color: "var(--text-tertiary)", marginTop: "3px", fontFamily: "var(--font-mono)" }}>{p.mobile}</p>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
