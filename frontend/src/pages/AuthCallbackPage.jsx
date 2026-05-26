import { useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, api } from "@/contexts/AuthContext";

// Handles Google OAuth callback for PoketBook's own Google login
// URL hash format: #token=ACCESS_TOKEN&refresh_token=REFRESH_TOKEN
export default function AuthCallbackPage() {
  const hasProcessed = useRef(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const hash = window.location.hash.substring(1); // remove leading #
    if (!hash) { navigate("/login"); return; }

    const params = new URLSearchParams(hash);
    const token = params.get("token");
    const refreshToken = params.get("refresh_token");

    if (!token) { navigate("/login"); return; }

    // Store tokens
    try { localStorage.setItem("access_token", token); sessionStorage.setItem("access_token", token); } catch {}
    try { if (refreshToken) { localStorage.setItem("refresh_token", refreshToken); sessionStorage.setItem("refresh_token", refreshToken); } } catch {}

    // Fetch full user profile then redirect
    api.get("/api/auth/me")
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
