import { useState, useEffect } from "react";
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
  const [gisError, setGisError] = useState(false); // true when origin not authorised
  const { login } = useAuth();
  const navigate = useNavigate();

  // ── Sign in with Google (GIS) ─────────────────────────────────────────────
  // Per: developers.google.com/identity/gsi/web/guides/get-google-api-clientid
  const [googleReady, setGoogleReady] = useState(false);

  // Initialise GIS once the script has loaded
  useEffect(() => {
    const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    const init = () => {
      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleCredential,
          use_fedcm_for_prompt: false,
          auto_select: false,
          cancel_on_tap_outside: true,
          error_callback: (err) => {
            if (err?.type === "unknown" || err?.type === "unregistered_origin") {
              setGisError(true);
            }
          },
        });
        setGoogleReady(true);
      } catch (e) {
        setGisError(true);
      }
    };

    if (window.google?.accounts?.id) {
      init();
    } else {
      const script = document.querySelector('script[src*="accounts.google.com/gsi"]');
      if (script) script.addEventListener("load", init, { once: true });
    }
  }, []); // eslint-disable-line

  // Render GIS button; detect "origin not allowed" from 403 on the button iframe
  useEffect(() => {
    if (!googleReady) return;
    const el = document.getElementById("g_id_signin");
    if (!el) return;

    // Listen for the 403 iframe failure (origin not registered in Google Cloud Console)
    const handleMessage = (e) => {
      if (e.data && typeof e.data === "string" && e.data.includes("origin")) {
        setGisError(true);
      }
    };
    window.addEventListener("message", handleMessage);

    window.google.accounts.id.renderButton(el, {
      theme: "outline",
      size: "large",
      text: "signin_with",
      shape: "rectangular",
      width: el.offsetWidth || 360,
      logo_alignment: "left",
    });

    // Check if GIS actually rendered something (or failed silently)
    const checkRendered = setTimeout(() => {
      if (el.offsetHeight < 5) setGisError(true); // button never appeared
    }, 2500);

    return () => { clearTimeout(checkRendered); window.removeEventListener("message", handleMessage); };
  }, [googleReady, mode]); // eslint-disable-line

  // Called by GIS with the JWT credential
  const handleGoogleCredential = async (response) => {
    try {
      setGoogleLoading(true);
      // Send the id_token (JWT) to backend for verification
      const res = await api.post("/api/auth/google/token", {
        credential: response.credential,
      });
      login(res.data);
      toast.success(`Welcome, ${res.data.name || "User"}!`);
      navigate("/");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Google sign-in failed. Please try email login.");
    } finally {
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

          {/* Sign in with Google — GIS renderButton() per Google docs */}
          {!gisError ? (
            <div id="g_id_signin" className="w-full mb-2" style={{ minHeight: "44px" }} />
          ) : (
            /* Fallback: origin not in Google Cloud Console Authorized JavaScript Origins */
            <div className="w-full mb-2 p-3 rounded-xl border border-white/10 text-center" style={{ background: "rgba(255,255,255,0.04)" }}>
              <p className="text-xs text-gray-500 mb-1">Google Sign-In unavailable on this domain.</p>
              <p className="text-xs text-gray-600">
                Add <span className="text-blue-400 font-mono text-xs">{window.location.origin}</span> to
                Authorized JavaScript Origins in Google Cloud Console.
              </p>
            </div>
          )}
          {googleLoading && (
            <div className="flex items-center justify-center gap-2 text-sm text-gray-400 mb-2">
              <div className="w-4 h-4 border-2 border-gray-400 border-t-white rounded-full animate-spin" />
              Signing in with Google...
            </div>
          )}

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
