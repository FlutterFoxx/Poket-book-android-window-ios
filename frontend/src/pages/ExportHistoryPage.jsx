import { useState, useEffect } from "react";
import { getExportHistory } from "@/utils/androidExport";
import { FileText, Image, Download, Share2, CheckCircle, XCircle, Trash2, Clock } from "lucide-react";

export default function ExportHistoryPage() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    setHistory(getExportHistory());
  }, []);

  const clear = () => {
    localStorage.removeItem("pk_export_history");
    setHistory([]);
  };

  const extIcon = (fileName = "") => {
    const ext = fileName.split(".").pop().toLowerCase();
    if (["png", "jpg", "jpeg"].includes(ext)) return <Image size={18} color="#0891B2" />;
    if (ext === "pdf") return <FileText size={18} color="#B91C1C" />;
    return <Download size={18} color="#166534" />;
  };

  const methodLabel = (method) => ({
    gallery: "Saved to Gallery",
    downloads: "Saved to Downloads",
    native_share: "Shared via Native",
    web_share: "Shared via Browser",
    download: "Downloaded",
  }[method] || method || "—");

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-page)" }}>
      <div style={{ background: "var(--primary-gradient)", padding: "16px", color: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontSize: "18px", fontWeight: 700, margin: 0 }}>Export History</h1>
            <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)", margin: "2px 0 0" }}>
              Verify your downloaded files
            </p>
          </div>
          {history.length > 0 && (
            <button onClick={clear} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "8px", padding: "8px 12px", color: "#fff", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
              <Trash2 size={12} /> Clear
            </button>
          )}
        </div>
      </div>

      <div style={{ padding: "12px", maxWidth: "600px", margin: "0 auto" }}>
        {history.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 20px", color: "var(--text-tertiary)" }}>
            <Download size={48} style={{ margin: "0 auto 16px", display: "block", opacity: 0.3 }} />
            <p style={{ fontSize: "15px", fontWeight: 600 }}>No exports yet</p>
            <p style={{ fontSize: "13px", margin: "4px 0 0" }}>PDF, Excel and Screenshot exports will appear here</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {history.map((item, i) => (
              <div key={item.timestamp ? `${item.timestamp}-${i}` : `export-${i}`} className="pk-card" style={{ padding: "12px 14px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                  <div style={{ marginTop: "2px", flexShrink: 0 }}>{extIcon(item.fileName)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "14px", fontWeight: 700, margin: 0, wordBreak: "break-all", color: "var(--text-primary)" }}>
                      {item.fileName || "Unknown file"}
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px", flexWrap: "wrap" }}>
                      {item.success ? (
                        <span style={{ display: "flex", alignItems: "center", gap: "3px", fontSize: "11px", color: "#16A34A", fontWeight: 600 }}>
                          <CheckCircle size={11} /> {methodLabel(item.method)}
                        </span>
                      ) : (
                        <span style={{ display: "flex", alignItems: "center", gap: "3px", fontSize: "11px", color: "#DC2626", fontWeight: 600 }}>
                          <XCircle size={11} /> Failed: {item.error || "unknown"}
                        </span>
                      )}
                      {item.sizeMB && <span style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>{item.sizeMB}</span>}
                    </div>
                    {item.path && (
                      <p style={{ fontSize: "11px", color: "var(--text-tertiary)", margin: "3px 0 0", wordBreak: "break-all" }}>
                        Path: {item.path}
                      </p>
                    )}
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "4px" }}>
                      <Clock size={10} color="var(--text-tertiary)" />
                      <span style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>
                        {new Date(item.timestamp).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                  <div style={{ flexShrink: 0 }}>
                    {item.success ? <CheckCircle size={16} color="#22C55E" /> : <XCircle size={16} color="#EF4444" />}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
