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
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TermsAndConditions from "@/pages/TermsAndConditions";

const Layout = ({ children }) => (
  <div className="flex flex-col h-screen overflow-hidden" style={{ background: "var(--bg-page)" }}>
    <Navbar />
    <main className="flex-1 overflow-auto" style={{ background: "var(--bg-page)" }}>{children}</main>
  </div>
);

const RootRoute = () => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex h-screen items-center justify-center" style={{ background: "#0A0F1E" }}>
      <div className="text-center">
        <img src="/logo.png" alt="PoketBook" className="w-16 h-16 mx-auto mb-3 object-contain" />
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    </div>
  );
  if (!user) return <LandingPage />;
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default function App() {
  return <LangProvider><AppInner /></LangProvider>;
}
