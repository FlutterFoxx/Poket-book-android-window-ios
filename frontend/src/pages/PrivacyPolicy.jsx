import { Link } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft, Shield } from "lucide-react";

const LOGO = "/logo.png";

export default function PrivacyPolicy() {
  useEffect(() => {
    document.title = "Privacy Policy — PoketBook | poketbook.in";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "PoketBook Privacy Policy — How we collect, use, and protect your data. Google Sheets & Gmail backup permissions explained. Contact: Solution@poketbook.in");
  }, []);
  return (
    <div style={{ minHeight: "100vh", background: "#050A14", color: "#e2e8f0", fontFamily: "'Work Sans', sans-serif" }}>
      {/* Header */}
      <header style={{ background: "#0A1628", borderBottom: "1px solid rgba(255,255,255,0.08)", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <img src={LOGO} alt="PoketBook" style={{ width: 32, height: 32, objectFit: "contain" }} />
          <span style={{ fontWeight: 800, fontSize: "16px" }}>Poket<span style={{ color: "#4ade80" }}>Book</span></span>
        </div>
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: "6px", color: "#94a3b8", fontSize: "14px", textDecoration: "none" }}>
          <ArrowLeft size={14} /> Back to Home
        </Link>
      </header>

      <div style={{ maxWidth: "780px", margin: "0 auto", padding: "48px 24px 80px" }}>
        {/* Title */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
          <Shield size={28} color="#4ade80" />
          <h1 style={{ fontSize: "32px", fontWeight: 800, color: "#fff", margin: 0 }}>Privacy Policy</h1>
        </div>
        <p style={{ color: "#64748b", fontSize: "14px", marginBottom: "40px" }}>
          Last updated: May 1, 2026 &nbsp;|&nbsp; Effective date: May 1, 2026
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>

          <Section title="1. Introduction">
            <p>PoketBook ("we," "our," or "us") is a digital ledger and accounting application developed by <strong>Flutter Fox</strong>, based in New Delhi, India. This Privacy Policy explains how we collect, use, store, and protect your information when you use our web application and mobile apps available at <strong>poketbook.in</strong>.</p>
            <p>By using PoketBook, you agree to the collection and use of information in accordance with this policy. If you do not agree, please do not use our service.</p>
          </Section>

          <Section title="2. Information We Collect">
            <Subsection title="2.1 Account Information">
              <p>When you register, we collect: your name, email address, and a hashed password. We never store your plain-text password.</p>
            </Subsection>
            <Subsection title="2.2 Business Data">
              <p>Your ledger entries, party names, phone numbers, addresses, transaction amounts, narrations, and balance data are stored securely in our database. This data belongs to you and is used solely to provide the service.</p>
            </Subsection>
            <Subsection title="2.3 Google Account Data (Optional)">
              <p>If you connect Google Sheets or Gmail for backup, we request OAuth permissions for:</p>
              <ul>
                <li>Google Sheets (read/write to your own spreadsheets)</li>
                <li>Gmail (send backup emails from your account)</li>
                <li>Your basic profile (name, email for identification)</li>
              </ul>
              <p>We store only the OAuth access/refresh tokens. We never read, modify, or share your Google Drive data beyond the backup spreadsheet you authorize.</p>
            </Subsection>
            <Subsection title="2.4 Usage Data">
              <p>We may collect anonymized usage logs (page visits, feature usage counts) to improve the application. No personally identifiable information is included in these logs.</p>
            </Subsection>
          </Section>

          <Section title="3. How We Use Your Information">
            <ul>
              <li>To provide and maintain the PoketBook service</li>
              <li>To authenticate your account and secure your data</li>
              <li>To sync your ledger data to Google Sheets or send backup emails (only when you explicitly enable this)</li>
              <li>To send transactional notifications (OTP, account alerts)</li>
              <li>To improve our product based on aggregated, anonymized usage patterns</li>
              <li>To comply with legal obligations</li>
            </ul>
            <p>We do <strong>not</strong> sell, rent, or trade your personal information to third parties.</p>
          </Section>

          <Section title="4. Data Storage & Security">
            <p>Your data is stored on secure servers in India. We use:</p>
            <ul>
              <li>MongoDB with authentication for database storage</li>
              <li>JWT tokens (HTTPS-only) for session authentication</li>
              <li>bcrypt hashing for all passwords</li>
              <li>TLS/SSL encryption for all data in transit</li>
            </ul>
            <p>While we take all reasonable precautions, no system is 100% secure. We encourage you to use a strong, unique password.</p>
          </Section>

          <Section title="5. Data Retention">
            <p>We retain your account and business data for as long as your account is active. You may request deletion of your account and all associated data at any time by emailing <a href="mailto:Solution@poketbook.in" style={{ color: "#4ade80" }}>Solution@poketbook.in</a>. Deletion is processed within 30 days.</p>
          </Section>

          <Section title="6. Third-Party Services">
            <p>PoketBook integrates with the following third-party services:</p>
            <ul>
              <li><strong>Google APIs</strong> — for Sheets/Gmail backup (governed by <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: "#4ade80" }}>Google Privacy Policy</a>)</li>
              <li><strong>MSG91</strong> — for SMS OTP verification (governed by MSG91's privacy policy)</li>
            </ul>
            <p>We are not responsible for the privacy practices of these third parties.</p>
          </Section>

          <Section title="7. Your Rights">
            <p>You have the right to:</p>
            <ul>
              <li>Access the personal data we hold about you</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Revoke Google OAuth permissions at any time via your Google Account settings</li>
              <li>Export your data (available via the CSV backup feature)</li>
            </ul>
            <p>To exercise any of these rights, contact us at <a href="mailto:Solution@poketbook.in" style={{ color: "#4ade80" }}>Solution@poketbook.in</a>.</p>
          </Section>

          <Section title="8. Children's Privacy">
            <p>PoketBook is not intended for use by persons under the age of 18. We do not knowingly collect personal data from children. If you believe a child has provided us with personal information, please contact us immediately.</p>
          </Section>

          <Section title="9. Changes to This Policy">
            <p>We may update this Privacy Policy from time to time. We will notify you of any material changes by updating the "Last updated" date at the top of this page and, where appropriate, by email. Your continued use of PoketBook after changes constitutes acceptance of the updated policy.</p>
          </Section>

          <Section title="10. Contact Us">
            <p>For privacy-related questions or concerns:</p>
            <ul>
              <li><strong>Email:</strong> <a href="mailto:Solution@poketbook.in" style={{ color: "#4ade80" }}>Solution@poketbook.in</a></li>
              <li><strong>Phone:</strong> <a href="tel:+918130095013" style={{ color: "#4ade80" }}>+91 81300 95013</a></li>
              <li><strong>Address:</strong> Flutter Fox, New Delhi, India — 110001</li>
            </ul>
          </Section>

        </div>

        {/* Footer note */}
        <div style={{ marginTop: "48px", paddingTop: "24px", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", gap: "16px", flexWrap: "wrap" }}>
          <Link to="/terms" style={{ color: "#4ade80", fontSize: "14px", textDecoration: "none" }}>Terms & Conditions</Link>
          <span style={{ color: "#334155" }}>|</span>
          <Link to="/" style={{ color: "#94a3b8", fontSize: "14px", textDecoration: "none" }}>Back to PoketBook</Link>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#f1f5f9", marginBottom: "12px", paddingBottom: "8px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>{title}</h2>
      <div style={{ color: "#94a3b8", fontSize: "15px", lineHeight: "1.75", display: "flex", flexDirection: "column", gap: "10px" }}>
        {children}
      </div>
    </div>
  );
}

function Subsection({ title, children }) {
  return (
    <div>
      <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#cbd5e1", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{title}</h3>
      <div style={{ color: "#94a3b8", fontSize: "15px", lineHeight: "1.75" }}>{children}</div>
    </div>
  );
}
