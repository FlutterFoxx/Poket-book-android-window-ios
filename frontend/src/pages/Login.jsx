import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";

const ForgotPasswordForm = ({ onBack }) => {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/api/auth/forgot-password", { email });
      setSent(true);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Something went wrong");
    }
    setLoading(false);
  };

  if (sent) return (
    <div className="text-center space-y-4">
      <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
        <span className="text-3xl">📧</span>
      </div>
      <h3 className="text-xl font-bold text-white">Check Your Email</h3>
      <p className="text-sm text-gray-400">If <strong className="text-white">{email}</strong> is registered, a reset link has been sent.</p>
      <button onClick={onBack} className="text-sm text-blue-400 hover:text-blue-300">← Back to Login</button>
    </div>
  );

  return (
    <>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "8px", padding: "6px 10px", cursor: "pointer", color: "#fff", fontSize: "13px", display: "flex", alignItems: "center", gap: "4px" }}>
          <ArrowLeft size={14} /> Back
        </button>
        <h2 className="text-2xl font-bold text-white">Reset Password</h2>
      </div>
      <p className="text-sm text-gray-500 mb-6">Apna email dalein — reset link bheja jaayega</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wide">Email Address</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
            placeholder="apna@email.com"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500 placeholder-gray-600" />
        </div>
        <button type="submit" disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg text-sm transition-colors disabled:opacity-50">
          {loading ? "Sending..." : "Send Reset Link"}
        </button>
      </form>
    </>
  );
};

const Login = () => {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [mode, setMode] = useState("login"); // 'login' | 'register' | 'forgot'
  const [googleLoading, setGoogleLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      const res = await api.get("/api/auth/google/login");
      window.location.href = res.data.url;
    } catch (err) {
      toast.error("Google login unavailable. Please use Email login.");
      setGoogleLoading(false);
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        const res = await api.post("/api/auth/login", { email: form.email, password: form.password });
        login(res.data);
        toast.success(`Welcome back, ${res.data.name}!`);
        navigate("/");
      } else {
        if (!form.name.trim()) { toast.error("Name required"); setLoading(false); return; }
        const res = await api.post("/api/auth/register", { name: form.name, email: form.email, password: form.password });
        login(res.data);
        toast.success("Account created! 7-day FREE trial started.");
        navigate("/");
      }
    } catch (err) {
      const detail = err.response?.data?.detail;
      toast.error(Array.isArray(detail) ? detail.map(e => e.msg).join(", ") : (detail || "Something went wrong"));
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex" style={{ background: "#0A0F1E", fontFamily: "'Work Sans', sans-serif" }}>
      {/* Left Hero */}
      <div className="hidden lg:flex flex-1 flex-col justify-center items-center p-12 relative"
        style={{ background: "linear-gradient(135deg, #0F172A 0%, #0A2A0F 50%, #0A0F2E 100%)" }}>
        <div className="text-center">
          <img src="/logo.png" alt="PoketBook" className="w-36 h-36 mx-auto mb-6 object-contain" />
          <h1 className="text-4xl font-black text-white mb-3" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>
            <span className="text-white">Poket</span><span className="text-green-400">Book</span>
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-sm">Apna Udhar Khaata Digital Banao</p>
          <div className="space-y-3 text-left max-w-sm">
            {["Double-entry ledger system", "Auto-calculated running balance", "Tally, lock & export features", "7-day FREE trial on signup"].map(t => (
              <div key={t} className="flex items-center gap-2 text-sm text-gray-400">
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-black text-xs font-bold">✓</span>
                </div>{t}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Form */}
      <div className="w-full lg:w-[440px] flex flex-col justify-center px-8 py-12">
        <div className="max-w-sm mx-auto w-full">
          <div className="flex items-center gap-3 mb-8">
            <img src="/logo.png" alt="PoketBook" className="w-10 h-10 object-contain" />
            <span className="text-xl font-black text-white">Poket<span className="text-green-400">Book</span></span>
          </div>

          {/* Google Login */}
          <button type="button" onClick={handleGoogleLogin} disabled={googleLoading}
            data-testid="google-login-btn"
            className="w-full flex items-center justify-center gap-3 border border-white/20 rounded-xl py-3 mb-4 text-sm font-semibold text-white hover:bg-white/10 transition-colors disabled:opacity-60"
            style={{ background: "rgba(255,255,255,0.05)" }}>
            {googleLoading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
            {googleLoading ? "Redirecting to Google..." : "Continue with Google"}
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-gray-600">or use email</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Email Form */}
          {mode !== "forgot" && (
            <>
              <h2 className="text-2xl font-bold text-white mb-1">{mode === "login" ? "Login Karein" : "Register Karein"}</h2>
              <p className="text-sm text-gray-500 mb-6">{mode === "login" ? "Apna account open karein" : "7-day free trial shuru karein"}</p>
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                {mode === "register" && (
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wide">Naam *</label>
                    <input type="text" value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))}
                      placeholder="Apna naam" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500 placeholder-gray-600" data-testid="register-name-input" />
                  </div>
                )}
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wide">Email</label>
                  <input type="email" value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))}
                    placeholder="email@example.com" required
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500 placeholder-gray-600" data-testid="email-input" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wide">Password</label>
                  <div className="relative">
                    <input type={showPass ? "text" : "password"} value={form.password} onChange={e => setForm(p => ({...p, password: e.target.value}))}
                      placeholder="Password" required
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500 placeholder-gray-600 pr-10" data-testid="password-input" />
                    <button type="button" onClick={() => setShowPass(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {showPass ? <EyeOff size={16}/> : <Eye size={16}/>}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg text-sm transition-colors disabled:opacity-50" data-testid="auth-submit-btn">
                  {loading ? "Please wait..." : mode === "login" ? "Login Karein" : "Register FREE — 7-Day Trial"}
                </button>
              </form>
              <div className="mt-4 text-center space-y-2">
                <button onClick={() => setMode(m => m === "login" ? "register" : "login")}
                  className="block w-full text-sm text-blue-400 hover:text-blue-300 transition-colors" data-testid="toggle-auth-mode-btn">
                  {mode === "login" ? "Naya account? Register karein (7-day free trial!)" : "Already registered? Login karein"}
                </button>
                {mode === "login" && (
                  <button onClick={() => setMode("forgot")} className="block w-full text-sm text-gray-500 hover:text-gray-300 transition-colors">
                    Password bhool gaye? Reset karein
                  </button>
                )}
              </div>
            </>
          )}

          {mode === "forgot" && <ForgotPasswordForm onBack={() => setMode("login")} />}

          <div className="mt-6 p-3 bg-white/5 border border-white/10 rounded-lg text-xs text-gray-500">
            <strong className="text-gray-400">Demo:</strong> admin@khaata.com / admin123
          </div>
          <p className="mt-4 text-xs text-center text-gray-600">
            By continuing, you agree to our <Link to="/terms" className="text-blue-400">Terms</Link> &amp; 7-day free trial policy
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
