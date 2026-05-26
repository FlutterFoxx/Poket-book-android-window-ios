import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "@/contexts/AuthContext";
import { today, toTitleCase } from "@/utils/helpers";
import { androidExport, androidExportBlob } from "@/utils/androidExport";
import { toast } from "sonner";
import { BookOpen } from "lucide-react";
import { balLabel } from "@/components/ledger/ledgerUtils";
import LedgerHeader from "@/components/ledger/LedgerHeader";
import LedgerTable from "@/components/ledger/LedgerTable";
import FastEntryPanel from "@/components/ledger/FastEntryPanel";
import { EditEntryModal, DeleteConfirmModal, TallyConfirmModal, WhatsAppModal } from "@/components/ledger/LedgerModals";

const EMPTY_FAST = { date: today(), partyId: "", naam: "", jama: "", narration: "" };

const LedgerPage = () => {
  const { partyId: urlPartyId } = useParams();
  const navigate = useNavigate();

  // ── State ───────────────────────────────────────────────────────────────────
  const [parties, setParties] = useState([]);
  const [selectedId, setSelectedId] = useState(urlPartyId || "");
  const [partyInfo, setPartyInfo] = useState(null);
  const [entries, setEntries] = useState([]);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showFullAccount, setShowFullAccount] = useState(true);
  const [showHeader, setShowHeader] = useState(true);
  const [fastEntry, setFastEntry] = useState(EMPTY_FAST);
  const [saving, setSaving] = useState(false);
  const [editEntry, setEditEntry] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [deleteEntry, setDeleteEntry] = useState(null);
  const [tallyConfirm, setTallyConfirm] = useState(false);
  const [selectedEntries, setSelectedEntries] = useState(new Set());
  const [liveTime, setLiveTime] = useState(new Date());
  const [isEntryOpen, setIsEntryOpen] = useState(true);
  const [focusedRowIdx, setFocusedRowIdx] = useState(-1);
  // WhatsApp — declared before keyboard useEffect to avoid TDZ in production build
  const [sharingPdf, setSharingPdf] = useState(false);
  const [waModal, setWaModal] = useState(false);
  const [waFrom, setWaFrom] = useState("");
  const [waTo, setWaTo] = useState("");
  const [waMode, setWaMode] = useState("latest");
  const savingLockRef = useRef(false);

  // ── Refs ─────────────────────────────────────────────────────────────────────
  const naamRef = useRef(null);
  const jamaRef = useRef(null);
  const narrationRef = useRef(null);
  const saveRef = useRef(null);
  const partySelectRef = useRef(null);
  const tableContainerRef = useRef(null);
  const sentinelRef = useRef(null);

  // ── Virtual scroll ────────────────────────────────────────────────────────
  const [visibleCount, setVisibleCount] = useState(80);
  const visibleEntries = useMemo(() => entries.slice(0, visibleCount), [entries, visibleCount]);

  useEffect(() => {
    if (!sentinelRef.current) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && visibleCount < entries.length)
        setVisibleCount(c => Math.min(c + 60, entries.length));
    }, { rootMargin: "200px" });
    obs.observe(sentinelRef.current);
    return () => obs.disconnect();
  }, [entries.length, visibleCount]);

  // ── Sound + vibration ────────────────────────────────────────────────────
  const playSaveSound = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
        osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.15);
      }
    } catch (_audioErr) {
      // Web Audio API not supported in this environment — intentional silent fail
    }
    if ("vibrate" in navigator) navigator.vibrate([40]);
  }, []);

  // ── Selection helpers ────────────────────────────────────────────────────
  const toggleEntry = (id) => setSelectedEntries(prev => {
    const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next;
  });
  const toggleAll = () => {
    const ids = entries.filter(e => !e.is_locked).map(e => e.id);
    const allSel = ids.every(id => selectedEntries.has(id));
    setSelectedEntries(allSel ? new Set() : new Set(ids));
  };

  // ── Data fetchers ────────────────────────────────────────────────────────
  const fetchParties = useCallback(async () => {
    try {
      const res = await api.get("/api/parties");
      setParties(res.data);
    } catch (err) {
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

  // ── Effects ───────────────────────────────────────────────────────────────
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchParties(); }, [fetchParties]);
  useEffect(() => { if (urlPartyId) setSelectedId(urlPartyId); }, [urlPartyId]);
  useEffect(() => { if (selectedId) { fetchEntries(selectedId); setVisibleCount(80); } }, [selectedId, fetchEntries]);
  useEffect(() => { setFastEntry(p => ({ ...p, partyId: "" })); setFocusedRowIdx(-1); }, [selectedId]);

  // unlocked — declared before keyboard useEffect to prevent TDZ
  const unlocked = useMemo(() => entries.filter(e => !e.is_locked).length, [entries]);

  // ── Global keyboard shortcuts ────────────────────────────────────────────
  useEffect(() => {
    const FORM_REFS = [partySelectRef, naamRef, jamaRef, narrationRef, saveRef];
    const handleKeys = (e) => {
      const tag = document.activeElement?.tagName;
      const inInput = ["INPUT", "TEXTAREA", "SELECT"].includes(tag);

      if (e.key === "F1") {
        e.preventDefault();
        navigate("/parties?new=1");
        toast.info("New Party — Add karein", { duration: 1500 });
      } else if (e.key === "F4") {
        e.preventDefault();
        const target = focusedRowIdx >= 0 ? entries[focusedRowIdx] : entries.find(en => !en.is_locked);
        if (target && !target.is_locked) {
          setEditEntry(target);
          setEditForm({ date: target.date, naam: target.naam || "", jama: target.jama || "", narration: target.narration || "" });
        } else { toast.error("Koi unlocked entry nahi hai edit karne ke liye"); }
      } else if (e.key === "F5") {
        e.preventDefault();
        if (unlocked > 0) setTallyConfirm(true);
        else toast.info("Sab entries already locked hain");
      } else if (e.key === "Escape") {
        if (editEntry) { setEditEntry(null); setEditForm({}); }
        if (deleteEntry) setDeleteEntry(null);
        if (tallyConfirm) setTallyConfirm(false);
        if (waModal) setWaModal(false);
        setFocusedRowIdx(-1);
      } else if (e.key === "ArrowDown") {
        if (inInput) {
          e.preventDefault();
          const i = FORM_REFS.findIndex(r => r.current === document.activeElement);
          if (i >= 0 && i < FORM_REFS.length - 1) FORM_REFS[i + 1].current?.focus();
        } else if (!editEntry) {
          e.preventDefault();
          setFocusedRowIdx(prev => {
            const next = Math.min(prev + 1, entries.length - 1);
            requestAnimationFrame(() => document.querySelector(`[data-row-idx="${next}"]`)?.scrollIntoView({ block: "nearest", behavior: "smooth" }));
            return next;
          });
        }
      } else if (e.key === "ArrowUp") {
        if (inInput) {
          e.preventDefault();
          const i = FORM_REFS.findIndex(r => r.current === document.activeElement);
          if (i > 0) FORM_REFS[i - 1].current?.focus();
        } else if (!editEntry) {
          e.preventDefault();
          setFocusedRowIdx(prev => {
            const next = Math.max(prev - 1, 0);
            requestAnimationFrame(() => document.querySelector(`[data-row-idx="${next}"]`)?.scrollIntoView({ block: "nearest", behavior: "smooth" }));
            return next;
          });
        }
      }
    };
    window.addEventListener("keydown", handleKeys);
    return () => window.removeEventListener("keydown", handleKeys);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, editEntry, deleteEntry, tallyConfirm, waModal, unlocked, focusedRowIdx]);

  // Auto-scroll to bottom when entries update
  useEffect(() => {
    if (tableContainerRef.current && entries.length > 0) {
      requestAnimationFrame(() => {
        if (tableContainerRef.current) tableContainerRef.current.scrollTop = tableContainerRef.current.scrollHeight;
      });
    }
  }, [entries]);

  // Live clock + auto-date rollover
  useEffect(() => {
    const tick = setInterval(() => {
      const now = new Date();
      setLiveTime(now);
      const todayStr = now.toISOString().split("T")[0];
      setFastEntry(prev => {
        const yesterday = new Date(now - 86400000).toISOString().split("T")[0];
        return prev.date === yesterday ? { ...prev, date: todayStr } : prev;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handlePartyChange = (pid) => {
    setSelectedId(pid);
    navigate(pid ? `/ledger/${pid}` : "/ledger", { replace: true });
  };

  const handleFastPartyChange = (pid) => setFastEntry(p => ({ ...p, partyId: pid }));

  const handleFastKeyDown = (e, nextRef) => {
    if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); if (nextRef?.current) nextRef.current.focus(); }
  };

  const handleSave = async () => {
    if (savingLockRef.current) return;
    if (!fastEntry.partyId) { toast.error("Neeche se party select karein", { duration: 1500 }); return; }
    if (!fastEntry.naam && !fastEntry.jama) { toast.error("नाम या जमा amount likhein", { duration: 1500 }); return; }
    savingLockRef.current = true;
    setSaving(true);
    try {
      await api.post(`/api/ledger/${selectedId}/entries`, {
        date: fastEntry.date,
        naam: parseFloat(fastEntry.naam) || 0,
        jama: parseFloat(fastEntry.jama) || 0,
        narration: fastEntry.narration,
        counterparty_id: fastEntry.partyId,
      });
      toast.success("Entry save ho gayi", { duration: 1500 });
      playSaveSound();
      setFastEntry({ ...EMPTY_FAST, partyId: "", date: today() });
      fetchEntries(selectedId);
      fetchParties();
      setTimeout(() => partySelectRef.current?.focus(), 100);
    } catch (err) { toast.error(err.response?.data?.detail || "Entry save nahi hui", { duration: 1500 }); }
    setSaving(false);
    savingLockRef.current = false;
  };

  const handleWhatsAppShare = () => {
    if (!partyInfo || !selectedId) return;
    const todayStr = today();
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];
    setWaFrom(weekAgo); setWaTo(todayStr); setWaMode("latest");
    setWaModal(true);
  };

  const handleWaSend = async () => {
    setWaModal(false); setSharingPdf(true);
    const params = waMode === "range" && waFrom && waTo ? `?start_date=${waFrom}&end_date=${waTo}` : "";
    const fileName = `PoketBook_${toTitleCase(partyInfo.name)}_${waMode === "range" ? `${waFrom}_to_${waTo}` : "Statement"}.pdf`;
    await androidExport(`/api/export/ledger/${selectedId}/pdf${params}`, fileName, "share");
    setSharingPdf(false);
  };

  const handleScreenshot = async () => {
    const toastId = toast.loading("Taking screenshot...");
    try {
      const noCapture = document.querySelectorAll(".no-screenshot");
      noCapture.forEach(n => { n.style.visibility = "hidden"; });
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(document.body, {
        useCORS: true, allowTaint: false, backgroundColor: "#ffffff",
        scale: Math.min(window.devicePixelRatio || 1, 2), logging: false,
        timeout: 15000, imageTimeout: 5000,
        windowWidth: window.innerWidth, windowHeight: window.innerHeight,
        width: window.innerWidth, height: window.innerHeight,
        x: 0, y: window.scrollY || 0,
        onclone: (doc) => { doc.querySelectorAll("img").forEach(img => { img.crossOrigin = "anonymous"; }); },
      });
      noCapture.forEach(n => { n.style.visibility = ""; });
      toast.dismiss(toastId);
      canvas.toBlob(async (blob) => {
        const date = new Date().toISOString().split("T")[0];
        await androidExportBlob(blob, `PoketBook_${toTitleCase(partyInfo?.name || "Ledger")}_${date}.png`, "save");
      }, "image/png");
    } catch (err) {
      document.querySelectorAll(".no-screenshot").forEach(n => { n.style.visibility = ""; });
      toast.dismiss(toastId);
      if (process.env.NODE_ENV === "development") console.error(err);
      toast.error("Screenshot failed — try again", { duration: 2500 });
    }
  };

  const handlePrint = async () => {
    if (!partyInfo || !selectedId) return;
    await androidExport(`/api/export/ledger/${selectedId}/pdf`, `PoketBook_${toTitleCase(partyInfo.name)}_Statement.pdf`, "save");
  };

  const handleEditSave = async () => {
    setSaving(true);
    try {
      await api.put(`/api/ledger/${selectedId}/entries/${editEntry.id}`, {
        date: editForm.date, naam: parseFloat(editForm.naam) || 0,
        jama: parseFloat(editForm.jama) || 0, narration: editForm.narration,
      });
      toast.success("Entry update ho gayi");
      setEditEntry(null); fetchEntries(selectedId);
    } catch (err) { toast.error(err.response?.data?.detail || "Update nahi hua"); }
    setSaving(false);
  };

  const handleDeleteEntry = async () => {
    try {
      await api.delete(`/api/ledger/${selectedId}/entries/${deleteEntry.id}`);
      toast.success("Entry delete ho gayi");
      setDeleteEntry(null); fetchEntries(selectedId);
    } catch (err) { toast.error(err.response?.data?.detail || "Delete nahi hua"); }
  };

  const handleTally = async () => {
    try {
      const res = await api.post(`/api/ledger/${selectedId}/tally`);
      toast.success(`${res.data.locked_count} entries lock ho gayi`);
      setTallyConfirm(false); fetchEntries(selectedId);
    } catch (err) { toast.error(err.response?.data?.detail || "Lock nahi hua"); }
  };

  // ── Memoised computations ─────────────────────────────────────────────────
  const totalNaam = useMemo(
    () => entries.reduce((s, e) => s + (e.naam || 0), 0).toLocaleString("en-IN", { minimumFractionDigits: 2 }),
    [entries]
  );
  const totalJama = useMemo(
    () => entries.reduce((s, e) => s + (e.jama || 0), 0).toLocaleString("en-IN", { minimumFractionDigits: 2 }),
    [entries]
  );
  const balInfo = balLabel(currentBalance);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full" style={{ fontFamily: "'Work Sans', sans-serif" }}>

      <LedgerHeader
        partyInfo={partyInfo} selectedId={selectedId} parties={parties}
        showHeader={showHeader} setShowHeader={setShowHeader}
        showFullAccount={showFullAccount} setShowFullAccount={setShowFullAccount}
        handlePartyChange={handlePartyChange}
        currentBalance={currentBalance} balInfo={balInfo}
        unlocked={unlocked} sharingPdf={sharingPdf}
        handleWhatsAppShare={handleWhatsAppShare} handlePrint={handlePrint}
        handleScreenshot={handleScreenshot} setTallyConfirm={setTallyConfirm}
        entries={entries} totalNaam={totalNaam} totalJama={totalJama}
      />

      {/* No party selected */}
      {!selectedId && (
        <div className="flex-1 flex items-center justify-center" style={{ background: "var(--bg-page)" }}>
          <div className="text-center px-4">
            <BookOpen size={48} className="text-stone-300 mx-auto mb-4" />
            <h2 className="text-xl sm:text-2xl font-semibold text-stone-500 mb-2">Party Select Karein</h2>
            <p className="text-sm sm:text-base text-stone-400">Upar se party choose karein</p>
          </div>
        </div>
      )}

      <LedgerTable
        entries={entries} visibleEntries={visibleEntries} loading={loading} selectedId={selectedId}
        selectedEntries={selectedEntries} focusedRowIdx={focusedRowIdx}
        toggleEntry={toggleEntry} toggleAll={toggleAll} setFocusedRowIdx={setFocusedRowIdx}
        setSelectedEntries={setSelectedEntries}
        setEditEntry={setEditEntry} setEditForm={setEditForm} setDeleteEntry={setDeleteEntry}
        visibleCount={visibleCount} sentinelRef={sentinelRef} tableContainerRef={tableContainerRef}
      />

      <FastEntryPanel
        selectedId={selectedId} parties={parties} fastEntry={fastEntry} setFastEntry={setFastEntry}
        saving={saving} isEntryOpen={isEntryOpen} setIsEntryOpen={setIsEntryOpen} liveTime={liveTime}
        handleSave={handleSave} handleFastPartyChange={handleFastPartyChange} handleFastKeyDown={handleFastKeyDown}
        naamRef={naamRef} jamaRef={jamaRef} narrationRef={narrationRef}
        partySelectRef={partySelectRef} saveRef={saveRef}
        unlocked={unlocked} entries={entries}
      />

      {/* Modals */}
      <EditEntryModal editEntry={editEntry} editForm={editForm} setEditForm={setEditForm}
        setEditEntry={setEditEntry} handleEditSave={handleEditSave} saving={saving} />
      <DeleteConfirmModal deleteEntry={deleteEntry} setDeleteEntry={setDeleteEntry} handleDeleteEntry={handleDeleteEntry} />
      <TallyConfirmModal tallyConfirm={tallyConfirm} setTallyConfirm={setTallyConfirm}
        unlocked={unlocked} balInfo={balInfo} handleTally={handleTally} />
      <WhatsAppModal waModal={waModal} setWaModal={setWaModal}
        waFrom={waFrom} setWaFrom={setWaFrom} waTo={waTo} setWaTo={setWaTo}
        waMode={waMode} setWaMode={setWaMode} handleWaSend={handleWaSend} partyInfo={partyInfo} />
    </div>
  );
};

export default LedgerPage;
