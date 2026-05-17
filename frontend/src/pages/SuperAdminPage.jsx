import { useEffect, useState, useCallback } from "react";
import { Link, Navigate } from "react-router-dom";
import { api } from "@/contexts/AuthContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Users, Shield, Activity, RefreshCw, CheckCircle, XCircle, ChevronDown, Bot, AlertTriangle, Zap, History } from "lucide-react";

const PLANS = ["trial", "weekly", "monthly", "yearly"];
const PLAN_DAYS = { trial: 7, weekly: 7, monthly: 30, yearly: 365 };

// ── AI Self-Healing Panel ──────────────────────────────────────────────────────
const AIHealPanel = () => {
  const [issue, setIssue] = useState("");
  const [context, setContext] = useState("");
  const [healing, setHealing] = useState(false);
  const [result, setResult] = useState(null);
  const [health, setHealth] = useState(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [tab, setTab] = useState("diagnose");

  const runHealthCheck = useCallback(async () => {
    setHealthLoading(true);
    try {
      const res = await api.get("/api/superadmin/health-check");
      setHealth(res.data);
    } catch { toast.error("Health check failed"); }
    setHealthLoading(false);
  }, []);

  useEffect(() => { runHealthCheck(); }, [runHealthCheck]);

  const loadHistory = async () => {
    try {
      const res = await api.get("/api/superadmin/ai-heal/history");
      setHistory(res.data);
    } catch {}
  };

  const diagnose = async () => {
    if (!issue.trim()) { toast.error("Describe the issue"); return; }
    setHealing(true); setResult(null);
    try {
      const res = await api.post("/api/superadmin/ai-heal", { issue, context });
      setResult(res.data);
    } catch (err) { toast.error(err.response?.data?.detail || "AI agent failed"); }
    setHealing(false);
  };

  const SEVERITY_COLOR = { Critical: "#ef4444", High: "#f97316", Medium: "#f59e0b", Low: "#22c55e" };

  return (
    <div className="rounded-2xl border border-white/10 overflow-hidden mb-8" style={{ background: "#111827" }}>
      <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #7C3AED, #4F46E5)" }}>
            <Bot size={16} color="#fff" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">AI Self-Healing Agent</h2>
            <p className="text-xs text-gray-500">Diagnose & fix system issues automatically</p>
          </div>
        </div>
        {/* System Health Badge */}
        {health && (
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${health.overall === "ok" ? "bg-green-400" : "bg-red-400"} animate-pulse`} />
            <span className="text-xs text-gray-400">{health.overall === "ok" ? "All systems normal" : "Issues detected"}</span>
            <button onClick={runHealthCheck} className="text-xs text-gray-500 hover:text-gray-300" title="Refresh health">
              <RefreshCw size={12} className={healthLoading ? "animate-spin" : ""} />
            </button>
          </div>
        )}
      </div>

      {/* Health Check Status */}
      {health && (
        <div className="px-6 py-3 border-b border-white/5 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {Object.entries(health).filter(([k]) => k !== "overall").map(([key, val]) => (
            <div key={key} className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "#1E293B" }}>
              {val.status === "ok" ? <CheckCircle size={13} className="text-green-400 flex-shrink-0" /> : <AlertTriangle size={13} className="text-amber-400 flex-shrink-0" />}
              <div>
                <p className="text-xs font-semibold text-white capitalize">{key}</p>
                <p className="text-xs text-gray-500 truncate">{typeof val === "object" ? (val.message || JSON.stringify(val).slice(0, 30)) : val}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-white/10">
        {[["diagnose", "Diagnose Issue", Zap], ["history", "History", History]].map(([t, label, Icon]) => (
          <button key={t} onClick={() => { setTab(t); if (t === "history") loadHistory(); }}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors ${tab === t ? "border-b-2 border-purple-400 text-purple-400" : "text-gray-500 hover:text-gray-300"}`}>
            <Icon size={14} />{label}
          </button>
        ))}
      </div>

      {tab === "diagnose" ? (
        <div className="p-5 space-y-4">
          {/* Quick issue buttons */}
          <div className="flex flex-wrap gap-2">
            {["Login not working", "App showing white screen", "Entries not saving", "Slow performance", "Balance wrong", "PDF generation failing"].map(q => (
              <button key={q} onClick={() => setIssue(q)}
                className="text-xs px-3 py-1.5 rounded-full border border-white/10 text-gray-400 hover:text-white hover:border-purple-400 transition-colors">
                {q}
              </button>
            ))}
          </div>

          <div>
            <label className="text-xs font-bold text-gray-400 uppercase mb-1.5 block">Describe the Issue *</label>
            <textarea
              value={issue} onChange={e => setIssue(e.target.value)}
              placeholder="e.g., Users can't log in, getting 401 error after entering correct password..."
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm resize-none focus:outline-none focus:border-purple-400"
              rows={3} />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase mb-1.5 block">Additional Context (optional)</label>
            <input value={context} onChange={e => setContext(e.target.value)}
              placeholder="Error message, when it started, which users affected..."
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-400" />
          </div>
          <button onClick={diagnose} disabled={healing || !issue.trim()}
            className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
            style={{ background: healing ? "#374151" : "linear-gradient(135deg, #7C3AED, #4F46E5)", color: "#fff" }}>
            {healing ? <><RefreshCw size={14} className="animate-spin" /> Analyzing with AI...</> : <><Bot size={14} /> Diagnose & Fix</>}
          </button>

          {/* AI Result */}
          {result && (
            <div className="rounded-xl border p-5 space-y-4" style={{ background: "#0F172A", borderColor: SEVERITY_COLOR[result.severity] + "40" }}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wide" style={{ color: SEVERITY_COLOR[result.severity] }}>
                  {result.severity} SEVERITY
                </span>
                <span className="text-xs text-gray-500">Confidence: {Math.round((result.confidence || 0.8) * 100)}%</span>
              </div>
              {[["Root Cause", result.root_cause, "text-red-400"], ["Auto-Fix", result.auto_fix, "text-green-400"], ["Prevention", result.prevention, "text-blue-400"], ["Status Check", result.status_check, "text-amber-400"]].map(([label, val, color]) => (
                <div key={label}>
                  <p className={`text-xs font-bold mb-1 ${color}`}>{label}</p>
                  <p className="text-sm text-gray-300 leading-relaxed">{val}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="p-5">
          {history.length === 0 ? (
            <p className="text-center text-gray-500 text-sm py-8">No healing sessions yet</p>
          ) : (
            <div className="space-y-3">
              {history.map((h, i) => (
                <div key={i} className="rounded-lg p-3 border border-white/5" style={{ background: "#1E293B" }}>
                  <div className="flex items-start justify-between mb-1">
                    <p className="text-sm text-white font-medium">{h.issue}</p>
                    <span className="text-xs text-gray-500 ml-2 flex-shrink-0">{new Date(h.timestamp).toLocaleDateString("en-IN")}</span>
                  </div>
                  {h.diagnosis && <p className="text-xs text-gray-400">{h.diagnosis.root_cause?.slice(0, 100)}...</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const SuperAdminPage = () => {
  const { user, loading } = useAuth();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [activePlan, setActivePlan] = useState({});

  // ALL hooks must be called before any conditional returns
  const fetchData = useCallback(async () => {
    setDataLoading(true);
    try {
      const [statsRes, usersRes] = await Promise.all([
        api.get("/api/superadmin/stats"),
        api.get("/api/superadmin/users"),
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to load data");
    }
    setDataLoading(false);
  }, []);

  useEffect(() => {
    if (user && ["superadmin", "admin"].includes(user.role)) {
      fetchData();
    }
  }, [user, fetchData]);

  // Conditional returns AFTER all hooks
  if (loading) return (
    <div className="flex h-screen items-center justify-center" style={{ background: "#0A0F1E" }}>
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!user || !["superadmin", "admin"].includes(user.role)) return <Navigate to="/" replace />;

  const handleActivate = async (userId, planType) => {
    setUpdatingId(userId);
    try {
      await api.post(`/api/superadmin/users/${userId}/subscription`, {
        subscription_type: planType, duration_days: PLAN_DAYS[planType],
      });
      toast.success(`Subscription updated to ${planType}`);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to update");
    }
    setUpdatingId(null);
  };

  const fmtDate = (d) => { try { return new Date(d).toLocaleDateString("en-IN"); } catch { return "—"; } };

  return (
    <div className="min-h-screen" style={{ background: "#0A0F1E", fontFamily: "'Work Sans', sans-serif", color: "white" }}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between" style={{ background: "#0F172A" }}>
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="PoketBook" className="w-9 h-9 object-contain" />
          <div>
            <span className="font-black text-white text-lg">Poket<span className="text-green-400">Book</span></span>
            <span className="ml-2 text-xs bg-purple-600 text-white px-2 py-0.5 rounded font-bold">SuperAdmin</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchData} className="flex items-center gap-2 text-sm text-gray-300 hover:text-white border border-white/10 px-3 py-1.5 rounded-lg bg-white/5 transition-colors">
            <RefreshCw size={14} /> Refresh
          </button>
          <Link to="/" className="text-sm text-gray-400 hover:text-white transition-colors">← Back to App</Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* AI Self-Healing Agent */}
        <AIHealPanel />

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Users", value: stats?.total_users ?? "—", color: "text-blue-400", icon: Users },
            { label: "Active Subscriptions", value: stats?.active_subscriptions ?? "—", color: "text-green-400", icon: CheckCircle },
            { label: "Trial Users", value: stats?.trial_users ?? "—", color: "text-amber-400", icon: Activity },
            { label: "Expired", value: stats?.expired ?? "—", color: "text-red-400", icon: XCircle },
          ].map((s) => (
            <div key={s.label} className="rounded-xl p-5 border border-white/10" style={{ background: "#111827" }}>
              <div className="flex items-center justify-between mb-2">
                <s.icon size={18} className={s.color} />
              </div>
              <div className={`text-3xl font-black ${s.color} mb-1`}>{dataLoading ? "..." : s.value}</div>
              <div className="text-xs text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Users Table */}
        <div className="rounded-2xl border border-white/10 overflow-hidden" style={{ background: "#111827" }}>
          <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Shield size={18} className="text-purple-400" /> All Users
            </h2>
            <span className="text-sm text-gray-400">{users.length} users</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 text-left">
                  {["Name", "Email / Phone", "Joined", "Plan", "Expires", "Status", "Actions"].map(h => (
                    <th key={h} className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dataLoading ? (
                  Array(5).fill(0).map((_, i) => (
                    <tr key={`skeleton-${i}`} className="border-b border-white/5">
                      {Array(7).fill(0).map((_, j) => (
                        <td key={`cell-${i}-${j}`} className="px-4 py-3">
                          <div className="h-4 bg-white/5 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : users.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-12 text-gray-500">No users yet</td></tr>
                ) : users.map((u) => (
                  <tr key={u.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-white">{u.name || "—"}</td>
                    <td className="px-4 py-3 text-sm text-gray-400 font-mono">{u.email || u.phone || "—"}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{fmtDate(u.created_at)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        u.subscription_type === "yearly" ? "bg-purple-500/20 text-purple-300" :
                        u.subscription_type === "monthly" ? "bg-green-500/20 text-green-300" :
                        u.subscription_type === "weekly" ? "bg-blue-500/20 text-blue-300" :
                        "bg-amber-500/20 text-amber-300"
                      }`}>
                        {u.subscription_type || "trial"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{fmtDate(u.subscription_expires_at)}</td>
                    <td className="px-4 py-3">
                      {u.subscription_active ? (
                        <span className="flex items-center gap-1 text-xs text-green-400">
                          <CheckCircle size={12} /> Active ({u.days_remaining}d)
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-red-400">
                          <XCircle size={12} /> Expired
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <select
                            value={activePlan[u.id] || "monthly"}
                            onChange={e => setActivePlan(p => ({ ...p, [u.id]: e.target.value }))}
                            className="bg-white/5 border border-white/10 text-white text-xs rounded px-2 py-1 pr-6 focus:outline-none focus:border-blue-500 appearance-none"
                          >
                            {PLANS.map(p => <option key={p} value={p} className="bg-gray-900">{p} ({PLAN_DAYS[p]}d)</option>)}
                          </select>
                          <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                        <button
                          onClick={() => handleActivate(u.id, activePlan[u.id] || "monthly")}
                          disabled={updatingId === u.id}
                          className="text-xs bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded disabled:opacity-50 transition-colors font-semibold"
                        >
                          {updatingId === u.id ? "..." : "Activate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminPage;
