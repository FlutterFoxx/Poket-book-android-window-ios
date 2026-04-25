import { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { api } from "@/contexts/AuthContext";
import { formatBalance, toTitleCase } from "@/utils/helpers";
import { toast } from "sonner";
import {
  FileText, FileSpreadsheet, Download, Calendar, ChevronDown, BookOpen, Printer, ExternalLink, RefreshCw, Loader
} from "lucide-react";
const SheetsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="3" width="18" height="18" rx="2" fill="#0F9D58"/>
    <rect x="6" y="7" width="12" height="1.5" fill="white" rx="0.5"/>
    <rect x="6" y="10.5" width="12" height="1.5" fill="white" rx="0.5"/>
    <rect x="6" y="14" width="8" height="1.5" fill="white" rx="0.5"/>
  </svg>
);

// WhatsApp-style Backup Settings
const BackupSettingsCard = ({ sheetsConnected }) => {
  const [settings, setSettings] = useState({ backup_email: "", backup_frequency: "off", last_backup: null, next_backup: null });
  const [editEmail, setEditEmail] = useState(false);
  const [tempEmail, setTempEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    api.get("/api/backup/settings")
      .then(r => { setSettings(r.data); setTempEmail(r.data.backup_email || ""); setLoaded(true); })
      .catch(() => setLoaded(true)); // Non-critical — backup settings optional
  }, []); // api and state setters are stable — intentional empty deps

  const saveFrequency = async (freq) => {
    setSaving(true);
    const email = settings.backup_email || tempEmail;
    if (!email && freq !== "off") { toast.error("Pehle email address daalo"); setSaving(false); return; }
    try {
      const res = await api.post("/api/backup/settings", { backup_email: email, backup_frequency: freq });
      setSettings(p => ({ ...p, backup_frequency: freq, backup_email: email, next_backup: res.data.next_backup }));
      toast.success(freq === "off" ? "Auto backup band kar diya" : `Auto backup ${freq} set kar diya`);
    } catch (err) { toast.error("Settings save nahi hui"); }
    setSaving(false);
  };

  const saveEmail = async () => {
    if (!tempEmail.includes("@")) { toast.error("Valid email daalo"); return; }
    setSaving(true);
    try {
      await api.post("/api/backup/settings", { backup_email: tempEmail, backup_frequency: settings.backup_frequency });
      setSettings(p => ({ ...p, backup_email: tempEmail }));
      setEditEmail(false);
      toast.success("Backup email save ho gayi");
    } catch (err) { toast.error("Save nahi hua"); }
    setSaving(false);
  };

  const sendNow = async () => {
    if (!settings.backup_email) { toast.error("Pehle email address set karo"); return; }
    setSending(true);
    try {
      const res = await api.post("/api/backup/send-now");
      toast.success(`Backup email bhej di: ${res.data.sent_to}`);
      setSettings(p => ({ ...p, last_backup: new Date().toISOString() }));
    } catch (err) { toast.error(err.response?.data?.detail || "Backup fail ho gaya"); }
    setSending(false);
  };

  const fmtDate = (d) => { try { return new Date(d).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }); } catch { return ""; } };

  const freqOptions = [
    { value: "off", label: "Kabhi Nahi", sub: "Auto backup off", emoji: "🔕" },
    { value: "daily", label: "Daily", sub: "Har roz midnight ko", emoji: "📅" },
    { value: "weekly", label: "Weekly", sub: "Har Sunday ko", emoji: "📆" },
    { value: "monthly", label: "Monthly", sub: "Har mahine 1 tarikh", emoji: "🗓️" },
  ];

  if (!loaded) return <div className="mt-5 p-4 border border-white/10 rounded-xl animate-pulse" style={{ background: "#111827" }}><div className="h-4 bg-white/10 rounded w-32 mb-2"/><div className="h-8 bg-white/5 rounded"/></div>;

  return (
    <div className="mt-5 border border-white/10 rounded-2xl overflow-hidden" style={{ background: "#111827" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10" style={{ background: "#0A1628" }}>
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-base">💾</div>
        <div>
          <div className="text-sm font-bold text-white">Auto Backup to Email</div>
          <div className="text-xs text-gray-400">WhatsApp ki tarah apna data email par bhejein</div>
        </div>
        {settings.backup_frequency !== "off" && (
          <span className="ml-auto text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-semibold">
            Active ✓
          </span>
        )}
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Email Address (WhatsApp style) */}
        <div>
          <div className="text-xs text-gray-400 uppercase tracking-wide mb-2">Backup Email Address</div>
          {!editEmail ? (
            <div className="flex items-center justify-between py-2 px-3 rounded-lg" style={{ background: "#1E293B" }}>
              <div>
                {settings.backup_email ? (
                  <div className="text-sm text-white font-medium">{settings.backup_email}</div>
                ) : (
                  <div className="text-sm text-gray-500 italic">Koi email set nahi hai</div>
                )}
              </div>
              <button onClick={() => { setEditEmail(true); setTempEmail(settings.backup_email || ""); }}
                className="text-xs text-blue-400 hover:text-blue-300 font-semibold px-2 py-1 rounded">
                {settings.backup_email ? "Change" : "Set Email"}
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="email"
                value={tempEmail}
                onChange={e => setTempEmail(e.target.value)}
                placeholder="apna@gmail.com"
                className="flex-1 bg-white/5 border border-blue-500/50 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-400 placeholder-gray-500"
                autoFocus
              />
              <button onClick={saveEmail} disabled={saving}
                className="px-4 py-2.5 bg-green-600 hover:bg-green-500 text-white text-sm font-bold rounded-lg disabled:opacity-50">
                {saving ? "..." : "Save"}
              </button>
              <button onClick={() => setEditEmail(false)} className="px-3 py-2.5 text-gray-400 hover:text-white text-sm">Cancel</button>
            </div>
          )}
        </div>

        {/* Frequency Selector (WhatsApp style) */}
        <div>
          <div className="text-xs text-gray-400 uppercase tracking-wide mb-2">Backup Frequency</div>
          <div className="space-y-1">
            {freqOptions.map(opt => (
              <button key={opt.value} onClick={() => saveFrequency(opt.value)} disabled={saving}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                  settings.backup_frequency === opt.value
                    ? "border border-green-500/50 text-white"
                    : "border border-transparent text-gray-300 hover:bg-white/5"
                }`}
                style={{ background: settings.backup_frequency === opt.value ? "#0A2A0F" : "transparent" }}>
                <span className="text-xl">{opt.emoji}</span>
                <div className="flex-1">
                  <div className="text-sm font-semibold">{opt.label}</div>
                  <div className="text-xs text-gray-500">{opt.sub}</div>
                </div>
                {settings.backup_frequency === opt.value && (
                  <span className="text-green-400 text-lg">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Last Backup Info */}
        {settings.last_backup && (
          <div className="text-xs text-gray-500 text-center">
            Last backup: {fmtDate(settings.last_backup)}
          </div>
        )}
        {settings.next_backup && settings.backup_frequency !== "off" && (
          <div className="text-xs text-blue-400 text-center">
            Next backup: {fmtDate(settings.next_backup)}
          </div>
        )}

        {/* Backup Now button */}
        <button onClick={sendNow} disabled={sending || !sheetsConnected || !settings.backup_email}
          className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-40"
          style={{ background: sending ? "#1A3A1A" : "#16A34A", color: "white" }}>
          {sending ? <><Loader size={16} className="animate-spin" /> Sending...</> : <>📧 Backup Now (Send Email)</>}
        </button>

        {!sheetsConnected && (
          <p className="text-xs text-amber-400 text-center">⚠️ Google account connect karein email backup ke liye</p>
        )}
      </div>
    </div>
  );
};
const today = () => new Date().toISOString().split("T")[0];
const firstOfMonth = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split("T")[0];
};

// Google Sheets Section Component
const GoogleSheetsSection = () => {
  const location = useLocation();
  const [status, setStatus] = useState(null);
  const [backing, setBacking] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const fetchStatus = useCallback(async () => {
    try { const r = await api.get("/api/export/sheets-status"); setStatus(r.data); }
    catch (_err) { /* Non-critical — Sheets status is optional */ }
  }, []); // api and setStatus are stable — intentional empty deps

  useEffect(() => {
    fetchStatus();
    // Check if just connected via OAuth callback
    const params = new URLSearchParams(location.search);
    if (params.get("sheets") === "connected") {
      toast.success("Google Sheets connected successfully!");
      fetchStatus();
    }
  }, [fetchStatus, location.search]);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const res = await api.get("/api/oauth/sheets/connect");
      if (res.data.configured && res.data.url) {
        window.location.href = res.data.url;
      } else {
        toast.error(res.data.error || "Connection failed");
      }
    } catch (err) {
      toast.error("Failed to get OAuth URL");
    }
    setConnecting(false);
  };

  const handleBackup = async () => {
    setBacking(true);
    try {
      const res = await api.post("/api/export/google-sheets-backup");
      toast.success(`Backup complete! ${res.data.parties_count} parties, ${res.data.entries_count} entries synced.`);
      fetchStatus();
      if (res.data.sheet_url) {
        toast.success("Opening your Google Sheet...", { duration: 3000 });
        setTimeout(() => window.open(res.data.sheet_url, "_blank"), 1500);
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || "Backup failed");
    }
    setBacking(false);
  };

  return (
    <div className="mt-5 p-4 border-2 border-green-500/30 rounded-xl" style={{ background: "#0A1F14" }}>
      <div className="flex items-center gap-2 mb-3">
        <SheetsIcon />
        <span className="font-bold text-white text-sm">Google Sheets Backup</span>
        {status?.connected && (
          <span className="ml-auto text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-semibold">Connected ✓</span>
        )}
      </div>

      {!status?.connected ? (
        <div>
          <p className="text-xs text-gray-400 mb-3">Apna data automatically Google Sheets mein backup karein. Ek click mein sab parties aur entries sync hoti hain.</p>
          <button onClick={handleConnect} disabled={connecting}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-green-600 hover:bg-green-500 text-white text-sm font-bold rounded-lg disabled:opacity-50 transition-colors">
            {connecting ? <Loader size={16} className="animate-spin" /> : <SheetsIcon />}
            {connecting ? "Connecting..." : "Connect Google Sheets"}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {status.last_backup && (
            <p className="text-xs text-gray-400">Last backup: {new Date(status.last_backup).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</p>
          )}
          <div className="flex gap-2">
            <button onClick={handleBackup} disabled={backing}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-600 hover:bg-green-500 text-white text-sm font-bold rounded-lg disabled:opacity-50 transition-colors">
              {backing ? <Loader size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              {backing ? "Syncing..." : "Backup Now"}
            </button>
            {status.sheet_url && (
              <a href={status.sheet_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 px-4 py-2.5 border border-green-500/50 text-green-400 text-xs font-semibold rounded-lg hover:bg-green-500/10 transition-colors">
                <ExternalLink size={13} /> Open Sheet
              </a>
            )}
          </div>
          <button onClick={handleConnect} className="w-full text-xs text-gray-500 hover:text-gray-300 transition-colors">
            Reconnect / Change account
          </button>
        </div>
      )}
    </div>
  );
};

const StatementPage = () => {
  const navigate = useNavigate();
  const [parties, setParties] = useState([]);
  const [selectedParty, setSelectedParty] = useState("");
  const [exportType, setExportType] = useState("ledger");
  const [dateFrom, setDateFrom] = useState(firstOfMonth());
  const [dateTo, setDateTo] = useState(today());
  const [downloading, setDownloading] = useState(null); // 'pdf' | 'excel' | null
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const BASE = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    api.get("/api/parties")
      .then((r) => setParties(r.data))
      .catch((_err) => { /* Non-critical — party list degrades to empty */ });
  }, []); // api and setParties are stable — intentional empty deps

  const loadPreview = useCallback(async () => {
    if (!selectedParty) return;
    setPreviewLoading(true);
    try {
      const res = await api.get(`/api/ledger/${selectedParty}/entries`);
      const all = res.data.entries;
      const filtered = all.filter((e) => {
        if (dateFrom && e.date < dateFrom) return false;
        if (dateTo && e.date > dateTo) return false;
        return true;
      });
      setPreview({
        party: res.data.party,
        entries: filtered,
        current_balance: filtered.length ? filtered[filtered.length - 1].balance : 0,
      });
    } catch (err) {
      if (process.env.NODE_ENV === 'development') { console.error("Failed to load preview:", err); }
    }
    setPreviewLoading(false);
  }, [selectedParty, dateFrom, dateTo]);

  // Auto-preview when party/date changes
  useEffect(() => {
    if (exportType === "ledger" && selectedParty) loadPreview();
    else setPreview(null);
  }, [selectedParty, dateFrom, dateTo, exportType, loadPreview]);

  const buildParams = () => {
    const params = new URLSearchParams();
    if (dateFrom) params.set("start_date", dateFrom);
    if (dateTo) params.set("end_date", dateTo);
    return params.toString();
  };

  const downloadFile = async (url, filename, type) => {
    setDownloading(type);
    try {
      const res = await api.get(url, { responseType: "blob" });
      const blobUrl = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
      toast.success("Statement download ho rahi hai");
    } catch {
      toast.error("Download nahi hua — please retry");
    }
    setDownloading(null);
  };

  const handleExport = (format) => {
    const params = buildParams();
    const ext = format === "pdf" ? "pdf" : "excel";
    const fileExt = format === "pdf" ? "pdf" : "xlsx";
    if (exportType === "ledger") {
      if (!selectedParty) { toast.error("Party select karein"); return; }
      const name = parties.find((p) => p.id === selectedParty)?.name || "ledger";
      const q = params ? `?${params}` : "";
      downloadFile(
        `/api/export/ledger/${selectedParty}/${ext}${q}`,
        `Statement_${name}_${dateFrom}_${dateTo}.${fileExt}`,
        format
      );
    } else {
      const q = params ? `?${params}` : "";
      downloadFile(
        `/api/export/balance-sheet/${ext}${q}`,
        `BalanceSheet_${dateTo}.${fileExt}`,
        format
      );
    }
  };

  const fmt = (n) =>
    new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(n || 0));

  const balLabel = (amount) => {
    if (!amount) return { text: "0.00 Barabar", cls: "text-stone-400 italic" };
    const abs = fmt(amount);
    // positive = DENA (BLUE), negative = LENA (RED)
    return amount > 0
      ? { text: `${abs} देने`, cls: "text-blue-800 font-bold" }
      : { text: `${abs} लेने`, cls: "text-red-700 font-bold" };
  };

  // Print the current preview
  const handlePrintPreview = () => {
    if (!preview) { toast.error("Preview load karein pehle"); return; }
    const rows = preview.entries.map((e, i) => {
      const bl = balLabel(e.balance);
      return `<tr style="background:${i%2===0?"#FFE8CC":"#FFDAB0"}">
        <td>${e.date}</td>
        <td style="color:#1e40af;font-weight:600">${toTitleCase(e.counterparty_name || "—")}</td>
        <td style="text-align:right;color:#991b1b;font-weight:700">${e.naam > 0 ? fmt(e.naam) : ""}</td>
        <td style="text-align:right;color:#14532d;font-weight:700">${e.jama > 0 ? fmt(e.jama) : ""}</td>
        <td>${e.narration || ""}</td>
        <td style="text-align:right;font-weight:700;color:${e.balance>0?"#b91c1c":"#1e40af"}">${bl.text}</td>
      </tr>`;
    }).join("");
    const html = `<!DOCTYPE html><html><head><title>Statement - ${toTitleCase(preview.party?.name || "")}</title>
<meta charset="utf-8">
<style>
  body{font-family:Arial,sans-serif;font-size:12px;padding:16px;}
  .hdr{background:#b91c1c;color:white;padding:10px 14px;border-radius:4px;margin-bottom:10px;}
  .hdr h1{font-size:16px;font-weight:bold;} .hdr p{font-size:11px;margin-top:3px;}
  table{width:100%;border-collapse:collapse;margin-top:8px;}
  th{background:#8B4513;color:white;padding:6px 8px;text-align:left;font-size:11px;}
  td{padding:5px 8px;border-bottom:1px solid #f0d9b5;font-size:11px;}
  @page{margin:1.5cm;size:A4 landscape;}@media print{button{display:none!important;}}
</style></head><body>
<div class="hdr">
  <h1>Statement — ${toTitleCase(preview.party?.name || "")}</h1>
  <p>Period: ${dateFrom || "All"} to ${dateTo || "Today"} | Total Entries: ${preview.entries.length}</p>
</div>
<table><thead><tr>
  <th>Date</th><th>Party Name</th><th style="text-align:right">Credit (नाम)</th>
  <th style="text-align:right">Debit (जमा)</th><th>Narration</th><th style="text-align:right">Balance</th>
</tr></thead><tbody>${rows}</tbody>
<tfoot><tr style="background:#8B4513;color:white;font-weight:bold;">
  <td colspan="2">Total</td>
  <td style="text-align:right">${fmt(preview.entries.reduce((s,e)=>s+(e.naam||0),0))}</td>
  <td style="text-align:right">${fmt(preview.entries.reduce((s,e)=>s+(e.jama||0),0))}</td>
  <td></td>
  <td style="text-align:right">${balLabel(preview.current_balance).text}</td>
</tr></tfoot></table>
</body></html>`;
    const blob = new Blob([html], { type: "text/html; charset=utf-8" });
    const blobUrl = URL.createObjectURL(blob);
    const w = window.open(blobUrl, "_blank", "width=900,height=600");
    if (w) {
      w.addEventListener("load", () => { setTimeout(() => { w.print(); URL.revokeObjectURL(blobUrl); }, 500); });
    }
  };

  return (
    <div className="flex flex-col h-full" style={{ fontFamily: "'Work Sans', sans-serif", background: "#FDFBF7" }}>
      {/* Header Bar */}
      <div className="flex-shrink-0 text-white px-5 py-2 flex items-center gap-5" style={{ background: "#0F172A" }}>
        <h1 className="text-xl font-bold tracking-wide" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>
          Statement / Account Report
        </h1>
        <div className="ml-auto text-sm text-red-200">
          PDF ya Excel mein party statement download karein
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Left Panel: Controls ─────────────────────────────────── */}
        <div className="w-80 flex-shrink-0 bg-white border-r border-stone-200 overflow-y-auto p-5 space-y-5">

          {/* Report Type */}
          <div>
            <label className="block text-xs font-bold text-stone-600 uppercase tracking-wide mb-2">Report Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setExportType("ledger")}
                className={`flex flex-col items-center gap-1.5 p-3 border-2 rounded text-sm font-semibold transition-colors ${exportType === "ledger" ? "border-red-700 bg-red-50 text-red-800" : "border-stone-200 text-stone-500 hover:bg-stone-50"}`}
                data-testid="export-type-ledger"
              >
                <FileText size={22} />
                Party Ledger
              </button>
              <button
                onClick={() => setExportType("balance-sheet")}
                className={`flex flex-col items-center gap-1.5 p-3 border-2 rounded text-sm font-semibold transition-colors ${exportType === "balance-sheet" ? "border-red-700 bg-red-50 text-red-800" : "border-stone-200 text-stone-500 hover:bg-stone-50"}`}
                data-testid="export-type-bs"
              >
                <FileSpreadsheet size={22} />
                Balance Sheet
              </button>
            </div>
          </div>

          {/* Party (for ledger) */}
          {exportType === "ledger" && (
            <div>
              <label className="block text-xs font-bold text-stone-600 uppercase tracking-wide mb-2">Party *</label>
              <div className="relative">
                <select
                  value={selectedParty}
                  onChange={(e) => setSelectedParty(e.target.value)}
                  className="w-full appearance-none border-2 border-stone-400 bg-white px-3 py-2.5 text-base font-semibold focus:outline-none focus:ring-2 focus:ring-stone-700 pr-8"
                  data-testid="export-party-selector"
                >
                  <option value="">-- Party chunein --</option>
                  {parties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-500 pointer-events-none" />
              </div>
            </div>
          )}

          {/* Date Range */}
          <div>
            <label className="block text-xs font-bold text-stone-600 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <Calendar size={13} /> Date Range / Tarikh
            </label>
            <div className="space-y-2">
              <div>
                <label className="text-xs text-stone-500 mb-0.5 block">From / Se</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full border-2 border-stone-400 px-3 py-2 text-base font-mono focus:outline-none focus:ring-2 focus:ring-stone-700 bg-white"
                  data-testid="export-date-from"
                />
              </div>
              <div>
                <label className="text-xs text-stone-500 mb-0.5 block">To / Tak</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full border-2 border-stone-400 px-3 py-2 text-base font-mono focus:outline-none focus:ring-2 focus:ring-stone-700 bg-white"
                  data-testid="export-date-to"
                />
              </div>
            </div>
            {/* Quick date shortcuts */}
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {[
                { label: "Aaj", from: today(), to: today() },
                { label: "Is Mahine", from: firstOfMonth(), to: today() },
                { label: "Sab", from: "", to: "" },
              ].map((s) => (
                <button
                  key={s.label}
                  onClick={() => { setDateFrom(s.from); setDateTo(s.to); }}
                  className="text-xs px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded transition-colors"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Download Buttons */}
          <div className="space-y-2 pt-2">
            <button
              onClick={() => handleExport("pdf")}
              disabled={!!downloading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-stone-900 text-white text-base font-bold hover:bg-stone-800 disabled:opacity-50 transition-colors rounded"
              data-testid="download-pdf-btn"
            >
              <Download size={18} />
              {downloading === "pdf" ? "Downloading..." : "PDF Download"}
            </button>
            <button
              onClick={() => handleExport("excel")}
              disabled={!!downloading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-700 text-white text-base font-bold hover:bg-green-800 disabled:opacity-50 transition-colors rounded"
              data-testid="download-excel-btn"
            >
              <Download size={18} />
              {downloading === "excel" ? "Downloading..." : "Excel Download"}
            </button>
            {/* Print preview button */}
            {exportType === "ledger" && preview && (
              <button
                onClick={handlePrintPreview}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-700 text-white text-base font-bold hover:bg-red-800 transition-colors rounded"
                data-testid="print-preview-btn"
              >
                <Printer size={18} /> Print Statement
              </button>
            )}
          </div>

          {/* Google Sheets Backup */}
          <GoogleSheetsSection />

          {/* WhatsApp-style Email Backup Settings */}
          <BackupSettingsCard sheetsConnected={true} />

          {/* Info */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700 space-y-1">
            <p className="font-semibold">Note:</p>
            <p>• Credit (नाम/लेना) = Receivable entries</p>
            <p>• Debit (जमा/देना) = Payable entries</p>
            <p>• Positive balance = लेने (Lena Hai)</p>
            <p>• Negative balance = देने (Dena Hai)</p>
          </div>
        </div>

        {/* ── Right Panel: Live Preview ────────────────────────────── */}
        <div className="flex-1 overflow-auto" style={{ background: "#FFF5E6" }}>
          {exportType === "balance-sheet" ? (
            <div className="p-8 text-center text-stone-500">
              <FileSpreadsheet size={48} className="mx-auto mb-4 text-stone-300" />
              <p className="text-lg font-semibold mb-2">Balance Sheet Download</p>
              <p className="text-sm">Date range {dateFrom || "start"} to {dateTo || "today"}</p>
              <p className="text-sm text-stone-400 mt-1">Left = PDF ya Excel download karein</p>
            </div>
          ) : !selectedParty ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <BookOpen size={48} className="mx-auto mb-4 text-stone-200" />
                <p className="text-lg font-semibold text-stone-400">Party select karein preview ke liye</p>
              </div>
            </div>
          ) : previewLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-8 h-8 border-4 border-stone-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : preview ? (
            <div>
              {/* Preview Header */}
              <div className="bg-red-700 text-white px-5 py-2 flex items-center gap-4 sticky top-0 z-10">
                <span className="font-bold text-lg">{toTitleCase(preview.party?.name)}</span>
                <span className="text-red-300">|</span>
                <span>{preview.party?.mobile}</span>
                <span className="text-red-300">|</span>
                <span className="text-sm">{dateFrom || "All"} to {dateTo || "Today"}</span>
                <div className="ml-auto">
                  <span className={`text-lg font-mono font-bold ${balLabel(preview.current_balance).cls}`}>
                    {balLabel(preview.current_balance).text}
                  </span>
                </div>
              </div>

              {/* Preview Table */}
              <table className="w-full border-collapse" data-testid="statement-preview-table">
                <thead>
                  <tr style={{ background: "#8B4513" }} className="text-white sticky top-10 z-10">
                    <th className="px-4 py-2.5 text-left text-xs font-bold uppercase border-r border-amber-900 w-28">Date</th>
                    <th className="px-4 py-2.5 text-left text-xs font-bold uppercase border-r border-amber-900 w-32">Party Name</th>
                    <th className="px-4 py-2.5 text-right text-xs font-bold uppercase border-r border-amber-900 w-28">
                      Credit<br /><span className="text-yellow-300 text-xs font-normal">(नाम/लेना)</span>
                    </th>
                    <th className="px-4 py-2.5 text-right text-xs font-bold uppercase border-r border-amber-900 w-28">
                      Debit<br /><span className="text-yellow-300 text-xs font-normal">(जमा/देना)</span>
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-bold uppercase border-r border-amber-900">Narration</th>
                    <th className="px-4 py-2.5 text-right text-xs font-bold uppercase w-36">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.entries.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-16 text-stone-500 text-base" style={{ background: "#FFE0C0" }}>
                        Is date range mein koi entry nahi hai
                      </td>
                    </tr>
                  ) : (
                    preview.entries.map((e, i) => {
                      const bl = balLabel(e.balance);
                      return (
                        <tr key={e.id} style={{ background: i % 2 === 0 ? "#FFE8CC" : "#FFDAB0" }} className="border-b border-amber-200">
                          <td className="px-4 py-2.5 text-sm font-mono text-stone-800 border-r border-amber-200">{e.date}</td>
                          <td className="px-4 py-2.5 text-sm text-blue-800 font-semibold border-r border-amber-200">{toTitleCase(e.counterparty_name || "—")}</td>
                          <td className="px-4 py-2.5 text-right text-sm font-mono font-bold text-red-800 border-r border-amber-200">
                            {e.naam > 0 ? fmt(e.naam) : ""}
                          </td>
                          <td className="px-4 py-2.5 text-right text-sm font-mono font-bold text-green-900 border-r border-amber-200">
                            {e.jama > 0 ? fmt(e.jama) : ""}
                          </td>
                          <td className="px-4 py-2.5 text-sm text-stone-600 border-r border-amber-200 max-w-[180px] truncate">{e.narration || "—"}</td>
                          <td className="px-4 py-2.5 text-right">
                            <span className={`text-sm font-mono font-bold ${bl.cls}`}>{bl.text}</span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                {preview.entries.length > 0 && (
                  <tfoot>
                    <tr style={{ background: "#D2691E" }} className="text-white">
                      <td colSpan={2} className="px-4 py-2.5 text-sm font-bold">
                        {preview.entries.length} entries | {dateFrom || "all"} to {dateTo || "today"}
                      </td>
                      <td className="px-4 py-2.5 text-right text-sm font-mono font-bold text-yellow-200">
                        {fmt(preview.entries.reduce((s, e) => s + (e.naam || 0), 0))}
                      </td>
                      <td className="px-4 py-2.5 text-right text-sm font-mono font-bold text-yellow-200">
                        {fmt(preview.entries.reduce((s, e) => s + (e.jama || 0), 0))}
                      </td>
                      <td />
                      <td className="px-4 py-2.5 text-right">
                        <span className={`text-base font-mono font-bold ${balLabel(preview.current_balance).cls}`}>
                          {balLabel(preview.current_balance).text}
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default StatementPage;
