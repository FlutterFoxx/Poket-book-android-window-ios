import { useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, api } from "@/contexts/AuthContext";

// REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
export default function AuthCallbackPage() {
  const hasProcessed = useRef(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const hash = window.location.hash;
    const match = hash.match(/session_id=([^&]+)/);
    if (!match) { navigate("/"); return; }

    const session_id = match[1];
    api.post("/api/auth/google", { session_id })
      .then(res => { login(res.data); navigate("/"); })
      .catch(() => navigate("/login"));
  }, []); // eslint-disable-line

  return (
    <div style={{ minHeight: "100vh", background: "#0A0F1E", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <img src="/logo.png" alt="PoketBook" style={{ width: 64, height: 64, objectFit: "contain", margin: "0 auto 16px", display: "block" }} className="animate-bounce" />
        <p style={{ color: "#fff", fontSize: "14px" }}>Logging in with Google...</p>
      </div>
    </div>
  );
}
