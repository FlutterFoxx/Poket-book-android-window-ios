import { Component } from "react";

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    if (process.env.NODE_ENV === "development") {
      console.error("PoketBook crashed:", error, info);
    }
  }

  render() {
    if (this.state.hasError) {
      const isDev = process.env.NODE_ENV === "development";
      const errMsg = this.state.error?.toString() || "Unknown error";
      return (
        <div style={{
          minHeight: "100vh", background: "#0A0F1E", display: "flex",
          alignItems: "center", justifyContent: "center", padding: "20px",
          fontFamily: "'Work Sans', sans-serif"
        }}>
          <div style={{ textAlign: "center", maxWidth: "340px" }}>
            <img src="/logo.png" alt="PoketBook" style={{ width: 64, height: 64, objectFit: "contain", margin: "0 auto 16px", display: "block" }} />
            <h2 style={{ color: "#fff", fontSize: "18px", fontWeight: 700, margin: "0 0 8px" }}>App could not load</h2>
            {/* Show error details to help diagnose — remove after fix */}
            <div style={{ background: "#1e293b", border: "1px solid #ef4444", borderRadius: "8px", padding: "10px", margin: "0 0 16px", textAlign: "left" }}>
              <p style={{ color: "#fca5a5", fontSize: "11px", fontFamily: "monospace", wordBreak: "break-all", margin: 0 }}>
                {errMsg.slice(0, 300)}
              </p>
            </div>
            <button
              onClick={() => {
                if ('caches' in window) {
                  caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k)))).then(() => window.location.reload(true));
                } else { window.location.reload(true); }
              }}
              style={{
                background: "#22C55E", color: "#000", border: "none", borderRadius: "10px",
                padding: "12px 24px", fontSize: "14px", fontWeight: 700, cursor: "pointer",
                display: "block", width: "100%", marginBottom: "8px"
              }}>
              Clear Cache &amp; Reload
            </button>
            <button
              onClick={() => this.setState({ hasError: false })}
              style={{
                background: "transparent", color: "#64748b", border: "1px solid #334155",
                borderRadius: "10px", padding: "10px 24px", fontSize: "13px",
                cursor: "pointer", display: "block", width: "100%"
              }}>
              Try Again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
