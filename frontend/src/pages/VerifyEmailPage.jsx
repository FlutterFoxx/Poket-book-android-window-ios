import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { api } from "@/contexts/AuthContext";
import { useAuth } from "@/contexts/AuthContext";
import { CheckCircle, XCircle, Loader } from "lucide-react";

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const token = params.get("token");
  const [status, setStatus] = useState("loading"); // loading | success | error
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Invalid verification link. Please request a new one.");
      return;
    }
    api.get(`/api/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then((res) => {
        setStatus("success");
        setMessage(res.data.message || "Email verified successfully!");
        // Update the user's email_verified flag in context if logged in
        if (user && user !== false) {
          login({ ...user, email_verified: true });
        }
        // Redirect to dashboard after 2.5s
        setTimeout(() => navigate("/"), 2500);
      })
      .catch((err) => {
        setStatus("error");
        setMessage(err?.response?.data?.detail || "Verification failed. The link may have expired.");
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0A1628 0%, #0D2040 50%, #112B52 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "20px", fontFamily: "'IBM Plex Sans', sans-serif",
    }}>
      <div style={{
        background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: "20px", padding: "48px 36px", maxWidth: "420px", width: "100%",
        textAlign: "center", backdropFilter: "blur(20px)",
      }}>
        {status === "loading" && (
          <>
            <div style={{
              width: "72px", height: "72px", borderRadius: "50%",
              background: "linear-gradient(135deg, #1E3A5F, #2563EB)",
              display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px",
            }}>
              <Loader size={32} color="#fff" className="animate-spin" />
            </div>
            <h1 style={{ color: "#fff", fontSize: "22px", fontWeight: 800, margin: "0 0 12px" }}>
              Verifying your email...
            </h1>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px" }}>Please wait a moment.</p>
          </>
        )}

        {status === "success" && (
          <>
            <div style={{
              width: "72px", height: "72px", borderRadius: "50%",
              background: "#16A34A", display: "flex", alignItems: "center",
              justifyContent: "center", margin: "0 auto 24px",
            }}>
              <CheckCircle size={36} color="#fff" />
            </div>
            <h1 style={{ color: "#fff", fontSize: "22px", fontWeight: 800, margin: "0 0 12px" }} data-testid="verify-success-msg">
              Email Verified!
            </h1>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px", marginBottom: "32px" }}>
              {message} Redirecting to your dashboard...
            </p>
            <button
              onClick={() => navigate("/")}
              data-testid="go-to-dashboard-btn"
              style={{
                background: "#16A34A", color: "#fff", border: "none",
                borderRadius: "10px", padding: "13px 32px",
                fontSize: "15px", fontWeight: 700, cursor: "pointer", width: "100%",
              }}
            >
              Go to Dashboard
            </button>
          </>
        )}

        {status === "error" && (
          <>
            <div style={{
              width: "72px", height: "72px", borderRadius: "50%",
              background: "#DC2626", display: "flex", alignItems: "center",
              justifyContent: "center", margin: "0 auto 24px",
            }}>
              <XCircle size={36} color="#fff" />
            </div>
            <h1 style={{ color: "#fff", fontSize: "22px", fontWeight: 800, margin: "0 0 12px" }} data-testid="verify-error-msg">
              Verification Failed
            </h1>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px", marginBottom: "32px", lineHeight: "1.6" }}>
              {message}
            </p>
            <button
              onClick={() => navigate("/login")}
              data-testid="back-to-login-btn-verify"
              style={{
                background: "linear-gradient(135deg, #1E3A5F, #2563EB)", color: "#fff", border: "none",
                borderRadius: "10px", padding: "13px 32px",
                fontSize: "15px", fontWeight: 700, cursor: "pointer", width: "100%", marginBottom: "12px",
              }}
            >
              Back to Login
            </button>
            <button
              onClick={() => navigate("/verify-email-pending")}
              style={{
                background: "transparent", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: "10px", padding: "11px 32px",
                fontSize: "14px", cursor: "pointer", width: "100%",
              }}
            >
              Request New Verification Email
            </button>
          </>
        )}

        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "12px", marginTop: "28px" }}>
          PoketBook — Powered by Flutter Fox
        </p>
      </div>
    </div>
  );
}
