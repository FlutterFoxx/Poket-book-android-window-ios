import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "@/contexts/AuthContext";
import { formatBalance, formatDate, formatTime, today, toTitleCase } from "@/utils/helpers";
import { toast } from "sonner";
import { Lock, Printer, Pencil, Trash2, X, ChevronDown, ChevronUp, BookOpen, MessageCircle } from "lucide-react";

const EMPTY_FAST = { date: today(), partyId: "", naam: "", jama: "", narration: "" };

// Header balance labels (operator's perspective):
// positive → "लेने" RED  (we receive from party)
// negative → "देने" BLUE (we pay to party)
const balLabel = (amount) => {
  // NAAM (credit) = DENA → positive → BLUE; JAMA (debit) = LENA → negative → RED
  if (!amount) return { text: "0.00  बराबर", color: "text-stone-500" };
  const abs = Math.abs(amount).toLocaleString("en-IN", { minimumFractionDigits: 2 });
  if (amount > 0) return { text: `${abs}  देने`, color: "text-blue-800" };  // positive = DENA = BLUE
  return { text: `${abs}  लेने`, color: "text-red-700" };                   // negative = LENA = RED
};

// Table balance column — colored number only
const balColor = (amount) => {
  if (!amount) return "text-stone-400";
  return amount > 0 ? "text-blue-800" : "text-red-700"; // positive=DENA(blue), negative=LENA(red)
};

const LedgerPage = () => {
  const { partyId: urlPartyId } = useParams();
  const navigate = useNavigate();
  const [parties, setParties] = useState([]);
  const [selectedId, setSelectedId] = useState(urlPartyId || "");
  const [partyInfo, setPartyInfo] = useState(null);
  const [entries, setEntries] = useState([]);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showFullAccount, setShowFullAccount] = useState(true);
  const [showHeader, setShowHeader] = useState(true); // mobile: hide/show upper bars
  const [fastEntry, setFastEntry] = useState(EMPTY_FAST);
  const [saving, setSaving] = useState(false);
  const [editEntry, setEditEntry] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [deleteEntry, setDeleteEntry] = useState(null);
  const [tallyConfirm, setTallyConfirm] = useState(false);
  const [selectedEntries, setSelectedEntries] = useState(new Set());
  const [liveTime, setLiveTime] = useState(new Date()); // live clock
  const [isEntryOpen, setIsEntryOpen] = useState(true);
  const savingLockRef = useRef(false);

  const naamRef = useRef(null);
  const jamaRef = useRef(null);
  const narrationRef = useRef(null);
  const saveRef = useRef(null);
  const partySelectRef = useRef(null);
  const tableContainerRef = useRef(null);
  const sentinelRef = useRef(null); // virtual scroll sentinel

  // Virtual scroll: show entries in pages of 80, load more on scroll
  const [visibleCount, setVisibleCount] = useState(80);
  const visibleEntries = useMemo(() => entries.slice(0, visibleCount), [entries, visibleCount]);

  // IntersectionObserver: load more when sentinel enters viewport
  useEffect(() => {
    if (!sentinelRef.current) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && visibleCount < entries.length) {
        setVisibleCount(c => Math.min(c + 60, entries.length));
      }
    }, { rootMargin: "200px" });
    obs.observe(sentinelRef.current);
    return () => obs.disconnect();
  }, [entries.length, visibleCount]);

  // Sound + vibration on successful entry save (silent fail intentional — Audio API may be unavailable)
  const playSaveSound = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.15);
      }
    } catch (_audioErr) {
      // Web Audio API not supported in this environment — intentional silent fail
    }
    if ("vibrate" in navigator) navigator.vibrate([40]);
  }, []);

  const toggleEntry = (id) => setSelectedEntries(prev => {
    const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next;
  });
  const toggleAll = () => {
    const ids = entries.filter(e => !e.is_locked).map(e => e.id);
    const allSel = ids.every(id => selectedEntries.has(id));
    setSelectedEntries(allSel ? new Set() : new Set(ids));
  };

  const fetchParties = useCallback(async () => {
    try {
      const res = await api.get("/api/parties");
      setParties(res.data);
    } catch (err) {
      // Non-blocking — party list can be empty, user will see empty dropdown
      if (err.response?.status !== 401) toast.error("Parties load nahi hui");
    }
  }, []);

  const fetchEntries = useCallback(async (pid) => {
    if (!pid) return;
    setLoading(true);
    try {
      const res = await api.get(`/api/ledger/${pid}/entries`);
      setEntries(res.data.entries);
      setCurrentBalance(res.data.current_balance);
      setPartyInfo(res.data.party);
      setSelectedEntries(new Set());
    } catch (err) { toast.error(err.response?.data?.detail || "Entries load nahi hui"); }
    setLoading(false);
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchParties(); }, []);
  useEffect(() => { if (urlPartyId) setSelectedId(urlPartyId); }, [urlPartyId]);
  useEffect(() => { if (selectedId) { fetchEntries(selectedId); setVisibleCount(80); } }, [selectedId, fetchEntries]);
  useEffect(() => { setFastEntry(p => ({ ...p, partyId: "" })); }, [selectedId]);

  // F4 = edit most recent unlocked entry
  useEffect(() => {
    const handleF4 = (e) => {
      if (e.key === "F4") {
        e.preventDefault();
        const firstUnlocked = entries.find(en => !en.is_locked);
        if (firstUnlocked) {
          setEditEntry(firstUnlocked);
          setEditForm({ date: firstUnlocked.date, naam: firstUnlocked.naam || "", jama: firstUnlocked.jama || "", narration: firstUnlocked.narration || "" });
        } else { toast.error("Koi unlocked entry nahi hai edit karne ke liye"); }
      }
    };
    window.addEventListener("keydown", handleF4);
    return () => window.removeEventListener("keydown", handleF4);
  }, [entries]);

  // Auto-scroll table to BOTTOM when entries update (newest entry visible near entry form)
  useEffect(() => {
    if (tableContainerRef.current && entries.length > 0) {
      requestAnimationFrame(() => {
        if (tableContainerRef.current) {
          tableContainerRef.current.scrollTop = tableContainerRef.current.scrollHeight;
        }
      });
    }
  }, [entries]);
  useEffect(() => {
    const tick = setInterval(() => {
      const now = new Date();
      setLiveTime(now);
      const todayStr = now.toISOString().split("T")[0];
      setFastEntry(prev => {
        // Only auto-update if the stored date was today's previous day (not a manually picked past date)
        const yesterday = new Date(now - 86400000).toISOString().split("T")[0];
        if (prev.date === yesterday) {
          return { ...prev, date: todayStr };
        }
        return prev;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  const handlePartyChange = (pid) => {
    setSelectedId(pid);
    navigate(pid ? `/ledger/${pid}` : "/ledger", { replace: true });
  };

  const handleFastPartyChange = (pid) => setFastEntry(p => ({ ...p, partyId: pid }));

  const handleSave = async () => {
    if (savingLockRef.current) return; // prevent double-submit
    const targetParty = fastEntry.partyId;
    if (!targetParty) { toast.error("Neeche se party select karein", { duration: 1500 }); return; }
    if (!fastEntry.naam && !fastEntry.jama) { toast.error("नाम या जमा amount likhein", { duration: 1500 }); return; }
    savingLockRef.current = true;
    setSaving(true);
    try {
      await api.post(`/api/ledger/${selectedId}/entries`, {
        date: fastEntry.date,
        naam: parseFloat(fastEntry.naam) || 0,
        jama: parseFloat(fastEntry.jama) || 0,
        narration: fastEntry.narration,
        counterparty_id: targetParty,
      });
      toast.success("Entry save ho gayi", { duration: 1500 });
      playSaveSound();
      setFastEntry({ ...EMPTY_FAST, partyId: "", date: today() });
      fetchEntries(selectedId);
      setTimeout(() => naamRef.current?.focus(), 100);
    } catch (err) { toast.error(err.response?.data?.detail || "Entry save nahi hui", { duration: 1500 }); }
    setSaving(false);
    savingLockRef.current = false;
  };

  // Enter = navigate to next field (Tab-like). Only pressing Enter on OK button posts.
  const handleFastKeyDown = (e, nextRef) => {
    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      if (nextRef?.current) nextRef.current.focus();
    }
  };

  // AI natural language entry parser
  const [sharingPdf, setSharingPdf] = useState(false);
  const handleWhatsAppShare = async () => {
    if (!partyInfo || !selectedId || sharingPdf) return;
    setSharingPdf(true);
    const toastId = toast.loading("Generating PDF...");
    try {
      const BACKEND = process.env.REACT_APP_BACKEND_URL || "";
      const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token") || "";

      // Retry up to 3 times with 2s delay between attempts
      let pdfBlob = null;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const resp = await fetch(`${BACKEND}/api/export/ledger/${selectedId}/pdf`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
          pdfBlob = await resp.blob();
          if (pdfBlob.size < 100) throw new Error("PDF too small, likely empty");
          break; // Success
        } catch (fetchErr) {
          if (attempt === 3) throw fetchErr;
          toast.loading(`PDF failed, retrying (${attempt}/3)...`, { id: toastId });
          await new Promise(r => setTimeout(r, 2000));
        }
      }

      const fileName = `PoketBook_${toTitleCase(partyInfo.name)}_Statement.pdf`;
      toast.dismiss(toastId);

      // Try native share sheet (Android/iOS — user picks WhatsApp directly)
      const pdfFile = new File([pdfBlob], fileName, { type: "application/pdf" });
      if (navigator.share && navigator.canShare?.({ files: [pdfFile] })) {
        await navigator.share({ title: fileName, files: [pdfFile] });
      } else {
        // Desktop fallback: download + open WhatsApp
        const url = URL.createObjectURL(pdfBlob);
        const a = document.createElement("a");
        a.href = url; a.download = fileName;
        document.body.appendChild(a); a.click();
        document.body.removeChild(a); URL.revokeObjectURL(url);
        const bal = balLabel(currentBalance);
        const msg = `*PoketBook Statement — ${toTitleCase(partyInfo.name)}*\nBalance: *${bal.text}*\nEntries: ${entries.length}\n\n_poketbook.in_`;
        window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
      }
    } catch (err) {
      toast.dismiss(toastId);
      if (err?.name !== "AbortError") toast.error(`PDF failed: ${err.message || "try again"}`, { duration: 3000 });
    }
    setSharingPdf(false);
  };

  const handleEditSave = async () => {
    setSaving(true);
    try {
      await api.put(`/api/ledger/${selectedId}/entries/${editEntry.id}`, {
        date: editForm.date, naam: parseFloat(editForm.naam) || 0,
        jama: parseFloat(editForm.jama) || 0, narration: editForm.narration,
      });
      toast.success("Entry update ho gayi");
      setEditEntry(null);
      fetchEntries(selectedId);
    } catch (err) { toast.error(err.response?.data?.detail || "Update nahi hua"); }
    setSaving(false);
  };

  const handleDeleteEntry = async () => {
    try {
      await api.delete(`/api/ledger/${selectedId}/entries/${deleteEntry.id}`);
      toast.success("Entry delete ho gayi");
      setDeleteEntry(null);
      fetchEntries(selectedId);
    } catch (err) { toast.error(err.response?.data?.detail || "Delete nahi hua"); }
  };

  const handleTally = async () => {
    try {
      const res = await api.post(`/api/ledger/${selectedId}/tally`);
      toast.success(`${res.data.locked_count} entries lock ho gayi`);
      setTallyConfirm(false);
      fetchEntries(selectedId);
    } catch (err) { toast.error(err.response?.data?.detail || "Lock nahi hua"); }
  };

  // Direct browser print — uses Blob URL (avoids XSS from document.write)
  const handlePrint = () => {
    if (!partyInfo) return;
    const balText = balInfo.text;
    const rows = entries.map((e, i) => {
      const bal = e.balance;
      const balStr = bal > 0
        ? `${Math.abs(bal).toLocaleString("en-IN", { minimumFractionDigits: 2 })} लेने`
        : bal < 0
        ? `${Math.abs(bal).toLocaleString("en-IN", { minimumFractionDigits: 2 })} देने`
        : "0.00 बराबर";
      return `<tr style="background:${i % 2 === 0 ? "#FFE8CC" : "#FFDAB0"}">
        <td>${i + 1}</td>
        <td>${e.date}</td>
        <td style="color:#1e40af;font-weight:600">${e.counterparty_name || "—"}</td>
        <td style="text-align:right;color:#991b1b;font-weight:700">${e.naam > 0 ? e.naam.toLocaleString("en-IN", { minimumFractionDigits: 2 }) : ""}</td>
        <td style="text-align:right;color:#14532d;font-weight:700">${e.jama > 0 ? e.jama.toLocaleString("en-IN", { minimumFractionDigits: 2 }) : ""}</td>
        <td>${e.narration || ""}</td>
        <td style="text-align:right;font-weight:700;color:${bal >= 0 ? "#1e40af" : "#991b1b"}">${balStr}</td>
        <td style="text-align:center">${e.is_locked ? "★" : ""}</td>
      </tr>`;
    }).join("");
    const totalNaam = entries.reduce((s, e) => s + (e.naam || 0), 0);
    const totalJama = entries.reduce((s, e) => s + (e.jama || 0), 0);
    const html = `<!DOCTYPE html><html><head><title>Ledger - ${partyInfo.name}</title>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 12px; padding: 16px; color: #1c1917; }
  .header { background: #b91c1c; color: white; padding: 10px 14px; border-radius: 4px; margin-bottom: 10px; }
  .header h1 { font-size: 16px; font-weight: bold; }
  .header p { font-size: 11px; opacity: 0.9; margin-top: 3px; }
  .balance-badge { display:inline-block; background:#166534; color:white; padding:3px 8px; border-radius:4px; font-weight:bold; font-size:13px; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  th { background: #8B4513; color: white; padding: 6px 8px; text-align: left; font-size: 11px; }
  th.right { text-align: right; }
  td { padding: 5px 8px; border-bottom: 1px solid #f0d9b5; font-size: 11px; }
  .tfoot-row td { background: #8B4513; color: white; font-weight: bold; }
  @page { margin: 1.5cm; size: A4 landscape; }
  @media print { button { display: none !important; } }
</style></head><body>
<div class="header">
  <h1>Settling Entry / Ledger — ${partyInfo.name}</h1>
  <p>Mobile: ${partyInfo.mobile || "—"} &nbsp;|&nbsp; Address: ${partyInfo.address || "—"} &nbsp;|&nbsp; Total Entries: ${entries.length}</p>
  <p style="margin-top:6px">Balance: <span class="balance-badge">${balText}</span></p>
</div>
<table>
  <thead>
    <tr>
      <th style="width:36px">Sr.</th><th>Date</th><th>Party Name</th>
      <th class="right">Credit (नाम)</th><th class="right">Debit (जमा)</th>
      <th>Narration</th><th class="right">Balance</th><th style="text-align:center">Tally</th>
    </tr>
  </thead>
  <tbody>${rows}</tbody>
  <tfoot>
    <tr class="tfoot-row">
      <td colspan="3">Total</td>
      <td style="text-align:right">${totalNaam.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
      <td style="text-align:right">${totalJama.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
      <td colspan="2" style="text-align:right">Closing: ${balText}</td>
      <td></td>
    </tr>
  </tfoot>
</table>
</body></html>`;
    // Use Blob URL instead of document.write to prevent XSS
    const blob = new Blob([html], { type: "text/html; charset=utf-8" });
    const blobUrl = URL.createObjectURL(blob);
    const printWin = window.open(blobUrl, "_blank", "width=900,height=600");
    if (printWin) {
      printWin.addEventListener("load", () => {
        setTimeout(() => { printWin.print(); URL.revokeObjectURL(blobUrl); }, 500);
      });
    }
  };

  // ── Memoised computations (avoid re-calculating on every render) ──────────
  const unlocked = useMemo(() => entries.filter((e) => !e.is_locked).length, [entries]);
  const totalNaam = useMemo(
    () => entries.reduce((s, e) => s + (e.naam || 0), 0).toLocaleString("en-IN", { minimumFractionDigits: 2 }),
    [entries]
  );
  const totalJama = useMemo(
    () => entries.reduce((s, e) => s + (e.jama || 0), 0).toLocaleString("en-IN", { minimumFractionDigits: 2 }),
    [entries]
  );
  const balInfo = balLabel(currentBalance);

  return (
    <div className="flex flex-col h-full" style={{ fontFamily: "'Work Sans', sans-serif" }}>

      {/* ── Upper bar toggle handle (mobile only) ────────────── */}
      <div className="flex-shrink-0 md:hidden">
        <button
          onClick={() => setShowHeader(h => !h)}
          data-testid="header-toggle-btn"
          style={{ width: "100%", background: "var(--primary)", border: "none", padding: "5px 12px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.1)" }}
        >
          <span style={{ color: "#fff", fontSize: "12px", fontWeight: 600 }}>
            {partyInfo ? `${toTitleCase(partyInfo.name)}` : "Settling Entry"}
          </span>
          <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "11px", display: "flex", alignItems: "center", gap: "4px" }}>
            {showHeader ? "Hide" : "Show"} {showHeader ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
          </span>
        </button>
      </div>

      {/* ── Red Title Bar — collapsible on mobile ── */}
      <div className={`flex-shrink-0 ${showHeader ? "" : "hidden md:flex"}`}>
      <div className="text-white px-3 sm:px-5 py-2 flex items-center gap-2 sm:gap-5 flex-wrap" style={{ background: "var(--primary-gradient)" }}>
        <span className="text-base sm:text-xl font-bold tracking-wide" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>
          Settling Entry
        </span>
        {partyInfo && (
          <>
            <span className="text-red-300 hidden sm:inline">|</span>
            <span className="text-sm sm:text-lg font-semibold">Party :- {toTitleCase(partyInfo.name)}</span>
            {partyInfo.mobile && (
              <span className="hidden md:inline text-sm">| Mobile :- {partyInfo.mobile}</span>
            )}
          </>
        )}
        <div className="ml-auto hidden lg:flex items-center gap-4 text-xs text-red-200">
          <span>F4 / Insert — Entry Modify</span>
          <span>|</span>
          <span>Enter — Save</span>
        </div>
      </div>

      {/* ── Control Bar — ONE balance display only (right side) ───────── */}
      <div className="flex-shrink-0 bg-stone-100 border-b-2 border-stone-400 px-3 sm:px-4 py-2 flex items-center gap-3 sm:gap-4 flex-wrap">

        {/* Toggles */}
        <label className="flex items-center gap-1.5 text-sm sm:text-base font-semibold text-blue-800 cursor-pointer">
          <input
            type="checkbox"
            className="w-3.5 h-3.5 sm:w-4 sm:h-4"
            checked={showFullAccount}
            onChange={(e) => setShowFullAccount(e.target.checked)}
          />
          <span className="hidden sm:inline">Show Full Account</span>
          <span className="sm:hidden">Full</span>
        </label>
        <label className="flex items-center gap-1.5 text-sm sm:text-base font-semibold text-blue-800 cursor-pointer">
          <input
            type="checkbox"
            className="w-3.5 h-3.5 sm:w-4 sm:h-4"
            checked={!showFullAccount}
            onChange={(e) => setShowFullAccount(!e.target.checked)}
          />
          <span className="hidden sm:inline">Only Entry Show</span>
          <span className="sm:hidden">Only</span>
        </label>

        {/* Party dropdown */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="text-sm sm:text-base font-bold text-purple-700 hidden md:inline">Party Name</span>
          <div className="relative">
            <select value={selectedId} onChange={(e) => handlePartyChange(e.target.value)}
              className="appearance-none border-2 border-stone-400 bg-white px-2 sm:px-3 py-1.5 sm:py-2 text-sm sm:text-base font-semibold focus:outline-none focus:ring-2 focus:ring-stone-700 pr-7 max-w-[150px] sm:max-w-none"
              data-testid="party-selector">
              <option value="">-- Party --</option>
              {parties.map((p) => <option key={p.id} value={p.id}>{toTitleCase(p.name)}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-500 pointer-events-none" />
          </div>
        </div>

        {/* Balance display — SINGLE location (right side) */}
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-sm sm:text-base font-bold text-stone-700">Balance:-</span>
          <div className={`font-mono font-bold text-base sm:text-lg px-2 sm:px-3 py-1.5 sm:py-2 border-2 border-stone-500 bg-white ${balInfo.color} whitespace-nowrap`} data-testid="current-balance-display">
            {selectedId ? balInfo.text : "0.00"}
          </div>
        </div>

        {/* Tally + Print + WhatsApp */}
        {selectedId && (
          <div className="flex items-center flex-wrap gap-1">
            {unlocked > 0 && (
              <button onClick={() => setTallyConfirm(true)}
                className="flex items-center gap-1 px-2 py-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded transition-colors"
                data-testid="tally-lock-btn" title={`Tally (${unlocked} entries)`}>
                <Lock size={12} /> <span className="hidden lg:inline">Tally</span> ({unlocked})
              </button>
            )}
            <button onClick={handleWhatsAppShare} disabled={sharingPdf} className="flex items-center gap-1 px-2 py-1.5 text-xs font-bold text-white rounded disabled:opacity-50" style={{ background: "#25D366" }} data-testid="whatsapp-share-btn" title="Share PDF on WhatsApp">
              <MessageCircle size={13} className={sharingPdf ? "animate-spin" : ""} /> <span className="hidden md:inline">{sharingPdf ? "..." : "Share"}</span>
            </button>
            <button onClick={handlePrint} className="flex items-center gap-1 px-2 py-1.5 text-xs font-bold bg-stone-600 text-white hover:bg-stone-700 rounded" data-testid="export-pdf-btn" title="Print PDF">
              <Printer size={12} /> <span className="hidden lg:inline">Print</span>
            </button>
          </div>
        )}
      </div>

      </div>{/* end collapsible upper bars */}

      {/* ── Full Account Info Panel ── */}
      {showFullAccount && partyInfo && selectedId && (
        <div className="flex-shrink-0 bg-amber-50 border-b border-amber-200 px-3 sm:px-5 py-2 flex flex-wrap items-center gap-3 sm:gap-6 text-sm">
          <div><span className="font-bold text-stone-700">Party:</span> <span className="text-stone-800">{toTitleCase(partyInfo.name)}</span></div>
          {partyInfo.mobile && <div><span className="font-bold text-stone-700">Mobile:</span> <span className="font-mono">{partyInfo.mobile}</span></div>}
          {partyInfo.address && <div className="hidden md:block"><span className="font-bold text-stone-700">Address:</span> <span className="text-stone-600">{partyInfo.address}</span></div>}
          <div><span className="font-bold text-stone-700">Entries:</span> <span>{entries.length}</span></div>
          <div><span className="font-bold text-stone-700">Total Credit:</span> <span className="text-red-700 font-mono font-bold">{totalNaam}</span></div>
          <div><span className="font-bold text-stone-700">Total Debit:</span> <span className="text-green-800 font-mono font-bold">{totalJama}</span></div>
        </div>
      )}

      {/* ── No party message ──────────────────────────────────────── */}
      {!selectedId && (
        <div className="flex-1 flex items-center justify-center" style={{ background: "var(--bg-page)" }}>
          <div className="text-center px-4">
            <BookOpen size={48} className="text-stone-300 mx-auto mb-4" />
            <h2 className="text-xl sm:text-2xl font-semibold text-stone-500 mb-2">Party Select Karein</h2>
            <p className="text-sm sm:text-base text-stone-400">Upar se party choose karein</p>
          </div>
        </div>
      )}

      {/* ── Ledger Content ─────────────────────────────────────────── */}
      {selectedId && (
        <div className="flex-1 overflow-auto" style={{ background: "var(--bg-page)" }} ref={tableContainerRef}>
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-8 h-8 border-4 border-stone-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* MOBILE: Card view < md */}
              <div className="block md:hidden p-3 space-y-3">
                {entries.length === 0 ? (
                  <div className="pk-card text-center py-10">
                    <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>Koi entry nahi hai — neeche se add karein</p>
                  </div>
                ) : entries.map((e) => (
                  <div key={e.id} className="pk-card" data-testid={`ledger-row-${e.id}`}
                    style={{ borderLeft: `3px solid ${e.naam > 0 ? "var(--lena)" : "var(--dena)"}` }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"8px" }}>
                      <div>
                        <div style={{ fontSize:"13px", fontWeight:600, fontFamily:"var(--font-mono)", color:"var(--text-primary)" }}>{formatDate(e.date)}</div>
                        {e.created_at && <div style={{ fontSize:"11px", color:"var(--text-tertiary)", fontFamily:"var(--font-mono)" }}>{formatTime(e.created_at)}</div>}
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <div style={{ fontSize:"15px", fontWeight:700, fontFamily:"var(--font-mono)", color: e.balance > 0 ? "var(--dena)" : e.balance < 0 ? "var(--lena)" : "var(--text-tertiary)" }}>
                          ₹{Math.abs(e.balance).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </div>
                        {e.is_locked && <span style={{ fontSize:"10px", background:"var(--warning-bg)", color:"var(--warning)", padding:"2px 6px", borderRadius:"8px", fontWeight:600 }}>Locked ★</span>}
                      </div>
                    </div>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: e.narration ? "8px" : "0" }}>
                      <span style={{ fontSize:"14px", fontWeight:600, color:"var(--dena)" }}>{toTitleCase(e.counterparty_name || "—")}</span>
                      <div>
                        {e.naam > 0 && <span style={{ fontSize:"14px", fontWeight:700, fontFamily:"var(--font-mono)", color:"var(--lena)" }}>Credit ₹{e.naam.toLocaleString("en-IN",{minimumFractionDigits:2})}</span>}
                        {e.jama > 0 && <span style={{ fontSize:"14px", fontWeight:700, fontFamily:"var(--font-mono)", color:"#166534" }}>Debit ₹{e.jama.toLocaleString("en-IN",{minimumFractionDigits:2})}</span>}
                      </div>
                    </div>
                    {e.narration && (
                      <div style={{ fontSize:"13px", color:"var(--text-secondary)", fontStyle:"italic", padding:"6px 10px", background:"var(--bg-page)", borderRadius:"6px", marginBottom:"8px" }}>
                        "{e.narration}"
                      </div>
                    )}
                    {!e.is_locked && (
                      <div style={{ borderTop:"0.5px solid var(--border)", paddingTop:"8px", display:"flex", gap:"8px", justifyContent:"flex-end" }}>
                        <button onClick={()=>{setEditEntry(e);setEditForm({date:e.date,naam:e.naam||"",jama:e.jama||"",narration:e.narration||""});}}
                          style={{ background:"var(--info-bg)", border:"none", borderRadius:"8px", padding:"6px 14px", color:"var(--info)", fontSize:"13px", fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:"4px" }}
                          data-testid={`edit-entry-${e.id}`}><Pencil size={13} /> Edit</button>
                        <button onClick={()=>setDeleteEntry(e)}
                          style={{ background:"var(--danger-bg)", border:"none", borderRadius:"8px", padding:"6px 14px", color:"var(--danger)", fontSize:"13px", fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:"4px" }}
                          data-testid={`delete-entry-${e.id}`}><Trash2 size={13} /> Delete</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* DESKTOP: Table view md+ */}
              <div className="hidden md:block overflow-x-auto min-w-full">
              <table className="min-w-[700px] w-full border-collapse" data-testid="ledger-table">
                <thead className="sticky top-0 z-10">
                  <tr style={{ background: "var(--primary)" }} className="text-white">
                    <th className="px-2 sm:px-3 py-2.5 sm:py-3 text-center border-r border-amber-900 w-8 sm:w-10">
                      <input type="checkbox" className="w-3.5 h-3.5 sm:w-4 sm:h-4 accent-amber-400 cursor-pointer"
                        checked={entries.filter(e => !e.is_locked).length > 0 && entries.filter(e => !e.is_locked).every(e => selectedEntries.has(e.id))}
                        onChange={toggleAll} data-testid="select-all-checkbox" />
                    </th>
                    <th className="px-2 sm:px-3 py-2.5 sm:py-3 text-center text-xs font-bold uppercase border-r border-amber-900 w-10">Sr.</th>
                    <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-left text-xs font-bold uppercase border-r border-amber-900 whitespace-nowrap">
                      Date<br/><span className="text-yellow-300 text-xs font-normal normal-case">Time</span>
                    </th>
                    <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-left text-xs font-bold uppercase border-r border-amber-900 w-28 sm:w-36">Party</th>
                    <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-right text-xs font-bold uppercase border-r border-amber-900">
                      Credit<br /><span className="text-yellow-300 text-xs font-normal">(नाम)</span>
                    </th>
                    <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-right text-xs font-bold uppercase border-r border-amber-900">
                      Debit<br /><span className="text-yellow-300 text-xs font-normal">(जमा)</span>
                    </th>
                    <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-left text-xs font-bold uppercase border-r border-amber-900 hidden md:table-cell">Narration</th>
                    <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-right text-xs font-bold uppercase border-r border-amber-900">Balance</th>
                    <th className="px-2 sm:px-4 py-2.5 sm:py-3 text-center text-xs font-bold uppercase border-r border-amber-900 hidden sm:table-cell">T</th>
                    <th className="px-2 sm:px-4 py-2.5 sm:py-3 text-center text-xs font-bold uppercase">Edit</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedEntries.size > 0 && (
                    <tr style={{ background: "#1e3a5f" }}>
                      <td colSpan={10} className="px-4 py-2">
                        <div className="flex items-center gap-4 text-white">
                          <span className="text-sm font-bold">{selectedEntries.size} selected</span>
                          <button onClick={() => setSelectedEntries(new Set())} className="text-xs px-3 py-1 bg-white/20 hover:bg-white/30 rounded" data-testid="clear-selection-btn">Clear</button>
                        </div>
                      </td>
                    </tr>
                  )}
                  {entries.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="text-center py-16 text-stone-600 text-base" style={{ background: "var(--bg-page)" }}>
                        Koi entry nahi hai — neeche se pehli entry add karein
                      </td>
                    </tr>
                  ) : visibleEntries.map((e, i) => {
                    const bl = balLabel(e.balance);
                    const isSelected = selectedEntries.has(e.id);
                    const rowBg = isSelected ? "#c7d7f0" : (i % 2 === 0 ? "#FFE8CC" : "#FFDAB0");
                    return (
                      <tr key={e.id} style={{ background: rowBg }} className="border-b border-amber-300" data-testid={`ledger-row-${e.id}`}>
                        <td className="px-2 sm:px-3 py-2 sm:py-3 text-center border-r border-amber-200">
                          {!e.is_locked ? (
                            <input type="checkbox" checked={isSelected} onChange={() => toggleEntry(e.id)} className="w-3.5 h-3.5 sm:w-4 sm:h-4 accent-blue-600 cursor-pointer" data-testid={`checkbox-${e.id}`} />
                          ) : <span className="text-stone-300 text-xs">—</span>}
                        </td>
                        <td className="px-3 sm:px-4 py-2 sm:py-3 text-center text-xs font-mono text-stone-500 border-r border-amber-200">{i + 1}</td>
                        <td className="px-3 sm:px-4 py-2 sm:py-3 border-r border-amber-200 whitespace-nowrap">
                          <div className="text-base font-mono text-stone-800">{formatDate(e.date)}</div>
                          {e.created_at && <div className="text-xs text-stone-500 font-mono">{formatTime(e.created_at)}</div>}
                        </td>
                        <td className="px-3 sm:px-4 py-2 sm:py-3 text-base border-r border-amber-200 font-semibold">
                          {e.counterparty_name
                            ? <span className="text-blue-800">{toTitleCase(e.counterparty_name)}</span>
                            : <span className="text-stone-400 text-sm italic">—</span>}
                        </td>
                        <td className="px-3 sm:px-4 py-2 sm:py-3 text-right text-base font-mono font-bold text-red-800 border-r border-amber-200">
                          {e.naam > 0 ? e.naam.toLocaleString("en-IN", { minimumFractionDigits: 2 }) : ""}
                        </td>
                        <td className="px-3 sm:px-4 py-2 sm:py-3 text-right text-base font-mono font-bold text-green-900 border-r border-amber-200">
                          {e.jama > 0 ? e.jama.toLocaleString("en-IN", { minimumFractionDigits: 2 }) : ""}
                        </td>
                        <td className="px-3 sm:px-4 py-2 sm:py-3 text-base text-stone-700 border-r border-amber-200 max-w-[160px] truncate hidden md:table-cell">{e.narration || "—"}</td>
                        <td className="px-3 sm:px-4 py-2 sm:py-3 text-right border-r border-amber-200">
                          <span className={`text-base font-mono font-bold whitespace-nowrap ${balColor(e.balance)}`}>
                            {Math.abs(e.balance).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </span>
                        </td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-center border-r border-amber-200 hidden sm:table-cell">
                          {e.is_locked ? <span className="text-amber-800 font-black text-base" data-testid={`entry-locked-${e.id}`}>*</span> : <span className="text-stone-400">—</span>}
                        </td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-center">
                          {!e.is_locked ? (
                            <div className="flex items-center justify-center gap-0.5 sm:gap-1">
                              <button onClick={() => { setEditEntry(e); setEditForm({ date: e.date, naam: e.naam || "", jama: e.jama || "", narration: e.narration || "" }); }} className="p-1 sm:p-1.5 text-stone-600 hover:text-blue-800 hover:bg-blue-100 rounded" data-testid={`edit-entry-${e.id}`}><Pencil size={13} /></button>
                              <button onClick={() => setDeleteEntry(e)} className="p-1 sm:p-1.5 text-red-600 hover:text-red-800 hover:bg-red-100 rounded" data-testid={`delete-entry-${e.id}`}><Trash2 size={13} /></button>
                            </div>
                          ) : <span className="text-stone-400 text-xs">—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {/* Virtual scroll sentinel */}
              {visibleCount < entries.length && (
                <div ref={sentinelRef} className="flex items-center justify-center py-3 text-xs text-stone-400">
                  Showing {visibleCount}/{entries.length} entries — scroll to load more
                </div>
              )}
            </div>
            </>
          )}
        </div>
      )}

      {/* ── Fast Entry Panel ─────────────────────────────────────────── */}
      {selectedId && (
        <div className="flex-shrink-0" style={{ background: "var(--primary)" }} data-testid="fast-entry-row">

          {/* ── MOBILE: Curtain entry panel < md ──────────────────────────── */}
          <div className="block md:hidden">
            {/* Curtain Handle — always visible, toggles the form */}
            <button
              onClick={() => setIsEntryOpen(o => !o)}
              data-testid="entry-panel-toggle"
              style={{
                width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "10px 16px", background: "var(--primary)", border: "none", cursor: "pointer",
                borderTop: isEntryOpen ? "none" : "2px solid rgba(255,255,255,0.2)"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "6px", height: "6px", background: "#22C55E", borderRadius: "50%" }} className="animate-pulse" />
                <span style={{ color: "#fff", fontWeight: 700, fontSize: "14px" }}>New Entry</span>
                {!isEntryOpen && (
                  <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "11px" }}>
                    {liveTime.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}
                  </span>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#fff" }}>
                {isEntryOpen
                  ? <><span style={{ fontSize: "12px", opacity: 0.7 }}>Hide</span><ChevronDown size={18} /></>
                  : <><span style={{ fontSize: "12px", opacity: 0.7 }}>Open</span><ChevronUp size={18} /></>
                }
              </div>
            </button>

            {/* Curtain body — slides open/closed */}
            <div style={{
              maxHeight: isEntryOpen ? "600px" : "0px",
              overflow: "hidden",
              transition: "max-height 0.3s ease",
            }}>
              <div className="pk-card" style={{ margin: "0 12px 12px", padding: "0", overflow: "hidden" }}>
              {/* Form body */}
              <div style={{ padding: "14px", display: "flex", flexDirection: "column", gap: "12px" }}>
                {/* Row 1: Date + Party */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <label className="pk-label">Date</label>
                    <input type="date" value={fastEntry.date} onChange={(e) => setFastEntry((p) => ({ ...p, date: e.target.value }))}
                      onKeyDown={(e) => handleFastKeyDown(e, naamRef)} tabIndex={1}
                      className="pk-input" style={{ fontFamily: "var(--font-mono)", fontSize: "13px" }} data-testid="fast-entry-date" />
                  </div>
                  <div>
                    <label className="pk-label">Party Name</label>
                    <div style={{ position: "relative" }}>
                      <select ref={partySelectRef} value={fastEntry.partyId} onChange={(e) => handleFastPartyChange(e.target.value)}
                        onKeyDown={(e) => handleFastKeyDown(e, naamRef)} tabIndex={0}
                        className="pk-input" style={{ appearance: "none", paddingRight: "28px", fontSize: "13px", fontWeight: 600 }}
                        data-testid="fast-entry-party-select">
                        <option value="">Select party</option>
                        {parties.filter((p) => p.id !== selectedId).map((p) => { const bal = p.current_balance; const balStr = bal > 0 ? ` [₹${Math.abs(bal).toLocaleString("en-IN",{maximumFractionDigits:0})} Lena]` : bal < 0 ? ` [₹${Math.abs(bal).toLocaleString("en-IN",{maximumFractionDigits:0})} Dena]` : " [0]"; return <option key={p.id} value={p.id}>{toTitleCase(p.name)}{balStr}</option>; })}
                      </select>
                      <ChevronDown size={14} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-tertiary)", pointerEvents: "none" }} />
                    </div>
                  </div>
                </div>
                {/* Row 2: Naam + Jama */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <label className="pk-label" style={{ color: "var(--lena)" }}>Credit (नाम)</label>
                    <div style={{ position: "relative" }}>
                      <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--lena)", fontWeight: 700, fontSize: "14px" }}>₹</span>
                      <input ref={naamRef} type="number" step="0.01" min="0" value={fastEntry.naam}
                        onChange={(e) => setFastEntry((p) => ({ ...p, naam: e.target.value }))}
                        onKeyDown={(e) => handleFastKeyDown(e, jamaRef)} tabIndex={2} placeholder="0.00"
                        className="pk-input" style={{ paddingLeft: "28px", fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--lena)", textAlign: "right" }}
                        data-testid="fast-entry-naam-input" />
                    </div>
                  </div>
                  <div>
                    <label className="pk-label" style={{ color: "#166534" }}>Debit (जमा)</label>
                    <div style={{ position: "relative" }}>
                      <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#166534", fontWeight: 700, fontSize: "14px" }}>₹</span>
                      <input ref={jamaRef} type="number" step="0.01" min="0" value={fastEntry.jama}
                        onChange={(e) => setFastEntry((p) => ({ ...p, jama: e.target.value }))}
                        onKeyDown={(e) => handleFastKeyDown(e, narrationRef)} tabIndex={3} placeholder="0.00"
                        className="pk-input" style={{ paddingLeft: "28px", fontFamily: "var(--font-mono)", fontWeight: 700, color: "#166534", textAlign: "right" }}
                        data-testid="fast-entry-jama-input" />
                    </div>
                  </div>
                </div>
                {/* Row 3: Narration */}
                <div>
                  <label className="pk-label">Narration / Vivaran</label>
                  <input ref={narrationRef} type="text" value={fastEntry.narration}
                    onChange={(e) => setFastEntry((p) => ({ ...p, narration: e.target.value }))}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSave(); } else if (e.key === "Tab") { e.preventDefault(); saveRef.current?.focus(); } }}
                    tabIndex={4} placeholder="Optional: describe this entry..."
                    className="pk-input" data-testid="fast-entry-narration-input" />
                </div>
                {/* Row 4: Save button */}
                <button ref={saveRef} onClick={handleSave} disabled={saving} tabIndex={5}
                  className="pk-btn pk-btn--success" style={{ width: "100%", fontSize: "15px", minHeight: "48px", borderRadius: "var(--radius-sm)" }}
                  data-testid="fast-entry-save-btn">
                  {saving ? "Saving..." : "Save Entry (OK)"}
                </button>
              </div>
              </div>
            </div>
          </div>

          {/* ── DESKTOP: Horizontal bar md+ ───────────────────────────── */}
          <div className="hidden md:flex flex-wrap items-end gap-2 px-4 py-3">
            {/* Live Clock */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5 bg-black/25 rounded px-2 py-1 border border-white/20">
                <div className="text-white font-mono text-xs font-bold">
                  {liveTime.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true, timeZone: "Asia/Kolkata" })}
                </div>
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              </div>
              <input type="date" value={fastEntry.date} onChange={(e) => setFastEntry((p) => ({ ...p, date: e.target.value }))}
                onKeyDown={(e) => handleFastKeyDown(e, naamRef)} tabIndex={1}
                className="border-2 border-stone-600 px-2 py-1.5 text-sm font-mono bg-white focus:outline-none focus:ring-2 focus:ring-stone-900 w-36 sm:w-40"
                data-testid="fast-entry-date" />
              <span className="text-xs font-bold text-white text-center">Date</span>
            </div>
            {/* Party */}
            <div className="flex flex-col gap-1">
              <div className="relative">
                <select ref={partySelectRef} value={fastEntry.partyId} onChange={(e) => handleFastPartyChange(e.target.value)}
                  onKeyDown={(e) => handleFastKeyDown(e, naamRef)} tabIndex={0}
                  className="appearance-none border-2 border-stone-600 px-2 py-1.5 text-sm font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-stone-900 w-44 pr-6"
                  data-testid="fast-entry-party-select">
                  <option value="">-- Party --</option>
                  {parties.filter((p) => p.id !== selectedId).map((p) => { const bal = p.current_balance; const balStr = bal > 0 ? ` [₹${Math.abs(bal).toLocaleString("en-IN",{maximumFractionDigits:0})} Lena]` : bal < 0 ? ` [₹${Math.abs(bal).toLocaleString("en-IN",{maximumFractionDigits:0})} Dena]` : " [0]"; return <option key={p.id} value={p.id}>{toTitleCase(p.name)}{balStr}</option>; })}
                </select>
                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-500 pointer-events-none" />
              </div>
              <span className="text-xs font-bold text-white text-center">Party Name</span>
            </div>
            {/* Naam */}
            <div className="flex flex-col gap-1">
              <input ref={naamRef} type="number" step="0.01" min="0" value={fastEntry.naam}
                onChange={(e) => setFastEntry((p) => ({ ...p, naam: e.target.value }))}
                onKeyDown={(e) => handleFastKeyDown(e, jamaRef)} tabIndex={2} placeholder="0.00"
                className="border-2 border-stone-600 px-2 py-1.5 text-sm font-mono bg-white focus:outline-none focus:ring-2 focus:ring-red-600 w-28 text-right"
                data-testid="fast-entry-naam-input" />
              <span className="text-xs font-bold text-white text-center">नाम (Credit)</span>
            </div>
            {/* Jama */}
            <div className="flex flex-col gap-1">
              <input ref={jamaRef} type="number" step="0.01" min="0" value={fastEntry.jama}
                onChange={(e) => setFastEntry((p) => ({ ...p, jama: e.target.value }))}
                onKeyDown={(e) => handleFastKeyDown(e, narrationRef)} tabIndex={3} placeholder="0.00"
                className="border-2 border-stone-600 px-2 py-1.5 text-sm font-mono bg-white focus:outline-none focus:ring-2 focus:ring-green-700 w-28 text-right"
                data-testid="fast-entry-jama-input" />
              <span className="text-xs font-bold text-white text-center">जमा (Debit)</span>
            </div>
            {/* Narration */}
            <div className="flex flex-col gap-1 flex-1 min-w-[120px]">
              <input ref={narrationRef} type="text" value={fastEntry.narration}
                onChange={(e) => setFastEntry((p) => ({ ...p, narration: e.target.value }))}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSave(); } else if (e.key === "Tab") { e.preventDefault(); saveRef.current?.focus(); } }}
                tabIndex={4} placeholder="Narration..."
                className="border-2 border-stone-600 px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-stone-900"
                data-testid="fast-entry-narration-input" />
              <span className="text-xs font-bold text-white text-center">Narration</span>
            </div>
            {/* OK */}
            <div className="flex flex-col gap-1.5 pb-5">
              <button ref={saveRef} onClick={handleSave} disabled={saving} tabIndex={5}
                className="px-6 py-2 bg-white border-2 border-stone-700 text-stone-900 text-sm font-bold hover:bg-stone-100 disabled:opacity-50"
                data-testid="fast-entry-save-btn">{saving ? "..." : "OK"}</button>
            </div>
          </div>
          {/* Status strip */}
          <div className="px-4 py-1 flex items-center gap-6 text-xs text-white border-t border-white/10" style={{ background: "rgba(0,0,0,0.2)" }}>
            <span className="font-bold">Entries: {entries.length}</span>
            <span>|</span><span className="font-bold">Locked: {entries.filter(e => e.is_locked).length}</span>
            <span>|</span><span className="font-bold">Open: {unlocked}</span>
          </div>
        </div>
      )}

            {/* ── Edit Modal ────────────────────────────────────────────── */}
      {editEntry && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white shadow-2xl w-full max-w-lg border-2 border-stone-500" data-testid="edit-entry-modal">
            <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b" style={{ background: "var(--primary)" }}>
              <h2 className="text-base sm:text-lg font-bold text-white">Entry Modify</h2>
              <button onClick={() => setEditEntry(null)}><X size={18} className="text-white" /></button>
            </div>
            <div className="px-4 sm:px-6 py-4 sm:py-5 space-y-3 sm:space-y-4" style={{ background: "#FFE8CC" }}>
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Date</label>
                <input type="date" value={editForm.date} onChange={(e) => setEditForm((p) => ({ ...p, date: e.target.value }))}
                  className="w-full border-2 border-stone-400 px-3 py-2 text-base font-mono bg-white focus:outline-none focus:ring-2 focus:ring-stone-700" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-red-700 mb-1">नाम / Credit (₹)</label>
                  <input type="number" step="0.01" min="0" value={editForm.naam} onChange={(e) => setEditForm((p) => ({ ...p, naam: e.target.value }))}
                    className="w-full border-2 border-red-300 px-3 py-2 text-base font-mono bg-white text-right focus:outline-none focus:ring-2 focus:ring-red-400" data-testid="edit-naam-input" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-green-800 mb-1">जमा / Debit (₹)</label>
                  <input type="number" step="0.01" min="0" value={editForm.jama} onChange={(e) => setEditForm((p) => ({ ...p, jama: e.target.value }))}
                    className="w-full border-2 border-green-300 px-3 py-2 text-base font-mono bg-white text-right focus:outline-none focus:ring-2 focus:ring-green-500" data-testid="edit-jama-input" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Narration</label>
                <input type="text" value={editForm.narration} onChange={(e) => setEditForm((p) => ({ ...p, narration: e.target.value }))}
                  className="w-full border-2 border-stone-400 px-3 py-2 text-base bg-white focus:outline-none focus:ring-2 focus:ring-stone-700" data-testid="edit-narration-input" />
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={() => setEditEntry(null)} className="flex-1 border-2 border-stone-400 text-stone-700 py-2 text-sm font-semibold bg-white hover:bg-stone-50 rounded">Cancel</button>
                <button onClick={handleEditSave} disabled={saving} className="flex-1 text-white py-2 text-sm font-bold rounded disabled:opacity-50" style={{ background: "var(--primary)" }} data-testid="edit-entry-save-btn">
                  {saving ? "Saving..." : "Modify / Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete / Tally Modals (unchanged, just responsive padding) ── */}
      {deleteEntry && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white shadow-2xl w-full max-w-md border-2 border-red-500" data-testid="delete-entry-modal">
            <div className="px-4 sm:px-5 py-3 border-b bg-red-600 text-white text-base font-bold">Entry Delete Karein?</div>
            <div className="px-4 sm:px-6 py-4 sm:py-5" style={{ background: "#FFE8CC" }}>
              <p className="text-sm sm:text-base text-stone-700 mb-4">Yeh entry permanently delete ho jaayegi.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteEntry(null)} className="flex-1 border-2 border-stone-400 text-stone-700 py-2 text-sm font-semibold bg-white hover:bg-stone-50 rounded" data-testid="delete-entry-cancel-btn">Cancel</button>
                <button onClick={handleDeleteEntry} className="flex-1 bg-red-600 text-white py-2 text-sm font-bold rounded hover:bg-red-700" data-testid="delete-entry-confirm-btn">Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {tallyConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white shadow-2xl w-full max-w-md border-2 border-amber-600" data-testid="tally-confirm-modal">
            <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b" style={{ background: "var(--primary)" }}>
              <h3 className="text-base sm:text-lg font-bold text-white">Tally / Lock Karein?</h3>
              <Lock size={18} className="text-white" />
            </div>
            <div className="px-4 sm:px-6 py-4 sm:py-5" style={{ background: "#FFE8CC" }}>
              <p className="text-sm sm:text-base text-stone-700 mb-2">{unlocked} entries lock ho jaayengi.</p>
              <p className={`text-xl font-mono font-bold mb-4 ${balInfo.color}`}>{balInfo.text}</p>
              <div className="bg-amber-50 border border-amber-400 rounded p-3 mb-4 text-xs text-amber-800">Lock hone ke baad entries edit nahi ho sakti.</div>
              <div className="flex gap-3">
                <button onClick={() => setTallyConfirm(false)} className="flex-1 border-2 border-stone-400 text-stone-700 py-2 text-sm font-semibold bg-white hover:bg-stone-50 rounded" data-testid="tally-cancel-btn">Cancel</button>
                <button onClick={handleTally} className="flex-1 text-white py-2 text-sm font-bold rounded" style={{ background: "var(--primary)" }} data-testid="tally-confirm-btn">Lock Karein</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LedgerPage;
