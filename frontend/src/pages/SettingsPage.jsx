import { useState } from "react";
import { api } from "@/contexts/AuthContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Lock, Eye, EyeOff, CheckCircle, Shield } from "lucide-react";

const SettingsPage = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState("password");
  const [form, setForm] = useState({ current: "", newPass: "", confirm: "" });
  const [showPass, setShowPass] = useState({ current: false, new: false, confirm: false });
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (form.newPass !== form.confirm) { toast.error("New passwords don't match"); return; }
    if (form.newPass.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setSaving(true);
    try {
      await api.post("/api/auth/change-password", {
        current_password: form.current,
        new_password: form.newPass,
      });
      toast.success("Password changed successfully!");
      setForm({ current: "", newPass: "", confirm: "" });
      setDone(true);
      setTimeout(() => setDone(false), 4000);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Password change failed");
    }
    setSaving(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-page)", fontFamily: "var(--font-body)" }}>
      {/* Header */}
      <div style={{ background: "var(--primary-gradient)", padding: "20px 16px" }}>
        <h1 style={{ color: "#fff", fontSize: "20px", fontWeight: 600, fontFamily: "var(--font-heading)", margin: 0 }}>Settings</h1>
        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "13px", marginTop: "2px" }}>{user?.name} • {user?.email}</p>
      </div>

      <div style={{ padding: "16px", maxWidth: "480px", margin: "0 auto" }}>

        {/* Subscription status */}
        {user?.subscription && (
          <div className="pk-card" style={{ marginBottom: "16px", borderLeft: `3px solid ${user.subscription.is_active ? "var(--success)" : "var(--danger)"}` }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  {user.subscription.type} Plan
                </p>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
                  {user.subscription.is_active
                    ? `${user.subscription.days_remaining} days remaining`
                    : "Expired — upgrade to continue"}
                </p>
              </div>
              <span className={`pk-badge ${user.subscription.is_active ? "pk-badge--green" : "pk-badge--red"}`}>
                {user.subscription.is_active ? "Active" : "Expired"}
              </span>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: "flex", border: "0.5px solid var(--border)", borderRadius: "var(--radius-sm)", overflow: "hidden", marginBottom: "20px" }}>
          <button onClick={() => setTab("password")}
            style={{ flex: 1, padding: "10px", fontSize: "14px", fontWeight: 600, cursor: "pointer", border: "none", background: tab === "password" ? "var(--primary)" : "#fff", color: tab === "password" ? "#fff" : "var(--text-secondary)", transition: "all 0.15s" }}>
            <Lock size={14} style={{ display: "inline", marginRight: "6px" }} /> Change Password
          </button>
          <button onClick={() => setTab("account")}
            style={{ flex: 1, padding: "10px", fontSize: "14px", fontWeight: 600, cursor: "pointer", border: "none", background: tab === "account" ? "var(--primary)" : "#fff", color: tab === "account" ? "#fff" : "var(--text-secondary)", transition: "all 0.15s" }}>
            <Shield size={14} style={{ display: "inline", marginRight: "6px" }} /> Account Info
          </button>
        </div>

        {/* Change Password Tab */}
        {tab === "password" && (
          <div className="pk-card">
            <h2 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px", color: "var(--text-primary)" }}>Change Password</h2>

            {done && (
              <div style={{ background: "var(--success-bg)", borderRadius: "var(--radius-sm)", padding: "12px 14px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "var(--success)" }}>
                <CheckCircle size={16} /> Password changed successfully!
              </div>
            )}

            <form onSubmit={handleChangePassword} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Current password */}
              <div>
                <label className="pk-label">Current Password</label>
                <div style={{ position: "relative" }}>
                  <input type={showPass.current ? "text" : "password"} value={form.current}
                    onChange={(e) => setForm(p => ({ ...p, current: e.target.value }))}
                    placeholder="Enter current password" required className="pk-input" style={{ paddingRight: "44px" }} />
                  <button type="button" onClick={() => setShowPass(p => ({ ...p, current: !p.current }))}
                    style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)" }}>
                    {showPass.current ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* New password */}
              <div>
                <label className="pk-label">New Password</label>
                <div style={{ position: "relative" }}>
                  <input type={showPass.new ? "text" : "password"} value={form.newPass}
                    onChange={(e) => setForm(p => ({ ...p, newPass: e.target.value }))}
                    placeholder="Minimum 6 characters" required className="pk-input" style={{ paddingRight: "44px" }} />
                  <button type="button" onClick={() => setShowPass(p => ({ ...p, new: !p.new }))}
                    style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)" }}>
                    {showPass.new ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Confirm new password */}
              <div>
                <label className="pk-label">Confirm New Password</label>
                <div style={{ position: "relative" }}>
                  <input type={showPass.confirm ? "text" : "password"} value={form.confirm}
                    onChange={(e) => setForm(p => ({ ...p, confirm: e.target.value }))}
                    placeholder="Repeat new password" required className="pk-input"
                    style={{ paddingRight: "44px", borderColor: form.confirm && form.confirm !== form.newPass ? "var(--danger)" : "" }} />
                  <button type="button" onClick={() => setShowPass(p => ({ ...p, confirm: !p.confirm }))}
                    style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)" }}>
                    {showPass.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {form.confirm && form.confirm !== form.newPass && (
                  <p style={{ fontSize: "12px", color: "var(--danger)", marginTop: "4px" }}>Passwords don't match</p>
                )}
              </div>

              <button type="submit" disabled={saving} className="pk-btn pk-btn--primary" style={{ width: "100%", minHeight: "48px" }}>
                {saving ? "Changing..." : "Change Password"}
              </button>
            </form>
          </div>
        )}

        {/* Account Info Tab */}
        {tab === "account" && (
          <div className="pk-card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-primary)" }}>Account Information</h2>
            {[
              { label: "Name", value: user?.name },
              { label: "Email", value: user?.email || "—" },
              { label: "Role", value: user?.role || "user" },
              { label: "Plan", value: user?.subscription?.type || "trial" },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", borderBottom: "0.5px solid var(--border)", paddingBottom: "12px" }}>
                <span className="pk-label" style={{ textTransform: "uppercase" }}>{label}</span>
                <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>{value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;
