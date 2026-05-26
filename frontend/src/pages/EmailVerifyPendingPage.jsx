import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { api } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Mail, RefreshCw, CheckCircle } from "lucide-react";

export default function EmailVerifyPendingPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const email = params.get("email") || "";
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  const handleResend = async () => {
    setResending(true);
    try {
      await api.post("/api/auth/resend-verification");
      setResent(true);
      toast.success("Verification email sent! Check your inbox.", { duration: 4000 });
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to resend. Please try again.", { duration: 3000 });
    } finally {
      setResending(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0A1628 0%, #0D2040 50%, #112B52 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "20px", fontFamily: "'IBM Plex Sans', sans-serif",
    }}>
      <div style={{
        background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: "20px", padding: "44px 36px", maxWidth: "420px", width: "100%",
        textAlign: "center", backdropFilter: "blur(20px)",
      }}>
        {/* Icon */}
        <div style={{
          width: "72px", height: "72px", borderRadius: "50%",
          background: "linear-gradient(135deg, #1E3A5F, #2563EB)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 24px",
        }}>
          <Mail size={32} color="#fff" />
        </div>

        <h1 style={{ color: "#fff", fontSize: "22px", fontWeight: 800, margin: "0 0 10px" }}>
          Verify your email
        </h1>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px", lineHeight: "1.6", margin: "0 0 8px" }}>
          We sent a verification link to
        </p>
        {email && (
          <p style={{ color: "#60A5FA", fontSize: "15px", fontWeight: 700, margin: "0 0 20px", wordBreak: "break-all" }}>
            {email}
          </p>
        )}
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", lineHeight: "1.6", margin: "0 0 32px" }}>
          Click the link in that email to activate your PoketBook account. Check your spam folder if you don't see it.
        </p>

        {/* Resend button */}
        <button
          onClick={handleResend}
          disabled={resending || resent}
          data-testid="resend-verification-btn"
          style={{
            width: "100%", padding: "13px 24px", borderRadius: "10px", border: "none",
            background: resent ? "#16A34A" : "linear-gradient(135deg, #1E3A5F, #2563EB)",
            color: "#fff", fontSize: "15px", fontWeight: 700, cursor: resending || resent ? "default" : "pointer",
            opacity: resending ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
            marginBottom: "16px",
          }}
        >
          {resent ? (
            <><CheckCircle size={16} /> Email Sent Again</>
          ) : resending ? (
            <><RefreshCw size={16} className="animate-spin" /> Sending...</>
          ) : (
            <><RefreshCw size={16} /> Resend Verification Email</>
          )}
        </button>

        {/* Back to login */}
        <button
          onClick={() => navigate("/login")}
          data-testid="back-to-login-btn"
          style={{
            background: "transparent", border: "1px solid rgba(255,255,255,0.2)",
            color: "rgba(255,255,255,0.6)", borderRadius: "10px", padding: "11px 24px",
            fontSize: "14px", cursor: "pointer", width: "100%",
          }}
        >
          Back to Login
        </button>

        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "12px", marginTop: "24px" }}>
          PoketBook — Powered by Flutter Fox
        </p>
      </div>
    </div>
  );
}
