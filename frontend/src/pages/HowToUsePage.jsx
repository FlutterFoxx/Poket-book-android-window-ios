import { Link } from "react-router-dom";
import { IndianRupee, ChevronDown, Phone, Mail, ArrowRight } from "lucide-react";
import { useState } from "react";

const LOGO = "/logo.png";

// ── Reusable Screen Mockup components ─────────────────────────────────────────
const AppHeader = ({ title, subtitle, balance }) => (
  <div className="rounded-t-xl overflow-hidden">
    <div className="px-3 py-2 text-xs font-bold text-white flex items-center justify-between" style={{ background: "#0F172A" }}>
      <span className="truncate">{title}</span>
      {balance && <span className="text-blue-400 font-mono ml-2 flex-shrink-0">{balance}</span>}
    </div>
    {subtitle && <div className="px-3 py-1 text-xs text-gray-400" style={{ background: "#1E293B" }}>{subtitle}</div>}
  </div>
);

const ScreenShot = ({ children, label }) => (
  <div className="rounded-xl overflow-hidden border-2 border-white/10 shadow-lg max-w-full">
    <div className="px-3 py-1.5 flex items-center gap-1.5" style={{ background: "#1a1a2e" }}>
      <div className="w-2 h-2 rounded-full bg-red-500"/><div className="w-2 h-2 rounded-full bg-yellow-500"/><div className="w-2 h-2 rounded-full bg-green-500"/>
      <span className="text-gray-500 text-xs ml-1">poketbook.in</span>
    </div>
    {children}
    {label && <div className="px-3 py-1.5 text-xs text-gray-500 text-center border-t border-white/10" style={{ background: "#111827" }}>{label}</div>}
  </div>
);

// ── Step sections data ─────────────────────────────────────────────────────────
const steps = [
  {
    id: 1, emoji: "📱", title: "Register / Login",
    desc: "Pehle step mein apna account banayein. Aap email se ya phone OTP se sign up kar sakte hain. New users ko automatically 7-day FREE trial milega — koi credit card nahi chahiye.",
    tips: ["Email tab: Naam, Email, Password bharo → Register FREE click karo","Phone tab: Mobile number dalo → OTP aayega → Verify karo","Demo access: admin@khaata.com / admin123"],
    screen: (
      <div style={{ background: "#0A0F1E" }} className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <img src={LOGO} alt="poketbook" className="w-8 h-8 object-contain" />
          <span className="font-black text-white text-sm">Poket<span className="text-green-400">Book</span></span>
        </div>
        <div className="flex border border-white/10 rounded-lg overflow-hidden mb-3 text-xs">
          <div className="flex-1 py-2 text-center text-gray-400">Email Login</div>
          <div className="flex-1 py-2 text-center font-bold text-white" style={{ background: "#2563EB" }}>Register FREE</div>
        </div>
        <div className="space-y-2.5">
          <div><div className="text-xs text-gray-400 mb-1">Name *</div><div className="bg-white/5 border border-white/10 rounded px-3 py-2 text-xs text-white">Ramesh Kumar</div></div>
          <div><div className="text-xs text-gray-400 mb-1">Email *</div><div className="bg-white/5 border border-white/10 rounded px-3 py-2 text-xs text-white">ramesh@gmail.com</div></div>
          <div><div className="text-xs text-gray-400 mb-1">Password *</div><div className="bg-white/5 border border-white/10 rounded px-3 py-2 text-xs text-gray-400">••••••••</div></div>
          <div className="py-2.5 rounded-lg text-xs font-bold text-black text-center" style={{ background: "#2563EB" }}>
            <span className="text-white">Register FREE — 7-Day Trial</span>
          </div>
          <div className="text-xs text-center text-green-400">✓ 7-day FREE trial starts instantly</div>
        </div>
      </div>
    )
  },
  {
    id: 2, emoji: "👥", title: "Party Add Karein",
    desc: "Left menu mein 'Parties / Khata' section open karein. 'Naya Party Add Karein' button dabayein. Party ka naam (Title Case mein auto-convert hoga), mobile number aur address bharo.",
    tips: ["Party name Title Case mein auto-format hota hai — RAMESH → Ramesh","Mobile number se party ko search kar sakte hain","Party delete karne ke liye balance zero hona zaroori hai"],
    screen: (
      <div style={{ background: "#0F172A" }}>
        <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
          <span className="text-sm font-bold text-white">Parties / Khatadar</span>
          <button className="text-xs text-white font-bold px-2 py-1 rounded" style={{ background: "#2563EB" }}>+ Add</button>
        </div>
        <div className="p-3 space-y-1">
          {[["Ramesh Sharma","9876543210","₹15,000","text-blue-400"],["Priya Textiles","9988776655","₹8,500","text-blue-400"],["Mohan Trading","9123456780","₹0 Barabar","text-gray-400"]].map(([n,m,b,c]) => (
            <div key={n} className="flex items-center justify-between px-3 py-2.5 rounded-lg text-xs" style={{ background: "#1E293B" }}>
              <div><div className="font-semibold text-white">{n}</div><div className="text-gray-500">{m}</div></div>
              <span className={`font-mono font-bold ${c}`}>{b}</span>
            </div>
          ))}
        </div>
        {/* Add Party Modal */}
        <div className="mx-3 mb-3 rounded-lg border border-blue-500/30 p-3" style={{ background: "#0A1628" }}>
          <div className="text-xs font-bold text-white mb-2">Naya Party Add Karein</div>
          <div className="space-y-1.5">
            <div className="bg-white/5 border border-white/10 rounded px-2 py-1.5 text-xs text-white">Sita Enterprises</div>
            <div className="bg-white/5 border border-white/10 rounded px-2 py-1.5 text-xs text-gray-400">9012345678</div>
            <button className="w-full text-xs font-bold text-black py-1.5 rounded" style={{ background: "#22C55E" }}>Add Karein</button>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 3, emoji: "📖", title: "Ledger Open Karein",
    desc: "Top menu mein 'Ledger / Bahi' tab select karein. Party Name dropdown mein apni party choose karein. Party ka poora ledger khuljayega — Balance header mein dikhega.",
    tips: ["Balance:- 15,000 देने = party ne credit diya (Dena hai unhe)","Balance:- 8,000 लेने = party ko credit mila (Lena hai unhe)","'Show Full Account' toggle se party info panel show/hide karein"],
    screen: (
      <div>
        <div className="px-3 py-2 text-xs font-semibold text-white flex items-center justify-between" style={{ background: "#0F172A" }}>
          <span>Settling Entry | Party :- Ramesh Sharma</span>
        </div>
        <div className="px-3 py-2 flex items-center gap-2 flex-wrap" style={{ background: "#1a2744" }}>
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-gray-300">Party Name</span>
            <div className="bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-xs">Ramesh Sharma ▼</div>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="text-xs text-gray-300">Balance:-</span>
            <div className="border-2 border-blue-400 bg-black/20 rounded px-2 py-1 text-blue-400 font-mono font-bold text-xs">15,000 देने</div>
          </div>
        </div>
        <div className="text-xs px-3 py-1.5 text-amber-200" style={{ background: "#1a1a00" }}>
          Party: Ramesh Sharma | Mobile: 9876543210 | Entries: 3 | Total Credit: 20,000
        </div>
        <div className="grid grid-cols-4 text-xs font-bold px-3 py-1.5 text-white" style={{ background: "#78350F" }}>
          <div>DATE</div><div>PARTY</div><div className="text-right">CREDIT</div><div className="text-right">BAL</div>
        </div>
        {[["20 Apr","Priya","15,000","15,000"],["22 Apr","Mohan","5,000","20,000"],["23 Apr","Priya","-","5,000 Ret"]].map((r,i) => (
          <div key={r[0]+r[1]} className="grid grid-cols-4 text-xs px-3 py-2 border-b border-orange-100" style={{ background: i%2===0?"#FFE8CC":"#FFDAB0", color:"#1c1917" }}>
            <div className="font-mono">{r[0]}</div><div className="text-blue-700 font-semibold truncate">{r[1]}</div>
            <div className="text-right font-mono text-red-700">{r[2]}</div>
            <div className="text-right font-mono text-blue-700">{r[3]}</div>
          </div>
        ))}
      </div>
    )
  },
  {
    id: 4, emoji: "⚡", title: "Naam / Jama Entry Karein",
    desc: "Ledger ke neeche orange entry row mein aap fast entry kar sakte hain. Date auto-filled rahegi. Counterparty party select karo. Naam (Credit) ya Jama (Debit) amount dalein. OK dabao ya Enter press karo.",
    tips: ["Tab key se fields mein move karein — mouse ki zaroorat nahi","Naam (Credit) = party ne credit diya → party DENA ho jaati hai (Blue)","Jama (Debit) = party ko credit mila → party LENA ho jaati hai (Red)","Enter OK pe dabane se entry save hoti hai — sound bhi aata hai!"],
    screen: (
      <div>
        <div className="grid grid-cols-6 text-xs font-bold px-3 py-1.5 text-white" style={{ background: "#78350F" }}>
          <div>DATE</div><div>PARTY</div><div className="text-right">NAAM</div><div className="text-right">JAMA</div><div className="hidden sm:block">NOTE</div><div className="text-right">BAL</div>
        </div>
        <div className="grid grid-cols-6 text-xs px-3 py-2 border-b" style={{ background: "#FFE8CC", color:"#1c1917" }}>
          <div className="font-mono">24 Apr</div><div className="text-blue-700 font-semibold">Priya</div>
          <div className="text-right font-mono text-red-700 font-bold">5,000</div><div></div>
          <div className="hidden sm:block text-gray-500">Maal</div>
          <div className="text-right font-mono text-blue-700 font-bold">5,000</div>
        </div>
        {/* Entry row */}
        <div className="px-3 py-3 space-y-2" style={{ background: "#FF8C00" }}>
          <div className="text-xs font-bold text-white mb-1">New Entry:</div>
          <div className="flex gap-1.5 flex-wrap">
            <div className="bg-black/20 rounded px-2 py-1 text-white text-xs font-mono">08:30pm ●</div>
            <input readOnly className="border border-stone-700 px-2 py-1.5 text-xs font-mono bg-white rounded w-20" defaultValue="24-04-26" />
            <select className="border border-stone-700 px-2 py-1.5 text-xs bg-white rounded w-24"><option>Priya Textiles</option></select>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            <div>
              <input readOnly className="border border-red-300 px-2 py-1.5 text-xs font-mono bg-white rounded w-20 text-right" defaultValue="5000" />
              <div className="text-xs text-white font-bold text-center">नाम</div>
            </div>
            <div>
              <input readOnly className="border border-green-400 px-2 py-1.5 text-xs font-mono bg-white rounded w-20 text-right" defaultValue="" placeholder="0.00" />
              <div className="text-xs text-white font-bold text-center">जमा</div>
            </div>
            <input readOnly className="border border-stone-700 px-2 py-1.5 text-xs bg-white rounded flex-1 min-w-[60px]" defaultValue="Kapda supply" />
            <button className="bg-white border-2 border-stone-700 px-3 py-1.5 text-xs font-black text-stone-900 rounded">OK</button>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 5, emoji: "💰", title: "Dena / Lena Samjhein",
    desc: "poketbook mein balance color se samajh aata hai. DENA (Blue) = party ne credit diya, unhe dena hai. LENA (Red) = party ko credit mila, unhe lena hai. Balance Sheet mein dono sides clearly dikhti hain.",
    tips: ["Naam (Credit) entries → DENA hai (Blue) — party will pay","Jama (Debit) entries → LENA hai (Red) — party will receive","Balance Sheet: LEFT = DENA (Blue) parties, RIGHT = LENA (Red) parties","Net Balance automatically calculate hota hai"],
    screen: (
      <div>
        <div className="px-3 py-2 text-xs font-bold text-white" style={{ background: "#0F172A" }}>Balance Sheet</div>
        <div className="grid grid-cols-2 border-b border-gray-300 text-xs font-bold" style={{ background: "#e5e7eb", color: "#111" }}>
          <div className="px-3 py-2 text-blue-800">DENA HAI / देना है</div>
          <div className="px-3 py-2 text-red-800 border-l border-gray-300">LENA HAI / लेना है</div>
        </div>
        {[["Ramesh Sharma","15,000","Priya Textiles","8,500"],["Mohan Trading","5,000","Sita Ent.","3,000"],["","","",""]].map(([d,da,l,la],i) => (
          <div key={`bs-row-${d || i}-${l || i}`} className="grid grid-cols-2 text-xs border-b" style={{ background: i%2===0?"white":"#f9fafb" }}>
            <div className="px-3 py-2 text-blue-700 font-semibold border-r border-gray-200 flex justify-between">
              <span>{d}</span><span className="font-mono font-bold">{da}</span>
            </div>
            <div className="px-3 py-2 text-red-700 font-semibold flex justify-between">
              <span>{l}</span><span className="font-mono font-bold">{la}</span>
            </div>
          </div>
        ))}
        <div className="grid grid-cols-2 text-xs font-bold" style={{ background: "#dbeafe" }}>
          <div className="px-3 py-2 text-blue-800 border-r border-gray-200 flex justify-between"><span>Total Dena</span><span className="font-mono">20,000</span></div>
          <div className="px-3 py-2 text-red-800 flex justify-between"><span>Total Lena</span><span className="font-mono">11,500</span></div>
        </div>
        <div className="px-3 py-2 text-xs text-center font-bold" style={{ background: "#1E293B" }}>
          <span className="text-gray-300">Net Balance: </span><span className="text-blue-400 font-mono">₹8,500 देने</span>
        </div>
      </div>
    )
  },
  {
    id: 6, emoji: "🔒", title: "Tally / Lock Karein",
    desc: "Period end par 'Tally (N)' button dabao. Confirm karo — sab unlocked entries lock ho jaayengi. Locked entries viewable hain but kabhi edit nahi ho sakti. Closing balance snapshot save hota hai.",
    tips: ["F4 key se most recent entry edit karo","Tally ke baad entries mein * (star) dikhta hai — locked","Locked party ko delete karne ke liye pehle balance zero karo","Tally se audit trail perfect rahti hai"],
    screen: (
      <div style={{ background: "#0A0F1E" }}>
        <div className="px-3 py-2 text-xs flex items-center justify-between" style={{ background: "#0F172A" }}>
          <span className="text-white font-semibold">Ramesh Sharma Ledger</span>
          <button className="text-xs font-bold text-white px-2 py-1 rounded" style={{ background: "#F59E0B" }}>Tally (2)</button>
        </div>
        <div className="space-y-0">
          {[["20 Apr","Priya","5,000","5,000","★"],["22 Apr","Mohan","8,000","13,000","★"],["24 Apr","Sita","2,000","15,000",""]].map((r,i) => (
            <div key={r[0]} className="grid grid-cols-5 text-xs px-3 py-2 border-b border-amber-200 items-center" style={{ background: i%2===0?"#FFE8CC":"#FFDAB0", color:"#1c1917" }}>
              <div className="font-mono">{r[0]}</div><div className="text-blue-700 font-semibold truncate">{r[1]}</div>
              <div className="text-right font-mono text-red-700">{r[2]}</div>
              <div className="text-right font-mono text-blue-700">{r[3]}</div>
              <div className="text-center font-bold text-amber-700">{r[4]}</div>
            </div>
          ))}
        </div>
        {/* Tally confirm modal */}
        <div className="mx-3 my-2 p-3 rounded-xl border border-amber-400/30" style={{ background: "#1A1200" }}>
          <div className="text-xs font-bold text-white mb-1">🔒 Tally Confirm?</div>
          <div className="text-xs text-gray-300 mb-1">2 entries lock hongi. Closing: <strong className="text-blue-400">15,000 देने</strong></div>
          <div className="text-xs text-amber-400 mb-2">⚠️ Lock hone ke baad edit nahi hoga</div>
          <div className="flex gap-2">
            <button className="flex-1 text-xs py-1.5 rounded text-gray-300 border border-white/20">Cancel</button>
            <button className="flex-1 text-xs py-1.5 rounded font-bold text-black" style={{ background: "#F59E0B" }}>Lock Karein</button>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 7, emoji: "📊", title: "Statement Export Karein",
    desc: "Top menu 'Statement' tab mein jaayein. Party select karo, date range choose karo (Aaj/Is Mahine/Sab shortcuts hain). Live preview dikhta hai. PDF ya Excel download karo — ya browser print dialog se print karo.",
    tips: ["Date range filter: 'Aaj', 'Is Mahine', ya 'Sab' quick shortcuts hain","Preview mein entries dikhti hain — download se pehle check karo","PDF mein poketbook logo aata hai","Excel mein Hindi characters perfectly dikhte hain"],
    screen: (
      <div style={{ background: "#0F172A" }} className="flex gap-0">
        {/* Left panel */}
        <div className="w-1/3 p-3 space-y-3 border-r border-white/10">
          <div className="text-xs font-bold text-white">Report Type</div>
          <div className="space-y-1.5">
            <div className="py-2 px-3 rounded border-2 border-blue-500 text-xs text-white font-semibold" style={{ background: "#0A1628" }}>Party Ledger</div>
            <div className="py-2 px-3 rounded border border-white/10 text-xs text-gray-400">Balance Sheet</div>
          </div>
          <div className="text-xs font-bold text-white">Party</div>
          <div className="bg-white/10 border border-white/20 rounded px-2 py-1.5 text-xs text-white">Ramesh Sharma ▼</div>
          <div className="text-xs font-bold text-white">Date Range</div>
          <div className="space-y-1">
            <div className="bg-white/5 border border-white/10 rounded px-2 py-1.5 text-xs text-gray-300">01-04-2026</div>
            <div className="bg-white/5 border border-white/10 rounded px-2 py-1.5 text-xs text-gray-300">24-04-2026</div>
          </div>
          <button className="w-full py-2 rounded text-xs font-bold text-black" style={{ background: "#22C55E" }}>PDF Download</button>
          <button className="w-full py-2 rounded text-xs font-bold text-white border border-white/20">Excel</button>
          <button className="w-full py-2 rounded text-xs font-bold text-white" style={{ background: "#DC2626" }}>🖨️ Print</button>
        </div>
        {/* Preview panel */}
        <div className="flex-1">
          <div className="px-3 py-2 text-xs font-bold text-white flex justify-between" style={{ background: "#78350F" }}>
            <span>Ramesh Sharma</span><span className="text-blue-400 font-mono">15,000 देने</span>
          </div>
          {[["20 Apr","Priya","5,000","","5,000"],["22 Apr","Mohan","8,000","","13,000"],["24 Apr","Sita","2,000","","15,000"]].map((r,i) => (
            <div key={r[0]} className="grid grid-cols-4 text-xs px-2 py-1.5 border-b border-orange-100" style={{ background: i%2===0?"#FFE8CC":"#FFDAB0", color:"#1c1917" }}>
              <div className="font-mono">{r[0]}</div><div className="text-blue-700 truncate">{r[1]}</div>
              <div className="text-right text-red-700">{r[2]}</div>
              <div className="text-right text-blue-700">{r[4]}</div>
            </div>
          ))}
        </div>
      </div>
    )
  },
  {
    id: 8, emoji: "☁️", title: "Google Sheets Backup",
    desc: "Statement page mein 'Google Sheets Backup' section mein 'Connect Google Sheets' click karein. Google account se authorize karo. Ek baar connect hone ke baad 'Backup Now' se instantly sync karein ya auto-schedule set karein.",
    tips: ["Ek baar connect karo — baaki sab automatic","Backup Now = turant sync Google Sheet mein","Sheet mein 2 tabs: Parties + Ledger Entries","Open Sheet button se seedha Google Sheet khulta hai"],
    screen: (
      <div style={{ background: "#111827" }} className="p-4 space-y-3">
        <div className="flex items-center gap-2 px-3 py-3 rounded-xl border border-green-500/30" style={{ background: "#0A1F14" }}>
          <div className="w-8 h-8 rounded flex items-center justify-center text-sm" style={{ background: "#0F9D58" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" fill="#0F9D58"/><rect x="6" y="7" width="12" height="1.5" fill="white" rx="0.5"/><rect x="6" y="10.5" width="12" height="1.5" fill="white" rx="0.5"/><rect x="6" y="14" width="8" height="1.5" fill="white" rx="0.5"/></svg>
          </div>
          <div>
            <div className="text-sm font-bold text-white">Google Sheets Backup</div>
            <div className="text-xs text-gray-400">Connect once, sync forever</div>
          </div>
          <span className="ml-auto text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-semibold">Connected ✓</span>
        </div>
        <div className="text-xs text-gray-400">Last backup: Today, 08:30 pm IST</div>
        <div className="flex gap-2">
          <button className="flex-1 py-2.5 rounded-lg text-xs font-bold text-white flex items-center justify-center gap-1" style={{ background: "#16A34A" }}>
            🔄 Backup Now
          </button>
          <button className="px-3 py-2.5 rounded-lg text-xs font-semibold text-green-400 border border-green-500/50">↗️ Open Sheet</button>
        </div>
        {/* Backup settings card */}
        <div className="rounded-xl border border-white/10 overflow-hidden">
          <div className="px-3 py-2.5 flex items-center gap-2 border-b border-white/10" style={{ background: "#0A1628" }}>
            <span className="text-base">💾</span>
            <div><div className="text-xs font-bold text-white">Auto Email Backup</div><div className="text-xs text-gray-400">Schedule karein</div></div>
            <span className="ml-auto text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">Active ✓</span>
          </div>
          <div className="px-3 py-2 space-y-1">
            <div className="flex items-center justify-between py-1.5 px-2 rounded text-xs" style={{ background: "#1E293B" }}>
              <span className="text-gray-300">user@gmail.com</span>
              <span className="text-blue-400 text-xs">Change</span>
            </div>
            {[["🔕","Never",false],["📆","Weekly",true],["🗓️","Monthly",false]].map(([e,l,a]) => (
              <div key={l} className={`flex items-center gap-2 px-2 py-1.5 rounded text-xs ${a?"border border-green-500/30":""}`}
                style={{ background: a?"#0A2A0F":"transparent" }}>
                <span>{e}</span><span className={a?"text-white font-semibold":"text-gray-400"}>{l}</span>
                {a && <span className="ml-auto text-green-400 text-xs">✓</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
];

const faqs = [
  { q: "Trial free hai ya paid?", a: "7-day FREE trial — completely free. Koi credit card nahi chahiye. Register karo aur instantly full access milta hai." },
  { q: "Naam aur Jama mein kya fark hai?", a: "Naam (Credit) = party ne credit diya → party DENA ho jaati hai (Blue). Jama (Debit) = party ko credit mila → party LENA ho jaati hai (Red). Formula: Balance = Previous + Naam − Jama." },
  { q: "Kya data secure hai?", a: "Haan! Har user ka data completely isolated hai. JWT authentication, bcrypt password hashing. Dusra user aapka data kabhi nahi dekh sakta." },
  { q: "Google Sheets backup kaise kaam karta hai?", a: "Statement page mein 'Connect Google Sheets' click karo, Google account authorize karo. Phir 'Backup Now' se instantly sync ya Daily/Weekly/Monthly auto-schedule set karo." },
  { q: "Keyboard shortcuts kya hain?", a: "Tab = next field navigate, Enter on OK = entry save, F4 = last entry edit. Mouse ki zaroorat nahi padti!" },
  { q: "Phone se login kaise karein?", a: "Login page par 'Phone OTP' tab select karo. Mobile number dalo, OTP aayega, 6-digit verify karo — done!" },
];

const HowToUsePage = () => {
  const [openFaq, setOpenFaq] = useState(null);
  const [activeStep, setActiveStep] = useState(null);

  return (
    <div className="min-h-screen" style={{ background: "#0A0F1E", fontFamily: "'Work Sans', sans-serif", color: "white" }}>
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-white/10" style={{ background: "rgba(10,15,30,0.97)", backdropFilter: "blur(12px)" }}>
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={LOGO} alt="poketbook" className="w-8 h-8 object-contain" />
            <span className="font-black text-lg" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>
              <span className="text-white">Poket</span><span className="text-green-400">Book</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/contact" className="text-sm text-gray-300 hover:text-white hidden sm:block">Contact</Link>
            <Link to="/login" className="bg-green-500 hover:bg-green-400 text-black font-bold text-sm px-4 py-1.5 rounded-lg transition-colors">
              Start FREE
            </Link>
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className="py-14 px-4 text-center" style={{ background: "var(--primary-gradient)" }}>
        <div className="max-w-3xl mx-auto">
          <img src={LOGO} alt="poketbook" className="w-16 h-16 mx-auto mb-4 object-contain" />
          <h1 className="text-3xl sm:text-4xl font-black mb-3" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>
            Kaise Use Karein?
          </h1>
          <p className="text-gray-300 text-base sm:text-lg max-w-xl mx-auto mb-5">
            Step-by-step guide with live app screenshots — har feature explain kiya gaya hai
          </p>
          <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-full px-4 py-1.5 text-sm text-green-400">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            {steps.length} Steps · Live App Mockups · Hindi + English
          </div>
        </div>
      </section>

      {/* Quick Nav */}
      <div className="sticky top-14 z-40 border-b border-white/10 overflow-x-auto" style={{ background: "#0F172A" }}>
        <div className="flex items-center gap-1 px-4 py-2 min-w-max">
          {steps.map((s) => (
            <button key={s.id} onClick={() => { document.getElementById(`step-${s.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" }); setActiveStep(s.id); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors whitespace-nowrap ${activeStep === s.id ? "bg-green-500 text-black" : "text-gray-400 hover:text-white hover:bg-white/10"}`}>
              <span>{s.emoji}</span> {s.id}. {s.title}
            </button>
          ))}
        </div>
      </div>

      {/* Steps */}
      <div className="max-w-6xl mx-auto px-4 py-10 space-y-16">
        {steps.map((s, idx) => (
          <div key={s.id} id={`step-${s.id}`} className="scroll-mt-28">
            {/* Step header */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0 font-black" style={{ background: "#22C55E", color: "#000" }}>
                {s.emoji}
              </div>
              <div>
                <div className="text-xs text-green-400 font-semibold uppercase tracking-wide">Step {s.id} of {steps.length}</div>
                <h2 className="text-xl sm:text-2xl font-black text-white" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>{s.title}</h2>
              </div>
              {idx < steps.length - 1 && (
                <div className="ml-auto hidden sm:flex items-center gap-1 text-xs text-gray-500">
                  Next: {steps[idx + 1].emoji} {steps[idx + 1].title} <ArrowRight size={13} />
                </div>
              )}
            </div>

            {/* Content: description + screenshot side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
              {/* Description */}
              <div>
                <p className="text-gray-300 text-base leading-relaxed mb-5">{s.desc}</p>
                <div className="space-y-2.5">
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">📌 Tips & Notes</div>
                  {s.tips.map((tip, i) => (
                    <div key={`tip-${s.id}-${i}`} className="flex items-start gap-2.5 text-sm text-gray-300">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 text-black mt-0.5" style={{ background: "#22C55E" }}>{i + 1}</div>
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* App Screenshot */}
              <div>
                <div className="text-xs text-gray-500 mb-2 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  Live App Screen
                </div>
                <ScreenShot label={`Step ${s.id}: ${s.title}`}>
                  {s.screen}
                </ScreenShot>
              </div>
            </div>

            {/* Divider */}
            {idx < steps.length - 1 && (
              <div className="mt-10 flex items-center gap-3">
                <div className="flex-1 h-px bg-white/10" />
                <div className="text-xs text-gray-500 flex items-center gap-1.5">
                  Step {s.id + 1}: {steps[idx + 1].emoji} {steps[idx + 1].title}
                  <ArrowRight size={12} />
                </div>
                <div className="flex-1 h-px bg-white/10" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Keyboard Shortcuts */}
      <section className="py-14 px-4" style={{ background: "#0D1117" }}>
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-black mb-8 text-center" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>
            ⌨️ Keyboard Shortcuts
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { key: "Tab", action: "Next field mein jaao (Party → Naam → Jama → Note → OK)" },
              { key: "Enter on OK", action: "Entry save karo + beep sound + mobile vibration" },
              { key: "F4", action: "Most recent unlocked entry ka edit modal kholo" },
              { key: "Ctrl+P", action: "Current page browser print dialog se print karo" },
            ].map(({ key, action }) => (
              <div key={key} className="flex items-center gap-3 rounded-xl p-4 border border-white/10" style={{ background: "#111827" }}>
                <kbd className="text-black px-3 py-1.5 rounded text-sm font-mono font-black flex-shrink-0" style={{ background: "#22C55E" }}>{key}</kbd>
                <span className="text-gray-300 text-sm">{action}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-14 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-black mb-8 text-center" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>
            ❓ FAQ
          </h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={`faq-${i}-${faq.q.slice(0, 15)}`} className="rounded-xl overflow-hidden border border-white/10" style={{ background: "#111827" }}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/5 transition-colors">
                  <span className="font-semibold text-white text-sm sm:text-base pr-4">{faq.q}</span>
                  <ChevronDown size={18} className={`text-gray-400 transition-transform flex-shrink-0 ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4 text-gray-300 text-sm leading-relaxed border-t border-white/10 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 px-4 text-center" style={{ background: "linear-gradient(135deg, #0F2A0F 0%, #0A1628 100%)" }}>
        <h2 className="text-2xl sm:text-3xl font-black mb-3" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>Tayaar Ho? Abhi Shuru Karein!</h2>
        <p className="text-gray-300 mb-6">7-day FREE trial — koi credit card nahi chahiye</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/login" className="bg-green-500 hover:bg-green-400 text-black font-black px-8 py-3.5 rounded-xl text-base transition-colors inline-flex items-center justify-center gap-2">
            <IndianRupee size={18} /> Start FREE Trial
          </Link>
          <Link to="/contact" className="border-2 border-white/20 text-white font-semibold px-8 py-3.5 rounded-xl text-base hover:bg-white/10 transition-colors inline-flex items-center justify-center gap-2">
            <Phone size={16} /> Help Chahiye?
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 text-center border-t border-white/10" style={{ background: "#050A14" }}>
        <div className="flex items-center justify-center gap-2 mb-2">
          <img src={LOGO} alt="poketbook" className="w-6 h-6 object-contain" />
          <span className="font-black text-white">Poket<span className="text-green-400">Book</span></span>
        </div>
        <p className="text-gray-400 text-xs mb-1">
          Made with ❤️ in house of{" "}
          <a href="https://flutterfox.in" rel="dofollow" target="_blank" className="text-blue-400 hover:text-blue-300 underline">Flutter Fox</a>
        </p>
        <p className="text-gray-600 text-xs">© {new Date().getFullYear()} poketbook by Flutter Fox. All Rights Reserved.</p>
      </footer>
    </div>
  );
};

export default HowToUsePage;
