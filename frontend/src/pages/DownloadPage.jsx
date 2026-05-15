import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Smartphone, Monitor, Globe, Download, CheckCircle, Lock } from "lucide-react";

const LOGO = "/logo.png";

const DOWNLOADS = [
  {
    id: "android",
    icon: Smartphone,
    title: "Android App",
    subtitle: "APK — Direct Install",
    desc: "Download and install directly on your Android phone. No Play Store needed.",
    badge: "v1.1.0",
    color: "#22C55E",
    bg: "#F0FDF4",
    border: "#86EFAC",
    downloadUrl: "https://github.com/flutterfoxin-sudo/poketbook-build-app/releases/latest",
    requiresAuth: true,
  },
  {
    id: "windows",
    icon: Monitor,
    title: "Windows Desktop",
    subtitle: "Setup .exe — Installer",
    desc: "Full desktop app for Windows 10/11. Works faster with keyboard shortcuts.",
    badge: "v1.1.0",
    color: "#3B82F6",
    bg: "#EFF6FF",
    border: "#93C5FD",
    downloadUrl: "https://github.com/flutterfoxin-sudo/poketbook-build-app/releases/latest",
    requiresAuth: true,
  },
  {
    id: "pwa",
    icon: Globe,
    title: "Install as App (PWA)",
    subtitle: "Chrome / Safari — No download",
    desc: 'In Chrome: click the install icon in address bar. Works on any device instantly.',
    badge: "Free",
    color: "#8B5CF6",
    bg: "#F5F3FF",
    border: "#C4B5FD",
    downloadUrl: null,
    requiresAuth: false,
  },
];

export default function DownloadPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async (item) => {
    if (item.requiresAuth && !user) {
      navigate("/login?redirect=/download");
      return;
    }
    if (!item.downloadUrl) {
      // PWA install instructions
      alert('To install as PWA:\n1. Open poketbook.in in Chrome\n2. Click the "⊕" icon in the address bar\n3. Click "Install"\n\nOr on iPhone: Share → Add to Home Screen');
      return;
    }
    setDownloading(true);
    setTimeout(() => {
      window.open(item.downloadUrl, "_blank");
      setDownloading(false);
      setSelected(null);
    }, 800);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#050A14", fontFamily: "'Work Sans', sans-serif", color: "#e2e8f0" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #0A1628 0%, #1a2a4a 100%)", padding: "40px 24px 32px", textAlign: "center" }}>
        <img src={LOGO} alt="PoketBook" style={{ width: 64, height: 64, objectFit: "contain", marginBottom: 16 }} />
        <h1 style={{ fontSize: "28px", fontWeight: 800, margin: "0 0 8px", fontFamily: "'IBM Plex Sans', sans-serif" }}>
          Download <span style={{ color: "#4ade80" }}>PoketBook</span>
        </h1>
        <p style={{ color: "#94a3b8", fontSize: "14px", margin: 0 }}>
          Available on Android, Windows, and as a Web App
        </p>
      </div>

      <div style={{ maxWidth: "480px", margin: "0 auto", padding: "24px 16px 80px" }}>

        {/* Auth status */}
        {user ? (
          <div style={{ background: "#DCFCE7", border: "1px solid #86EFAC", borderRadius: "10px", padding: "10px 16px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
            <CheckCircle size={16} color="#16A34A" />
            <span style={{ fontSize: "13px", color: "#166534", fontWeight: 600 }}>
              Logged in as {user.name} — downloads available
            </span>
          </div>
        ) : (
          <div style={{ background: "#FEF3C7", border: "1px solid #F59E0B", borderRadius: "10px", padding: "10px 16px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Lock size={16} color="#B45309" />
            <span style={{ fontSize: "13px", color: "#92400E" }}>
              <Link to="/login?redirect=/download" style={{ fontWeight: 700, color: "#B45309" }}>Login</Link> to download Android & Windows apps
            </span>
          </div>
        )}

        {/* Download cards */}
        {DOWNLOADS.map((item) => {
          const Icon = item.icon;
          const isSelected = selected === item.id;
          return (
            <div key={item.id}
              onClick={() => setSelected(isSelected ? null : item.id)}
              style={{
                background: isSelected ? item.bg : "#111827",
                border: `2px solid ${isSelected ? item.border : "rgba(255,255,255,0.08)"}`,
                borderRadius: "16px", padding: "20px", marginBottom: "12px",
                cursor: "pointer", transition: "all 0.2s",
              }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
                <div style={{ width: 44, height: 44, borderRadius: "12px", background: item.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon size={22} color="#fff" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <span style={{ fontSize: "16px", fontWeight: 700, color: isSelected ? "#111" : "#fff" }}>{item.title}</span>
                    <span style={{ fontSize: "11px", background: item.color, color: "#fff", padding: "2px 8px", borderRadius: "20px", fontWeight: 700 }}>{item.badge}</span>
                  </div>
                  <p style={{ fontSize: "12px", color: isSelected ? "#555" : "#94a3b8", margin: "0 0 4px" }}>{item.subtitle}</p>
                  <p style={{ fontSize: "12px", color: isSelected ? "#333" : "#64748b", margin: 0 }}>{item.desc}</p>
                </div>
              </div>

              {isSelected && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleDownload(item); }}
                  disabled={downloading || (item.requiresAuth && !user)}
                  style={{
                    width: "100%", marginTop: "14px", background: item.requiresAuth && !user ? "#9CA3AF" : item.color,
                    border: "none", borderRadius: "10px", padding: "12px", color: "#fff",
                    fontSize: "15px", fontWeight: 700, cursor: item.requiresAuth && !user ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "8px"
                  }}>
                  {downloading ? "Starting download..." :
                   item.requiresAuth && !user ? <><Lock size={14} /> Login to Download</> :
                   item.id === "pwa" ? "View Install Guide" :
                   <><Download size={14} /> Download Now</>}
                </button>
              )}
            </div>
          );
        })}

        <p style={{ textAlign: "center", fontSize: "12px", color: "#475569", marginTop: "24px" }}>
          All apps connect to your PoketBook account at poketbook.in<br />
          Your data syncs automatically across all devices.
        </p>
      </div>
    </div>
  );
}
