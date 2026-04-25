import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Eye, EyeOff, Phone, Mail } from "lucide-react";

const Login = () => {
  const [tab, setTab] = useState("email"); // 'email' | 'phone'
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", otp: "" });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [mode, setMode] = useState("login"); // 'login' | 'register'
  const { login } = useAuth();
  const navigate = useNavigate();

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

  const handleSendOTP = async () => {
    if (!form.phone.trim()) { toast.error("Phone number required"); return; }
    setLoading(true);
    try {
      const res = await api.post("/api/auth/send-otp", { phone: form.phone });
      setOtpSent(true);
      toast.success("OTP sent!");
      if (res.data.dev_otp) toast.info(`Dev OTP: ${res.data.dev_otp}`, { duration: 30000 });
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to send OTP");
    } finally { setLoading(false); }
  };

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/api/auth/verify-otp", { phone: form.phone, otp: form.otp, name: form.name });
      login(res.data);
      toast.success(`Welcome, ${res.data.name}!`);
      navigate("/");
    } catch (err) {
      toast.error(err.response?.data?.detail || "OTP verification failed");
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

          {/* Tab: Email / Phone */}
          <div className="flex border border-white/10 rounded-lg overflow-hidden mb-6">
            <button onClick={() => setTab("email")} className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold transition-colors ${tab === "email" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"}`}>
              <Mail size={15} /> Email Login
            </button>
            <button onClick={() => setTab("phone")} className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold transition-colors ${tab === "phone" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"}`}>
              <Phone size={15} /> Phone OTP
            </button>
          </div>

          {/* Email Form */}
          {tab === "email" && (
            <>
              <h2 className="text-2xl font-bold text-white mb-1">{mode === "login" ? "Login Karein" : "Register Karein"}</h2>
              <p className="text-sm text-gray-500 mb-6">{mode === "login" ? "Apna account open karein" : "15-day free trial shuru karein"}</p>
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
              <div className="mt-4 text-center">
                <button onClick={() => setMode(m => m === "login" ? "register" : "login")}
                  className="text-sm text-blue-400 hover:text-blue-300 transition-colors" data-testid="toggle-auth-mode-btn">
                  {mode === "login" ? "Naya account? Register karein (15-day trial free!)" : "Already registered? Login karein"}
                </button>
              </div>
            </>
          )}

          {/* Phone OTP Form */}
          {tab === "phone" && (
            <>
              <h2 className="text-2xl font-bold text-white mb-1">Phone se Login</h2>
              <p className="text-sm text-gray-500 mb-6">OTP apne phone par aayega</p>
              <form onSubmit={handlePhoneSubmit} className="space-y-4">
                {!otpSent ? (
                  <>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wide">Naam (new user)</label>
                      <input type="text" value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))}
                        placeholder="Apna naam (only for new user)" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500 placeholder-gray-600" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wide">Phone Number *</label>
                      <div className="flex gap-2">
                        <span className="bg-white/5 border border-white/10 rounded-lg px-3 py-3 text-gray-400 text-sm">+91</span>
                        <input type="tel" value={form.phone} onChange={e => setForm(p => ({...p, phone: e.target.value}))}
                          placeholder="9876543210" required maxLength={10}
                          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500 placeholder-gray-600 font-mono" />
                      </div>
                    </div>
                    <button type="button" onClick={handleSendOTP} disabled={loading}
                      className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-lg text-sm transition-colors disabled:opacity-50">
                      {loading ? "Sending..." : "OTP Bhejein"}
                    </button>
                  </>
                ) : (
                  <>
                    <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-sm text-green-400">
                      OTP sent to +91 {form.phone}
                      <button onClick={() => setOtpSent(false)} className="ml-2 underline text-xs">Change number</button>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wide">6-Digit OTP</label>
                      <input type="text" value={form.otp} onChange={e => setForm(p => ({...p, otp: e.target.value}))}
                        placeholder="000000" maxLength={6} required
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-2xl font-mono tracking-[0.5em] focus:outline-none focus:border-blue-500 text-center" />
                    </div>
                    <button type="submit" disabled={loading}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg text-sm transition-colors disabled:opacity-50">
                      {loading ? "Verifying..." : "Verify & Login"}
                    </button>
                    <button type="button" onClick={handleSendOTP} disabled={loading} className="w-full text-sm text-gray-400 hover:text-white">
                      Resend OTP
                    </button>
                  </>
                )}
              </form>
            </>
          )}

          <div className="mt-6 p-3 bg-white/5 border border-white/10 rounded-lg text-xs text-gray-500">
            <strong className="text-gray-400">Demo:</strong> admin@khaata.com / admin123
          </div>

          <p className="mt-4 text-xs text-center text-gray-600">
            By continuing, you agree to our <span className="text-blue-400">Terms</span> &amp; 7-day free trial policy
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
