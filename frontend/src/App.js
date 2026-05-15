import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LangProvider } from "@/contexts/LangContext";
import { Toaster } from "sonner";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
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
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TermsAndConditions from "@/pages/TermsAndConditions";

const Layout = ({ children }) => (
  <div className="flex flex-col h-screen overflow-hidden" style={{ background: "var(--bg-page)" }}>
    <Navbar />
    <main className="flex-1 overflow-auto" style={{ background: "var(--bg-page)" }}>{children}</main>
  </div>
);

// Detect if running as installed app (Capacitor Android/iOS or Electron desktop)
// In these contexts, show Login directly — not the marketing landing page
const isInstalledApp = () => {
  // Capacitor native (Android APK / iOS IPA)
  if (window.Capacitor?.isNativePlatform?.()) return true;
  // Electron desktop (loads poketbook.in in a window wrapper)
  if (navigator.userAgent?.includes("Electron")) return true;
  // PWA installed (standalone display mode)
  if (window.matchMedia?.("(display-mode: standalone)")?.matches) return true;
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
          {[0,1,2].map(i => (
            <div key={i} className="w-2 h-2 rounded-full bg-green-400"
              style={{ animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
          ))}
        </div>
        <style>{`@keyframes pulse{0%,100%{opacity:.3;transform:scale(0.8)}50%{opacity:1;transform:scale(1.2)}}`}</style>
      </div>
    </div>
  );
  // App context (Android/iOS/Electron/PWA): go straight to Login, skip landing page
  if (!user) return isInstalledApp() ? <Login /> : <LandingPage />;
  return <Layout><Dashboard /></Layout>;
};

function AppInner() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster richColors position="top-right" duration={1500} />
        <Routes>
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default function App() {
  return <LangProvider><AppInner /></LangProvider>;
}
