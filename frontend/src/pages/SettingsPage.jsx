import { useState, useEffect } from "react";
import { api } from "@/contexts/AuthContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Lock, Eye, EyeOff, CheckCircle, Shield, Mail, RefreshCw } from "lucide-react";

const SettingsPage = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState(() => {
    // Default to email tab if user hasn't verified yet (set after mount)
    return "password";
  });
  const [form, setForm] = useState({ current: "", newPass: "", confirm: "" });
  const [showPass, setShowPass] = useState({ current: false, new: false, confirm: false });
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [googleLinked, setGoogleLinked] = useState(false);
  const [sendingVerify, setSendingVerify] = useState(false);
  const [verifySent, setVerifySent] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    setGoogleLinked(!!user?.google_auth || !!user?.picture);
    // Auto-open Email tab when email not verified
    if (user && user.email_verified === false) setTab("email");
  }, [user]);

  const handleConnectGoogle = async () => {
    setGoogleLoading(true);
    try {
      const res = await api.get("/api/auth/google/login");
      window.location.href = res.data.url;
    } catch (err) {
      toast.error("Google login unavailable. Please try again.");
      setGoogleLoading(false);
    }
  };

  const handleSendVerification = async () => {
    setSendingVerify(true);
    try {
      await api.post("/api/auth/resend-verification");
      setVerifySent(true);
      toast.success("Verification email sent! Check your inbox.", { duration: 4000 });
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to send. Please try again.");
    } finally {
      setSendingVerify(false);
    }
  };

  const handleChangePassword = async (e) => {    e.preventDefault();
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
            style={{ flex: 1, padding: "10px", fontSize: "13px", fontWeight: 600, cursor: "pointer", border: "none", background: tab === "password" ? "var(--primary)" : "#fff", color: tab === "password" ? "#fff" : "var(--text-secondary)", transition: "all 0.15s" }}>
            <Lock size={13} style={{ display: "inline", marginRight: "4px" }} /> Password
          </button>
          <button onClick={() => setTab("email")}
            style={{ flex: 1, padding: "10px", fontSize: "13px", fontWeight: 600, cursor: "pointer", border: "none", background: tab === "email" ? "#0891B2" : "#fff", color: tab === "email" ? "#fff" : "var(--text-secondary)", transition: "all 0.15s", position: "relative" }}>
            <Mail size={13} style={{ display: "inline", marginRight: "4px" }} /> Email
            {!user?.email_verified && (
              <span style={{ position: "absolute", top: "6px", right: "8px", width: "7px", height: "7px", borderRadius: "50%", background: "#EF4444" }} />
            )}
          </button>
          <button onClick={() => setTab("google")}
            style={{ flex: 1, padding: "10px", fontSize: "13px", fontWeight: 600, cursor: "pointer", border: "none", background: tab === "google" ? "#4285F4" : "#fff", color: tab === "google" ? "#fff" : "var(--text-secondary)", transition: "all 0.15s" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" style={{ display: "inline", marginRight: "4px", verticalAlign: "middle" }}>
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill={tab === "google" ? "#fff" : "#EA4335"}/>
            </svg>
            Google
          </button>
          <button onClick={() => setTab("account")}
            style={{ flex: 1, padding: "10px", fontSize: "13px", fontWeight: 600, cursor: "pointer", border: "none", background: tab === "account" ? "var(--primary)" : "#fff", color: tab === "account" ? "#fff" : "var(--text-secondary)", transition: "all 0.15s" }}>
            <Shield size={13} style={{ display: "inline", marginRight: "4px" }} /> Account
          </button>
        </div>

        {/* Email Verification Tab */}
        {tab === "email" && (
          <div className="pk-card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>Email Verification</h2>

            {/* Status card */}
            <div style={{
              borderRadius: "10px", padding: "14px 16px",
              background: user?.email_verified ? "#DCFCE7" : "#FFF7ED",
              border: `1px solid ${user?.email_verified ? "#86EFAC" : "#FED7AA"}`,
              display: "flex", alignItems: "center", gap: "12px",
            }}>
              {user?.email_verified
                ? <CheckCircle size={22} color="#16A34A" style={{ flexShrink: 0 }} />
                : <Mail size={22} color="#EA580C" style={{ flexShrink: 0 }} />
              }
              <div>
                <p style={{ fontWeight: 700, fontSize: "14px", color: user?.email_verified ? "#166534" : "#9A3412", margin: "0 0 2px" }}>
                  {user?.email_verified ? "Email Verified" : "Email Not Verified"}
                </p>
                <p style={{ fontSize: "12px", color: user?.email_verified ? "#15803D" : "#C2410C", margin: 0 }}>
                  {user?.email || "No email on account"}
                </p>
              </div>
            </div>

            {/* Action */}
            {!user?.email_verified && user?.email && (
              <>
                <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0, lineHeight: "1.6" }}>
                  Verify your email address to secure your account and receive important notifications about your Khaata.
                </p>
                <button
                  onClick={handleSendVerification}
                  disabled={sendingVerify || verifySent}
                  data-testid="settings-send-verify-btn"
                  style={{
                    width: "100%", padding: "13px 16px", borderRadius: "10px", border: "none",
                    background: verifySent ? "#16A34A" : "#0891B2",
                    color: "#fff", fontSize: "15px", fontWeight: 700,
                    cursor: sendingVerify || verifySent ? "default" : "pointer",
                    opacity: sendingVerify ? 0.7 : 1,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                  }}
                >
                  {verifySent ? (
                    <><CheckCircle size={16} /> Verification Email Sent</>
                  ) : sendingVerify ? (
                    <><RefreshCw size={16} className="animate-spin" /> Sending...</>
                  ) : (
                    <><Mail size={16} /> Send Verification Email</>
                  )}
                </button>
                {verifySent && (
                  <p style={{ fontSize: "12px", color: "var(--text-tertiary)", textAlign: "center", margin: 0 }}>
                    Check your inbox and click the link to verify. Link expires in 24 hours.
                  </p>
                )}
              </>
            )}

            {user?.email_verified && (
              <p style={{ fontSize: "13px", color: "#166534", textAlign: "center", margin: 0 }}>
                Your email is verified. Your account is fully secured.
              </p>
            )}
          </div>
        )}

        {/* Google Account Tab */}
        {tab === "google" && (
          <div className="pk-card">
            <h2 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px", color: "var(--text-primary)" }}>Google Account</h2>
            <p style={{ fontSize: "13px", color: "var(--text-tertiary)", marginBottom: "20px" }}>
              Link your Google account to enable one-tap login and automatic Drive backup.
            </p>

            {googleLinked ? (
              <div style={{ background: "#DCFCE7", border: "1px solid #86EFAC", borderRadius: "10px", padding: "14px 16px", display: "flex", alignItems: "center", gap: "12px" }}>
                {user?.picture && <img src={user.picture} alt="Google" style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }} />}
                <div>
                  <p style={{ fontSize: "14px", fontWeight: 700, color: "#166534", margin: 0 }}>Google Connected</p>
                  <p style={{ fontSize: "12px", color: "#166534", margin: "2px 0 0" }}>{user?.email}</p>
                </div>
                <CheckCircle size={20} color="#16A34A" style={{ marginLeft: "auto" }} />
              </div>
            ) : (
              <button onClick={handleConnectGoogle}
                disabled={googleLoading}
                style={{ width: "100%", background: "#fff", border: "1.5px solid #E5E7EB", borderRadius: "12px", padding: "14px 16px", cursor: googleLoading ? "default" : "pointer", display: "flex", alignItems: "center", gap: "12px", textAlign: "left", opacity: googleLoading ? 0.7 : 1 }}>
                <div style={{ width: 40, height: 40, borderRadius: "10px", background: "#F8FAFC", border: "1px solid #E5E7EB", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {googleLoading ? (
                    <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                  ) : (
                    <svg width="22" height="22" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: "14px", fontWeight: 700, color: "#111", margin: 0 }}>{googleLoading ? "Redirecting to Google..." : "Connect Google Account"}</p>
                  <p style={{ fontSize: "12px", color: "#666", margin: "2px 0 0" }}>Enable Google login + Drive backup</p>
                </div>
                {!googleLoading && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>}
              </button>
            )}
          </div>
        )}

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
