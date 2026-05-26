import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LangProvider } from "@/contexts/LangContext";
import { Toaster } from "sonner";
import { useEffect } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import Login from "@/pages/Login";
import LandingPage from "@/pages/LandingPage";
import HowToUsePage from "@/pages/HowToUsePage";
import ContactUsPage from "@/pages/ContactUsPage";
import SuperAdminPage from "@/pages/SuperAdminPage";
import Dashboard from "@/pages/Dashboard";
import PartyManagement from "@/pages/PartyManagement";
import LedgerPage from "@/pages/LedgerPage";
import BalanceSheet from "@/pages/BalanceSheet";
import ExportPage from "@/pages/ExportPage";
import SettingsPage from "@/pages/SettingsPage";
import RecycleBinPage from "@/pages/RecycleBinPage";
import DownloadPage from "@/pages/DownloadPage";
import ExportHistoryPage from "@/pages/ExportHistoryPage";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TermsAndConditions from "@/pages/TermsAndConditions";
import AuthCallbackPage from "@/pages/AuthCallbackPage";
import EmailVerifyPendingPage from "@/pages/EmailVerifyPendingPage";
import VerifyEmailPage from "@/pages/VerifyEmailPage";

const Layout = ({ children }) => (
  <div className="flex flex-col h-screen overflow-hidden" style={{ background: "var(--bg-page)" }}>
    <Navbar />
    <main className="flex-1 overflow-auto" style={{ background: "var(--bg-page)" }}>{children}</main>
    <BottomNav />
  </div>
);

const isInstalledApp = () => {
  try {
    if (window.Capacitor?.isNativePlatform?.()) return true;
    if (navigator.userAgent?.includes("Electron")) return true;
    if (window.matchMedia?.("(display-mode: standalone)")?.matches) return true;
  } catch { return false; }
  return false;
};

const RootRoute = () => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex h-screen items-center justify-center" style={{ background: "#0A0F1E" }}>
      <div className="text-center">
        <img src="/logo.png" alt="PoketBook" className="w-16 h-16 mx-auto mb-4 object-contain animate-bounce" />
        <p className="text-white font-bold text-lg mb-1" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>
          Poket<span style={{ color: "#4ade80" }}>Book</span>
        </p>
        <div className="flex items-center justify-center gap-1 mt-3">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-2 h-2 rounded-full bg-green-400"
              style={{ animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
          ))}
        </div>
        <style>{`@keyframes pulse{0%,100%{opacity:.3;transform:scale(0.8)}50%{opacity:1;transform:scale(1.2)}}`}</style>
      </div>
    </div>
  );
  if (!user) return isInstalledApp() ? <Login /> : <LandingPage />;
  return <Layout><Dashboard /></Layout>;
};

function AppInner() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster richColors position="top-right" duration={1500} />
        <Routes>
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/verify-email-pending" element={<EmailVerifyPendingPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/" element={<RootRoute />} />
          <Route path="/login" element={<Login />} />
          <Route path="/how-to-use" element={<HowToUsePage />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsAndConditions />} />
          <Route path="/contact" element={<ContactUsPage />} />
          <Route path="/superadmin" element={<SuperAdminPage />} />
          <Route path="/parties" element={<ProtectedRoute><Layout><PartyManagement /></Layout></ProtectedRoute>} />
          <Route path="/ledger" element={<ProtectedRoute><Layout><LedgerPage /></Layout></ProtectedRoute>} />
          <Route path="/ledger/:partyId" element={<ProtectedRoute><Layout><LedgerPage /></Layout></ProtectedRoute>} />
          <Route path="/balance-sheet" element={<ProtectedRoute><Layout><BalanceSheet /></Layout></ProtectedRoute>} />
          <Route path="/export" element={<ProtectedRoute><Layout><ExportPage /></Layout></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Layout><SettingsPage /></Layout></ProtectedRoute>} />
          <Route path="/recycle-bin" element={<ProtectedRoute><Layout><RecycleBinPage /></Layout></ProtectedRoute>} />
          <Route path="/download" element={<DownloadPage />} />
          <Route path="/export-history" element={<ProtectedRoute><Layout><ExportHistoryPage /></Layout></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default function App() {
  // Apply saved font settings on load
  useEffect(() => {
    fetch(`${process.env.REACT_APP_BACKEND_URL || ""}/api/superadmin/font-settings`)
      .then(r => r.json())
      .then(d => {
        if (d.font_family) document.documentElement.style.setProperty("--font-body", `${d.font_family}, Arial, sans-serif`);
        if (d.font_family) document.documentElement.style.setProperty("--font-heading", `${d.font_family}, Arial, sans-serif`);
        if (d.font_size) document.documentElement.style.setProperty("--app-font-size", `${d.font_size}px`);
      })
      .catch(() => {});
  }, []);
  return <ErrorBoundary><LangProvider><AppInner /></LangProvider></ErrorBoundary>;
}
