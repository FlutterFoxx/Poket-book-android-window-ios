import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "@/contexts/AuthContext";
import { useAuth } from "@/contexts/AuthContext";
import { formatBalance, toTitleCase } from "@/utils/helpers";
import { downloadBlob } from "@/utils/saveFile";
import { toast } from "sonner";
import { Plus, ArrowRight, IndianRupee, Download, RefreshCw, CheckCircle, Cloud, Mail, AlertTriangle } from "lucide-react";

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [driveStatus, setDriveStatus] = useState(null); // null | {connected, last_backup}
  const [connectingDrive, setConnectingDrive] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [sendingVerification, setSendingVerification] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [partiesRes, driveRes] = await Promise.all([
        api.get("/api/parties"),
        api.get("/api/backup/drive-status").catch(() => ({ data: null })),
      ]);
      setParties(partiesRes.data.slice(0, 8));
      setDriveStatus(driveRes.data);
    } catch (err) {
      if (process.env.NODE_ENV === "development") console.error(err);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Re-check Drive status when user returns from OAuth tab
  useEffect(() => {
    const onFocus = () => {
      api.get("/api/backup/drive-status").then(r => { if (r.data) setDriveStatus(r.data); }).catch(() => {});
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const handleConnectDrive = async () => {
    setConnectingDrive(true);
    try {
      const res = await api.get("/api/oauth/sheets/connect");
      if (res.data.url) {
        const isNative = window.Capacitor?.isNativePlatform?.() || /wv|WebView/i.test(navigator.userAgent);
        window.open(res.data.url, isNative ? "_system" : "_blank", "noopener,noreferrer");
        toast.info("Complete Google sign-in and return here", { duration: 4000 });
      } else {
        toast.error(res.data.error || "Google Drive not configured");
      }
    } catch { toast.error("Connection failed"); }
    setConnectingDrive(false);
  };

  const handleSyncNow = async () => {
    setSyncing(true);
    try {
      await api.post("/api/backup/drive-sync");
      toast.success("Google Drive backup updated!", { duration: 2000 });
      fetchData();
    } catch { toast.error("Sync failed — try again"); }
    setSyncing(false);
  };

  const handleDownloadCSV = async () => {
    try {
      const res = await api.get("/api/export/csv-backup", { responseType: "blob" });
      const date = new Date().toISOString().split("T")[0];
      await downloadBlob(res.data, `PoketBook_Backup_${date}.csv`);
    } catch { toast.error("Download failed"); }
  };

  const handleSendVerification = async () => {
    setSendingVerification(true);
    try {
      await api.post("/api/auth/resend-verification");
      toast.success("Verification email sent! Check your inbox.", { duration: 4000 });
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to send. Please try again.");
    } finally {
      setSendingVerification(false);
    }
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
    <div style={{ minHeight: "100vh", background: "var(--bg-page)" }}>
      {/* Header */}
      <div style={{ background: "var(--primary-gradient)", padding: "16px", color: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)", margin: "0 0 2px" }}>{today}</p>
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

        {/* ── Email Verification Banner (for unverified users) ── */}
        {user && user.email_verified === false && (
          <div style={{
            background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: "10px",
            padding: "12px 16px", display: "flex", alignItems: "center", gap: "12px",
          }} data-testid="email-verify-banner">
            <AlertTriangle size={20} color="#EA580C" style={{ flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: "13px", fontWeight: 700, color: "#9A3412", margin: "0 0 2px" }}>Email not verified</p>
              <p style={{ fontSize: "12px", color: "#C2410C", margin: 0 }}>Verify your email to secure your account.</p>
            </div>
            <button
              onClick={handleSendVerification}
              disabled={sendingVerification}
              data-testid="dashboard-verify-email-btn"
              style={{
                background: "#EA580C", color: "#fff", border: "none", borderRadius: "7px",
                padding: "7px 14px", fontSize: "12px", fontWeight: 700,
                cursor: sendingVerification ? "default" : "pointer",
                opacity: sendingVerification ? 0.7 : 1, whiteSpace: "nowrap", flexShrink: 0,
              }}
            >
              {sendingVerification ? "Sending..." : "Send Link"}
            </button>
          </div>
        )}

        {/* ── Quick Actions ─────────────────────────────────────── */}
        <div style={{ display: "flex", gap: "10px" }}>
          <Link to="/parties" style={{ flex: 1, background: "var(--primary)", color: "#fff", border: "none", borderRadius: "10px", padding: "12px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontWeight: 600, fontSize: "14px", textDecoration: "none", justifyContent: "center" }}>
            <Plus size={16} /> New Party
          </Link>
          <Link to="/ledger" style={{ flex: 1, background: "#fff", color: "var(--primary)", border: "0.5px solid var(--border)", borderRadius: "10px", padding: "12px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontWeight: 600, fontSize: "14px", textDecoration: "none", justifyContent: "center" }}>
            <IndianRupee size={16} /> New Entry
          </Link>
        </div>

        {/* ── Subscription Status ─────────────────────────────── */}
        {sub && (
          <div className="pk-card" style={{ borderLeft: `4px solid ${subColor}`, padding: "12px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>{subType.toUpperCase()} PLAN</p>
                {subDays !== null && subActive ? (
                  <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                    <span style={{ fontSize: "28px", fontWeight: 800, fontFamily: "var(--font-mono)", color: subColor, lineHeight: 1 }}>{subDays}</span>
                    <span style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: 500 }}>days remaining</span>
                  </div>
                ) : (
                  <p style={{ fontSize: "13px", color: "#EF4444", fontWeight: 600 }}>Expired — Renew now</p>
                )}
              </div>
              <span style={{ background: subActive ? "#DCFCE7" : "#FEE2E2", color: subActive ? "#166534" : "#991B1B", borderRadius: "20px", padding: "4px 12px", fontSize: "12px", fontWeight: 700 }}>
                {subActive ? "Active" : "Expired"}
              </span>
            </div>
          </div>
        )}

        {/* ── Google Drive CSV Backup ─────────────────────────── */}
        <div className="pk-card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "14px 16px", borderBottom: "0.5px solid var(--border)", display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: 36, height: 36, borderRadius: "8px", background: "#4285F4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Cloud size={18} color="#fff" />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: "14px", fontWeight: 700, margin: 0 }}>Gmail Drive Backup</p>
              <p style={{ fontSize: "12px", color: "var(--text-tertiary)", margin: "2px 0 0" }}>
                {driveStatus?.connected
                  ? `Connected · Last sync: ${fmtDate(driveStatus.last_backup) || "Not yet"}`
                  : "Auto-saves CSV to Google Drive daily"}
              </p>
            </div>
            {driveStatus?.connected && (
              <CheckCircle size={18} color="#22C55E" />
            )}
          </div>
          <div style={{ padding: "12px 16px", display: "flex", gap: "8px" }}>
            {driveStatus?.connected ? (
              <>
                <button onClick={handleSyncNow} disabled={syncing}
                  style={{ flex: 1, background: "#4285F4", border: "none", borderRadius: "8px", padding: "10px", fontSize: "13px", fontWeight: 600, cursor: "pointer", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                  {syncing ? <><RefreshCw size={13} className="animate-spin" /> Syncing...</> : <><RefreshCw size={13} /> Sync Now</>}
                </button>
                <button onClick={handleDownloadCSV}
                  style={{ flex: 1, background: "var(--bg-page)", border: "0.5px solid var(--border)", borderRadius: "8px", padding: "10px", fontSize: "13px", fontWeight: 600, cursor: "pointer", color: "var(--text-primary)", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                  <Download size={13} /> Download CSV
                </button>
              </>
            ) : (
              <>
                <button onClick={handleConnectDrive} disabled={connectingDrive}
                  style={{ flex: 2, background: "#4285F4", border: "none", borderRadius: "8px", padding: "10px", fontSize: "13px", fontWeight: 600, cursor: "pointer", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                  {connectingDrive ? "Connecting..." : "Connect Google Drive"}
                </button>
                <button onClick={handleDownloadCSV}
                  style={{ flex: 1, background: "var(--bg-page)", border: "0.5px solid var(--border)", borderRadius: "8px", padding: "10px", fontSize: "12px", fontWeight: 600, cursor: "pointer", color: "var(--text-primary)", display: "flex", alignItems: "center", justifyContent: "center", gap: "5px" }}>
                  <Download size={12} /> CSV
                </button>
              </>
            )}
          </div>
        </div>

        {/* ── Recent Parties ──────────────────────────────────── */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>Recent Parties</p>
            <Link to="/parties" style={{ fontSize: "12px", color: "var(--dena)", textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}>
              View All <ArrowRight size={12} />
            </Link>
          </div>
          {loading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={`skeleton-party-${i}`} className="pk-card" style={{ height: "70px", marginBottom: "10px", background: "var(--border-light)" }} />
            ))
          ) : parties.length === 0 ? (
            <div className="pk-card" style={{ textAlign: "center", padding: "20px", color: "var(--text-tertiary)", fontSize: "14px" }}>
              No parties yet — Add a party to start
            </div>
          ) : parties.map(p => {
            const bal = formatBalance(p.current_balance);
            return (
              <div key={p.id} className="pk-card" style={{ marginBottom: "8px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
                onClick={() => navigate(`/ledger?party=${p.id}`)}>
                <div>
                  <p style={{ fontSize: "14px", fontWeight: 600, margin: 0 }}>{toTitleCase(p.name)}</p>
                  {p.mobile && <p style={{ fontSize: "12px", color: "var(--text-tertiary)", margin: "2px 0 0" }}>{p.mobile}</p>}
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontSize: "14px", fontWeight: 700, margin: 0, color: bal.type === "dena" ? "var(--dena)" : bal.type === "lena" ? "var(--lena)" : "var(--text-tertiary)" }}>{bal.text}</p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
