import { createContext, useContext, useState } from "react";

const TRANSLATIONS = {
  en: {
    dashboard: "Dashboard", parties: "Parties", ledger: "Ledger",
    balanceSheet: "Balance Sheet", statement: "Statement", settings: "Settings",
    newEntry: "New Entry", newParty: "New Party", saveEntry: "Save Entry (OK)",
    credit: "Credit (नाम)", debit: "Debit (जमा)", narration: "Narration",
    denaHai: "Dena Hai", lenaHai: "Lena Hai", barabar: "Balanced",
    days: "days remaining", active: "Active", expired: "Expired",
    backup: "Backup", connectSheets: "Connect Google Sheets",
    syncNow: "Sync Now", printPdf: "Print / PDF", excel: "Excel",
    refresh: "Refresh", trialPlan: "Trial Plan",
  },
  hi: {
    dashboard: "मुख्य पृष्ठ", parties: "पार्टियां", ledger: "बही-खाता",
    balanceSheet: "बैलेंस शीट", statement: "विवरण", settings: "सेटिंग",
    newEntry: "नई एंट्री", newParty: "नई पार्टी", saveEntry: "एंट्री सेव (OK)",
    credit: "नाम (Credit)", debit: "जमा (Debit)", narration: "विवरण",
    denaHai: "देना है", lenaHai: "लेना है", barabar: "बराबर",
    days: "दिन बाकी", active: "सक्रिय", expired: "समाप्त",
    backup: "बैकअप", connectSheets: "Google Sheets जोड़ें",
    syncNow: "अभी सिंक करें", printPdf: "प्रिंट / PDF", excel: "एक्सेल",
    refresh: "ताज़ा करें", trialPlan: "ट्रायल प्लान",
  }
};

const LangContext = createContext({ lang: "en", t: TRANSLATIONS.en, setLang: () => {} });

export const LangProvider = ({ children }) => {
  const [lang, setLang] = useState(() => {
    try { return localStorage.getItem("pk_lang") || "en"; } catch { return "en"; }
  });
  const switchLang = (l) => { try { localStorage.setItem("pk_lang", l); } catch (e) { /* storage restricted — language still applied in-memory */ } setLang(l); };
  return (
    <LangContext.Provider value={{ lang, t: TRANSLATIONS[lang] || TRANSLATIONS.en, setLang: switchLang }}>
      {children}
    </LangContext.Provider>
  );
};

export const useLang = () => useContext(LangContext);

// Language Toggle Button component
export const LangToggle = () => {
  const { lang, setLang } = useLang();
  return (
    <button
      onClick={() => setLang(lang === "en" ? "hi" : "en")}
      data-testid="lang-toggle"
      style={{
        background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)",
        borderRadius: "6px", padding: "4px 10px", color: "#fff", fontSize: "12px",
        fontWeight: 700, cursor: "pointer", fontFamily: "monospace", letterSpacing: "0.5px"
      }}
    >
      {lang === "en" ? "अ हिंदी" : "A ENG"}
    </button>
  );
};
