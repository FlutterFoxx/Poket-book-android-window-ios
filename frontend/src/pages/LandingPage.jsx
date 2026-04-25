import { Link } from "react-router-dom";
import { CheckCircle, Zap, BookOpen, Scale, Lock, FileDown, Users, Phone, Mail, ArrowRight, ExternalLink, IndianRupee, Shield, Bell, Database, Cloud, Star, RefreshCw } from "lucide-react";

const LOGO = "/logo.png";

const scrollTo = (id) => {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
};

const features = [
  { icon: Zap, title: "Fast Keyboard Entry", sub: "Tab → Enter → Save", desc: "Enter credit/debit in seconds. Full keyboard-first flow — Tab moves fields, OK saves. No mouse needed.", color: "#2563EB", tag: "Core" },
  { icon: BookOpen, title: "Double Entry System", sub: "Auto Mirror Entries", desc: "Every Naam/Jama transaction auto-creates a mirror entry in the counterparty's ledger. Always balanced.", color: "#7C3AED", tag: "Core" },
  { icon: Scale, title: "Balance Sheet", sub: "Dena / Lena at a Glance", desc: "Two-column view: Lena (Red) parties on right, Dena (Blue) parties on left. Click any party to open their ledger.", color: "#DC2626", tag: "Core" },
  { icon: Lock, title: "Tally & Lock", sub: "Immutable Audit Trail", desc: "Lock entries at period end. Locked entries are viewable but never editable — perfect accounting integrity.", color: "#16A34A", tag: "Core" },
  { icon: FileDown, title: "PDF & Excel Export", sub: "Print-Ready Statements", desc: "Export any party ledger or balance sheet to PDF (with logo) or Excel with date range filter.", color: "#D97706", tag: "Export" },
  { icon: Users, title: "Multi-Party Ledger", sub: "Unlimited Khatadar", desc: "Manage unlimited parties. Search by name or mobile. View complete account history instantly.", color: "#0891B2", tag: "Core" },
  { icon: Cloud, title: "Google Sheets Backup", sub: "Sync to Your Drive", desc: "Connect Google account once. All parties + entries sync to Google Sheet in your Drive automatically.", color: "#0F9D58", tag: "Backup" },
  { icon: Bell, title: "Auto Email Backup", sub: "Daily / Weekly / Monthly", desc: "WhatsApp-style backup settings. Choose frequency, enter email — CSV delivered automatically.", color: "#EA4335", tag: "Backup" },
  { icon: Phone, title: "Phone OTP Login", sub: "No Password Needed", desc: "Login with phone number. Get 6-digit OTP, verify, and you're in. New users get 7-day FREE trial.", color: "#F59E0B", tag: "Auth" },
  { icon: Shield, title: "100% Data Isolated", sub: "Your Data, Only Yours", desc: "Every user's data is completely isolated. Other users can never see or access your transactions.", color: "#6366F1", tag: "Security" },
  { icon: Database, title: "Statement Preview", sub: "See Before You Export", desc: "Live preview of selected party ledger for any date range before downloading PDF or Excel.", color: "#14B8A6", tag: "Export" },
  { icon: Star, title: "7-Day FREE Trial", sub: "No Credit Card Needed", desc: "New account? Get 7 days of full access completely FREE. After trial, choose from flexible paid plans.", color: "#F97316", tag: "Pricing" },
];

const plans = [
  { name: "Weekly", price: 129, period: "per week", perDay: "₹18.4/day", savings: null, badge: null, color: "border-blue-500", features: ["All 12 features", "7 days access", "Google Sheets backup", "Email backup", "Renew anytime"], cta: "Go Weekly", highlight: false },
  { name: "Monthly", price: 499, period: "per month", perDay: "₹16.6/day", savings: "Save ₹17/month vs weekly (9.8% cheaper)", badge: "⭐ Most Popular", color: "border-green-500", features: ["All 12 features", "30 days access", "Google Sheets backup", "Daily email backup", "Priority support"], cta: "Go Monthly", highlight: true },
  { name: "Yearly", price: 5799, origPrice: 6199, period: "per year", perDay: "₹15.9/day", savings: "Save ₹909 vs weekly (13%) | Save ₹189 vs monthly", badge: "💎 Best Value", color: "border-purple-500", features: ["All 12 features", "365 days access", "Auto Google Sheets sync", "Daily email backup", "Priority support"], cta: "Go Yearly", highlight: false },
];

const steps = [
  { n: "1", t: "Register FREE", d: "Sign up with email or phone OTP — 7-day FREE trial starts instantly, no card needed", icon: "📱" },
  { n: "2", t: "Add Parties", d: "Add customer/supplier name, mobile & address in Parties section", icon: "👥" },
  { n: "3", t: "Enter Transactions", d: "Select party in Ledger, type Naam (Credit) or Jama (Debit) in the fast entry row", icon: "⚡" },
  { n: "4", t: "Connect Backup", d: "Connect Google account for auto Sheets sync + set email backup schedule", icon: "☁️" },
  { n: "5", t: "Export & Share", d: "Download PDF/Excel statements or view Balance Sheet with one click", icon: "📊" },
];

const backupFeatures = [
  { icon: "☁️", title: "Google Sheets Sync", desc: "One-time Google account connect. All parties and ledger entries sync to a dedicated Sheet in your Drive." },
  { icon: "📧", title: "Email Backup (Daily/Weekly/Monthly)", desc: "Set your backup email and frequency — like WhatsApp. CSV file sent automatically on schedule." },
  { icon: "⬇️", title: "Instant CSV Download", desc: "Manual download anytime. UTF-8 BOM encoded — opens perfectly in Excel and Google Sheets." },
  { icon: "🔒", title: "Data Never Lost", desc: "Multiple backup options ensure your data is safe even if you switch devices or lose access." },
];

const LandingPage = () => {
  return (
    <div className="min-h-screen text-white" style={{ background: "#0A0F1E", fontFamily: "'Work Sans', sans-serif" }}>

      {/* ── Sticky Nav ─────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 shadow-lg border-b border-white/10" style={{ background: "rgba(10,15,30,0.97)", backdropFilter: "blur(12px)" }}>
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={() => scrollTo("hero")} className="flex items-center gap-2 flex-shrink-0">
            <img src={LOGO} alt="poketbook" className="w-8 h-8 object-contain" />
            <span className="font-black text-base sm:text-lg" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>
              <span className="text-white">Poket</span><span className="text-green-400">Book</span>
            </span>
          </button>
          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-0.5">
            {[["features","Features"],["backup","Backup"],["pricing","Pricing"],["how-it-works","How It Works"],["about","About Us"],["contact","Contact"]].map(([id, label]) => (
              <button key={id} onClick={() => scrollTo(id)}
                className="px-3 py-1.5 text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded transition-colors whitespace-nowrap">
                {label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link to="/login" className="text-sm text-gray-300 hover:text-white px-3 py-1.5 hidden sm:block">Login</Link>
            <button onClick={() => scrollTo("pricing")}
              className="bg-green-500 hover:bg-green-400 text-black font-bold text-sm px-3 sm:px-4 py-2 rounded-lg transition-colors whitespace-nowrap">
              Start FREE
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section id="hero" className="py-14 sm:py-20 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{ background: "radial-gradient(ellipse at center, #2563EB 0%, transparent 70%)" }} />
        <div className="relative max-w-4xl mx-auto">
          <div className="flex justify-center mb-5">
            <img src={LOGO} alt="poketbook" className="w-20 h-20 sm:w-28 sm:h-28 object-contain drop-shadow-2xl" />
          </div>
          <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-full px-3 sm:px-4 py-1.5 text-xs sm:text-sm text-green-400 mb-5">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse flex-shrink-0" />
            7-Day FREE Trial — No Credit Card Needed
          </div>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black mb-4 leading-tight" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>
            <span className="text-white">Apna Udhar-Khaata</span><br />
            <span className="text-green-400">Digital Banao</span>
          </h1>
          <p className="text-base sm:text-xl text-gray-300 max-w-2xl mx-auto mb-7 px-2">
            Fast, accurate double-entry ledger for Indian shopkeepers. Track <strong className="text-white">Naam & Jama</strong>, auto-backup to Google Sheets, get email reports — all in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
            <Link to="/login"
              className="bg-green-500 hover:bg-green-400 text-black font-black text-base sm:text-lg px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl transition-colors inline-flex items-center justify-center gap-2 shadow-lg shadow-green-500/20">
              Start 7-Day FREE Trial <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="border-2 border-white/20 text-white font-semibold text-base sm:text-lg px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl hover:bg-white/10 transition-colors text-center">
              Already a user? Login
            </Link>
          </div>
          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-400 px-2">
            {["100% FREE to Start","Double-Entry Ledger","Google Sheets Backup","Auto Email Backup","Phone OTP Login","PDF + Excel Export","Tally & Lock"].map(t => (
              <span key={t} className="flex items-center gap-1.5"><CheckCircle size={12} className="text-green-400 flex-shrink-0" />{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── App Preview (mobile-scrollable) ────────────────────── */}
      <section className="py-8 sm:py-10 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-2xl overflow-hidden shadow-2xl border border-white/10">
            {/* Browser bar */}
            <div className="px-4 py-2.5 flex items-center gap-2 flex-shrink-0" style={{ background: "#0F172A" }}>
              <div className="flex gap-1.5 flex-shrink-0">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500"/><div className="w-2.5 h-2.5 rounded-full bg-yellow-500"/><div className="w-2.5 h-2.5 rounded-full bg-green-500"/>
              </div>
              <div className="flex-1 bg-white/10 rounded px-2 py-1 text-xs text-gray-400 text-center max-w-[180px] sm:max-w-xs mx-auto truncate">poketbook.in/ledger</div>
            </div>
            {/* App header */}
            <div className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold flex items-center justify-between" style={{ background: "#1E293B" }}>
              <span className="truncate mr-2">Settling Entry | Party :- Ramesh Sharma</span>
              <span className="text-blue-400 font-mono whitespace-nowrap flex-shrink-0 text-xs">15,000 देने</span>
            </div>
            {/* Table — horizontally scrollable on mobile */}
            <div className="overflow-x-auto" style={{ background: "#FFF7ED" }}>
              <div className="min-w-[560px]">
                <div className="grid grid-cols-6 text-xs font-bold px-3 py-2 gap-1 text-white" style={{ background: "#78350F" }}>
                  <div>DATE</div><div>PARTY</div><div className="text-right">CREDIT</div>
                  <div className="text-right">DEBIT</div><div className="hidden sm:block">NOTE</div><div className="text-right">BAL</div>
                </div>
                {[
                  { date:"20 Apr", party:"Priya Textiles", credit:"15,000", debit:"", note:"Kapda", bal:"15,000" },
                  { date:"22 Apr", party:"Mohan Trading", credit:"", debit:"5,000", note:"Payment", bal:"10,000" },
                ].map((r) => (
                  <div key={`${r.party}-${r.date}`} className="grid grid-cols-6 text-xs px-3 py-2 gap-1 border-b border-orange-100" style={{ color:"#1c1917" }}>
                    <div className="font-mono font-semibold">{r.date}</div>
                    <div className="font-semibold truncate" style={{ color:"#1D4ED8" }}>{r.party}</div>
                    <div className="text-right font-mono font-bold" style={{ color:"#991B1B" }}>{r.credit}</div>
                    <div className="text-right font-mono font-bold" style={{ color:"#166534" }}>{r.debit}</div>
                    <div className="hidden sm:block text-gray-500 truncate">{r.note}</div>
                    <div className="text-right font-mono font-bold" style={{ color:"#1D4ED8" }}>{r.bal}</div>
                  </div>
                ))}
                {/* Entry row */}
                <div className="flex gap-1.5 items-end px-3 py-2.5 flex-wrap" style={{ background: "#F97316" }}>
                  <div className="bg-black/20 rounded px-1.5 py-1 text-white text-xs font-mono whitespace-nowrap">07:45pm ●</div>
                  <input readOnly className="border border-stone-600 px-1.5 py-1.5 text-xs font-mono bg-white rounded w-20 text-stone-800" defaultValue="22-04-26" />
                  <select className="border border-stone-600 px-1.5 py-1.5 text-xs bg-white rounded w-24 text-stone-800"><option>-- Party --</option></select>
                  <input readOnly className="border border-stone-600 px-1.5 py-1.5 text-xs font-mono bg-white rounded w-16 text-right text-stone-800" defaultValue="0.00" />
                  <input readOnly className="border border-stone-600 px-1.5 py-1.5 text-xs font-mono bg-white rounded w-16 text-right text-stone-800" defaultValue="0.00" />
                  <input readOnly className="border border-stone-600 px-1.5 py-1.5 text-xs bg-white rounded flex-1 min-w-[60px] text-stone-800" placeholder="Note..." />
                  <button className="bg-white border-2 border-stone-700 px-3 py-1.5 text-xs font-black text-stone-900 rounded whitespace-nowrap">OK</button>
                </div>
              </div>
            </div>
          </div>
          <p className="text-center text-gray-500 text-xs sm:text-sm mt-3">← Scroll horizontally on mobile to see full ledger →</p>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────── */}
      <section id="features" className="py-16 sm:py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10 sm:mb-14">
            <h2 className="text-3xl sm:text-4xl font-black mb-3" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>12 Powerful Features</h2>
            <p className="text-gray-400 text-base sm:text-lg">Everything a modern Indian business needs — ledger, backup, export, and security</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {features.map((f) => (
              <div key={f.title} className="border border-white/10 rounded-xl p-5 hover:border-white/20 transition-all" style={{ background: "#111827" }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: f.color + "22" }}>
                    <f.icon size={19} style={{ color: f.color }} />
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full ml-2" style={{ background: f.color + "22", color: f.color }}>{f.tag}</span>
                </div>
                <div className="font-bold text-base text-white mb-0.5">{f.title}</div>
                <div className="text-xs text-gray-500 mb-2">{f.sub}</div>
                <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Backup Showcase ─────────────────────────────────────── */}
      <section id="backup" className="py-16 sm:py-20 px-4" style={{ background: "#0D1117" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 sm:mb-14">
            <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-full px-3 sm:px-4 py-1.5 text-xs sm:text-sm text-green-400 mb-4">
              <Cloud size={13} /> Backup & Data Safety
            </div>
            <h2 className="text-3xl sm:text-4xl font-black mb-3" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>Apna Data Kabhi Mat Khona</h2>
            <p className="text-gray-400 text-base sm:text-lg max-w-xl mx-auto">Multiple backup options — Google Sheets sync, scheduled email delivery, and manual CSV download</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 mb-10 sm:mb-12">
            {backupFeatures.map((b) => (
              <div key={b.title} className="rounded-xl p-5 sm:p-6 border border-white/10 flex gap-4" style={{ background: "#111827" }}>
                <div className="text-2xl sm:text-3xl flex-shrink-0">{b.icon}</div>
                <div>
                  <div className="font-bold text-white text-sm sm:text-base mb-1">{b.title}</div>
                  <p className="text-gray-400 text-sm leading-relaxed">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
          {/* WhatsApp backup UI mockup */}
          <div className="max-w-sm mx-auto rounded-2xl overflow-hidden border border-white/10 shadow-xl" style={{ background: "#111827" }}>
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10" style={{ background: "#0A1628" }}>
              <div className="text-lg">💾</div>
              <div>
                <div className="text-sm font-bold text-white">Auto Backup to Email</div>
                <div className="text-xs text-gray-400">WhatsApp ki tarah schedule karein</div>
              </div>
              <span className="ml-auto text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-semibold">Active ✓</span>
            </div>
            <div className="px-4 py-4 space-y-2">
              <div className="flex items-center justify-between py-2 px-3 rounded-lg" style={{ background: "#1E293B" }}>
                <div className="text-sm text-white truncate mr-2">user@gmail.com</div>
                <span className="text-xs text-blue-400 font-semibold flex-shrink-0">Change</span>
              </div>
              {[
                { v:"off", l:"Kabhi Nahi", emoji:"🔕", a:false },
                { v:"daily", l:"Daily", emoji:"📅", a:false },
                { v:"weekly", l:"Weekly", emoji:"📆", a:true },
                { v:"monthly", l:"Monthly", emoji:"🗓️", a:false },
              ].map(opt => (
                <div key={opt.v} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl ${opt.a ? "border border-green-500/50" : ""}`}
                  style={{ background: opt.a ? "#0A2A0F" : "transparent" }}>
                  <span>{opt.emoji}</span>
                  <span className={`text-sm font-semibold ${opt.a ? "text-white" : "text-gray-400"}`}>{opt.l}</span>
                  {opt.a && <span className="ml-auto text-green-400">✓</span>}
                </div>
              ))}
              <button className="w-full py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2" style={{ background: "#16A34A" }}>
                📧 Backup Now (Send Email)
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ────────────────────────────────────────────── */}
      <section id="pricing" className="py-16 sm:py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 sm:mb-14">
            <h2 className="text-3xl sm:text-4xl font-black mb-3" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>Simple Pricing</h2>
            <p className="text-gray-400 text-base sm:text-lg mb-4">Start with <strong className="text-green-400">7-day FREE trial</strong>. No credit card. All 12 features included.</p>
            <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-full px-4 py-2 text-sm text-green-300">
              <CheckCircle size={14} className="text-green-400" />
              7-Day FREE Trial → Then choose your plan
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
            {plans.map((p) => (
              <div key={p.name} className={`border-2 ${p.color} rounded-2xl p-6 flex flex-col relative ${p.highlight ? "sm:scale-105 shadow-2xl shadow-green-500/10" : ""}`}
                style={{ background: p.highlight ? "#0F2A0F" : "#111827" }}>
                {p.badge && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-green-500 text-black text-xs font-black px-3 py-1 rounded-full whitespace-nowrap">
                    {p.badge}
                  </div>
                )}
                <div className="mb-5">
                  <div className="text-lg font-bold text-white mb-2">{p.name}</div>
                  <div className="flex items-baseline gap-1 mb-1">
                    {p.origPrice && <span className="text-gray-500 line-through text-sm">₹{p.origPrice.toLocaleString("en-IN")}</span>}
                    <span className="text-4xl font-black text-white">₹{p.price.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="text-sm text-gray-400">{p.period}</div>
                  <div className="text-xs text-gray-600 mt-0.5 font-mono">{p.perDay}</div>
                  {p.savings && <div className="mt-2 text-xs text-green-400 font-semibold leading-tight">{p.savings}</div>}
                </div>
                <ul className="space-y-2 mb-6 flex-1">
                  {p.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                      <CheckCircle size={12} className="text-green-400 flex-shrink-0" />{f}
                    </li>
                  ))}
                </ul>
                <Link to="/login" className={`w-full py-3 rounded-xl font-bold text-sm text-center transition-colors ${p.highlight ? "bg-green-500 hover:bg-green-400 text-black" : "bg-white/10 hover:bg-white/20 text-white"}`}>
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
          <div className="p-4 sm:p-5 rounded-xl border border-blue-500/20 text-center" style={{ background: "#0A1628" }}>
            <p className="text-sm text-gray-300">
              💡 <strong className="text-white">Monthly vs Weekly:</strong> Save ₹17/month — no weekly renewals&nbsp;|&nbsp;
              <strong className="text-white">Yearly:</strong> Save <span className="text-green-400 font-bold">₹909 (13% off)</span> vs weekly
            </p>
          </div>
        </div>
      </section>

      {/* ── How it Works ───────────────────────────────────────── */}
      <section id="how-it-works" className="py-16 sm:py-20 px-4" style={{ background: "#0D1117" }}>
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-black mb-3" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>5 Steps to Get Started</h2>
          <p className="text-gray-400 mb-10 sm:mb-14">Setup in under 3 minutes</p>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-5 sm:gap-6">
            {steps.map((s, i) => (
              <div key={s.n} className="relative">
                <div className="w-12 sm:w-14 h-12 sm:h-14 rounded-full font-black text-xl sm:text-2xl flex items-center justify-center mx-auto mb-3 text-black" style={{ background: "#22C55E" }}>
                  {s.icon}
                </div>
                {i < steps.length - 1 && <div className="hidden sm:block absolute top-6 sm:top-7 left-[calc(50%+28px)] w-[calc(100%-56px)] h-0.5 bg-green-900" />}
                <div className="font-bold text-white text-sm mb-1">Step {s.n}: {s.t}</div>
                <div className="text-xs text-gray-400 leading-relaxed">{s.d}</div>
              </div>
            ))}
          </div>
          <div className="mt-10">
            <Link to="/how-to-use" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-colors">
              📖 Detailed How to Use Guide (with Screenshots) <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Phone Login ─────────────────────────────────────────── */}
      <section className="py-14 sm:py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-full px-3 py-1.5 text-xs sm:text-sm text-amber-400 mb-4">
                <Phone size={13} /> Phone OTP Login
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white mb-4" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>
                Password yaad karne ki<br /><span className="text-green-400">zaroorat nahi</span>
              </h2>
              <p className="text-gray-400 text-sm sm:text-base leading-relaxed mb-6">
                Apne phone number se login karein. OTP aayega, verify karo — aur seedha apne khaate mein. New users ko <strong className="text-green-400">7-day FREE trial</strong> automatically milega.
              </p>
              <div className="space-y-2.5">
                {["Phone number enter karo → OTP instant milega","6-digit OTP verify karo → Instant login","New user? 7-day FREE trial starts automatically","No password to remember ever"].map(t => (
                  <div key={t} className="flex items-center gap-2 text-sm text-gray-300">
                    <CheckCircle size={13} className="text-green-400 flex-shrink-0" />{t}
                  </div>
                ))}
              </div>
            </div>
            {/* Phone OTP mockup */}
            <div className="rounded-2xl p-5 sm:p-6 border border-white/10 max-w-xs mx-auto w-full" style={{ background: "#111827" }}>
              <div className="flex items-center gap-2 mb-4">
                <img src={LOGO} alt="poketbook" className="w-7 h-7 object-contain" />
                <span className="font-black text-white text-sm">Poket<span className="text-green-400">Book</span></span>
              </div>
              <div className="flex border border-white/10 rounded-lg overflow-hidden mb-4">
                <div className="flex-1 py-2 text-center text-xs font-semibold text-gray-400">Email Login</div>
                <div className="flex-1 py-2 text-center text-xs font-bold text-white" style={{ background: "#2563EB" }}>Phone OTP</div>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-gray-400 mb-1">Phone Number</div>
                  <div className="flex gap-2">
                    <div className="bg-white/5 border border-white/10 rounded px-2 py-2 text-xs text-gray-400">+91</div>
                    <div className="flex-1 bg-white/5 border border-white/10 rounded px-3 py-2 text-xs text-gray-300 font-mono">9876 543 210</div>
                  </div>
                </div>
                <button className="w-full py-2.5 rounded-lg text-sm font-bold text-white" style={{ background: "#16A34A" }}>OTP Bhejein</button>
                <div className="p-2 rounded-lg border border-green-500/30 text-xs text-green-400" style={{ background: "#0A2A0F" }}>✓ OTP sent to +91 9876543210</div>
                <div>
                  <div className="text-xs text-gray-400 mb-1">6-Digit OTP</div>
                  <div className="bg-white/5 border border-blue-500/50 rounded px-3 py-2 text-xl font-mono text-center text-white tracking-[0.4em]">• • • • • •</div>
                </div>
                <button className="w-full py-2.5 rounded-lg text-sm font-bold text-white" style={{ background: "#2563EB" }}>Verify & Login</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── About ──────────────────────────────────────────────── */}
      <section id="about" className="py-16 sm:py-20 px-4" style={{ background: "#0D1117" }}>
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-black mb-5" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>About poketbook</h2>
          <div className="flex justify-center mb-5">
            <img src={LOGO} alt="poketbook" className="w-16 h-16 sm:w-20 sm:h-20 object-contain" />
          </div>
          <p className="text-gray-300 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto mb-8">
            poketbook is a digital Udhar Khaata system built for Indian shopkeepers, traders and small businesses. We believe every small business deserves modern accounting — fast, accurate, backed up, and affordable.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-2xl mx-auto">
            {[["FREE","7-Day Trial"],["12","Features"],["3","Backup Options"],["100%","Data Isolated"]].map(([v, l]) => (
              <div key={l} className="rounded-xl p-4 border border-white/10" style={{ background: "#111827" }}>
                <div className="text-xl sm:text-2xl font-black text-green-400">{v}</div>
                <div className="text-xs text-gray-400 mt-1">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Parent Company ─────────────────────────────────────── */}
      <section id="parent" className="py-14 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-black mb-3" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>Our Parent Company</h2>
          <p className="text-gray-400 mb-6">poketbook is proudly built by</p>
          <div className="rounded-2xl p-6 sm:p-8 border border-white/10 inline-block max-w-sm w-full" style={{ background: "#111827" }}>
            <div className="text-2xl sm:text-3xl font-black text-white mb-2">Flutter Fox</div>
            <p className="text-gray-400 text-sm mb-5">Web &amp; Mobile App Development, New Delhi, India</p>
            <a href="https://flutterfox.in" rel="dofollow" target="_blank"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-2.5 rounded-lg transition-colors text-sm">
              <ExternalLink size={15} /> Visit flutterfox.in
            </a>
          </div>
          <p className="mt-5 text-sm text-gray-500">
            Made with ❤️ in house of{" "}
            <a href="https://flutterfox.in" rel="dofollow" target="_blank" className="text-blue-400 hover:text-blue-300 underline">Flutter Fox</a>
          </p>
        </div>
      </section>

      {/* ── Contact ────────────────────────────────────────────── */}
      <section id="contact" className="py-16 sm:py-20 px-4" style={{ background: "#0D1117" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 sm:mb-12">
            <h2 className="text-3xl sm:text-4xl font-black mb-3" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>Contact Us</h2>
            <p className="text-gray-400">Koi bhi sawaal ho — hum yahan hain</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 mb-8 sm:mb-10">
            <a href="mailto:Solution@poketbook.in" className="rounded-2xl p-5 sm:p-6 flex flex-col items-center text-center border border-white/10 hover:border-blue-500/50 transition-colors" style={{ background: "#111827" }}>
              <div className="w-11 h-11 bg-blue-600 rounded-xl flex items-center justify-center mb-3"><Mail size={20} /></div>
              <div className="font-bold text-white mb-1">Email</div>
              <div className="text-sm text-blue-400">Solution@poketbook.in</div>
              <div className="text-xs text-gray-500 mt-1">Reply within 24 hours</div>
            </a>
            <a href="https://wa.me/918130095013" target="_blank" rel="noopener noreferrer" className="rounded-2xl p-5 sm:p-6 flex flex-col items-center text-center border border-white/10 hover:border-green-500/50 transition-colors" style={{ background: "#111827" }}>
              <div className="w-11 h-11 bg-green-600 rounded-xl flex items-center justify-center mb-3"><Phone size={20} /></div>
              <div className="font-bold text-white mb-1">WhatsApp / Call</div>
              <div className="text-sm text-green-400">+91 81300 95013</div>
              <div className="text-xs text-gray-500 mt-1">Mon–Sat 10am–7pm IST</div>
            </a>
            <a href="https://flutterfox.in" rel="dofollow" target="_blank" className="rounded-2xl p-5 sm:p-6 flex flex-col items-center text-center border border-white/10 hover:border-purple-500/50 transition-colors" style={{ background: "#111827" }}>
              <div className="w-11 h-11 bg-purple-600 rounded-xl flex items-center justify-center mb-3"><ExternalLink size={20} /></div>
              <div className="font-bold text-white mb-1">Flutter Fox</div>
              <div className="text-sm text-purple-400">flutterfox.in</div>
              <div className="text-xs text-gray-500 mt-1">Our parent company</div>
            </a>
          </div>
          <div className="max-w-xl mx-auto rounded-2xl p-5 sm:p-6 border border-white/10" style={{ background: "#111827" }}>
            <h3 className="text-base sm:text-lg font-bold text-white mb-4">Quick Message</h3>
            <form onSubmit={e => { e.preventDefault(); window.open(`mailto:Solution@poketbook.in?subject=Enquiry from ${e.target.name.value}&body=${e.target.msg.value}`, "_blank"); }} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input name="name" required placeholder="Naam" className="bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 placeholder-gray-600" />
                <input name="email" type="email" placeholder="Email" className="bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 placeholder-gray-600" />
              </div>
              <textarea name="msg" required rows={3} placeholder="Apna sawaal likhein..." className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 resize-none placeholder-gray-600" />
              <button type="submit" className="w-full bg-green-500 hover:bg-green-400 text-black font-bold py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2">
                <Mail size={14} /> Send Message
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* ── Final CTA ──────────────────────────────────────────── */}
      <section className="py-16 sm:py-20 px-4 text-center" style={{ background: "linear-gradient(135deg, #0F2A0F 0%, #0A1628 50%, #1A0A2E 100%)" }}>
        <img src={LOGO} alt="poketbook" className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-5 object-contain" />
        <h2 className="text-3xl sm:text-4xl font-black mb-4" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>Aaj Hi Shuru Karein — FREE!</h2>
        <p className="text-gray-300 text-base sm:text-lg mb-2">7-day FREE trial. All 12 features. Google Sheets + Email backup included.</p>
        <p className="text-gray-500 text-sm mb-8">No credit card. No setup fee. Completely FREE to start.</p>
        <Link to="/login" className="bg-green-500 hover:bg-green-400 text-black font-black text-lg sm:text-xl px-8 sm:px-10 py-3.5 sm:py-4 rounded-xl inline-flex items-center gap-3 transition-colors shadow-xl shadow-green-500/20">
          Start 7-Day FREE Trial <ArrowRight size={20} />
        </Link>
        <p className="mt-4 text-gray-500 text-sm">Demo: admin@khaata.com / admin123</p>
      </section>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="border-t border-white/10 py-8 sm:py-10 px-4" style={{ background: "#050A14" }}>
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 mb-8">
            <div className="col-span-2 sm:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <img src={LOGO} alt="poketbook" className="w-7 h-7 object-contain" />
                <span className="font-black text-white text-sm">Poket<span className="text-green-400">Book</span></span>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">Digital Udhar Khaata with Google Sheets backup for Indian businesses.</p>
            </div>
            <div>
              <p className="font-bold text-white mb-3 text-xs uppercase tracking-wide">Product</p>
              <div className="space-y-2">{[["features","Features"],["backup","Backup"],["pricing","Pricing"],["how-it-works","How It Works"]].map(([id,l])=>(
                <button key={id} onClick={()=>scrollTo(id)} className="block text-sm text-gray-400 hover:text-white transition-colors">{l}</button>
              ))}</div>
            </div>
            <div>
              <p className="font-bold text-white mb-3 text-xs uppercase tracking-wide">Company</p>
              <div className="space-y-2">
                <button onClick={()=>scrollTo("about")} className="block text-sm text-gray-400 hover:text-white transition-colors">About Us</button>
                <a href="https://flutterfox.in" rel="dofollow" target="_blank" className="block text-sm text-gray-400 hover:text-white transition-colors">Flutter Fox</a>
                <Link to="/how-to-use" className="block text-sm text-gray-400 hover:text-white transition-colors">How to Use</Link>
                <Link to="/contact" className="block text-sm text-gray-400 hover:text-white transition-colors">Contact Us</Link>
              </div>
            </div>
            <div>
              <p className="font-bold text-white mb-3 text-xs uppercase tracking-wide">Contact</p>
              <div className="space-y-2 text-sm text-gray-400">
                <p>📧 <a href="mailto:Solution@poketbook.in" className="hover:text-white">Solution@poketbook.in</a></p>
                <p>📞 <a href="tel:+918130095013" className="hover:text-white">+91 81300 95013</a></p>
                <p>📍 New Delhi, India</p>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 text-center space-y-1">
            <p className="text-gray-300 text-sm">
              Made with ❤️ in house of{" "}
              <a href="https://flutterfox.in" rel="dofollow" target="_blank" className="text-blue-400 hover:text-blue-300 underline font-semibold">Flutter Fox</a>
            </p>
            <p className="text-gray-600 text-xs">© {new Date().getFullYear()} poketbook by Flutter Fox. All Rights Reserved. | poketbook.in</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
