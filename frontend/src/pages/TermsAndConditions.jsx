import { Link } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft, FileText } from "lucide-react";

const LOGO = "/logo.png";

export default function TermsAndConditions() {
  useEffect(() => {
    document.title = "Terms & Conditions — PoketBook | poketbook.in";
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
          <FileText size={28} color="#4ade80" />
          <h1 style={{ fontSize: "32px", fontWeight: 800, color: "#fff", margin: 0 }}>Terms & Conditions</h1>
        </div>
        <p style={{ color: "#64748b", fontSize: "14px", marginBottom: "40px" }}>
          Last updated: May 1, 2026 &nbsp;|&nbsp; Effective date: May 1, 2026
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>

          <Section title="1. Acceptance of Terms">
            <p>By accessing or using PoketBook ("Service"), you agree to be bound by these Terms and Conditions ("Terms"). If you disagree with any part of these Terms, you may not use our Service.</p>
            <p>These Terms apply to all users of PoketBook, including visitors, registered users, and businesses. PoketBook is operated by <strong>Flutter Fox</strong>, New Delhi, India.</p>
          </Section>

          <Section title="2. Description of Service">
            <p>PoketBook is a digital ledger and accounting application that provides:</p>
            <ul>
              <li>Double-entry party-based ledger management (Naam/Jama)</li>
              <li>Balance sheet generation (Dena Hai / Lena Hai)</li>
              <li>PDF and Excel export of statements</li>
              <li>Google Sheets and Gmail backup integration</li>
              <li>Mobile apps (Android APK/AAB) built with Capacitor</li>
            </ul>
            <p>The Service is designed for small and medium businesses in India. It is <strong>not</strong> a licensed financial advisory service and does not provide tax, legal, or certified accounting services.</p>
          </Section>

          <Section title="3. User Accounts">
            <Subsection title="3.1 Registration">
              <p>You must provide accurate, current, and complete information during registration. You are responsible for maintaining the confidentiality of your password and for all activities that occur under your account.</p>
            </Subsection>
            <Subsection title="3.2 Account Security">
              <p>You agree to notify us immediately at <a href="mailto:Solution@poketbook.in" style={{ color: "#4ade80" }}>Solution@poketbook.in</a> of any unauthorized use of your account. We are not liable for any loss resulting from unauthorized use of your credentials.</p>
            </Subsection>
            <Subsection title="3.3 Account Termination">
              <p>We reserve the right to suspend or terminate your account at any time if you violate these Terms, engage in fraudulent activity, or misuse the Service.</p>
            </Subsection>
          </Section>

          <Section title="4. Subscription & Billing">
            <Subsection title="4.1 Trial Period">
              <p>New users receive a <strong>7-day FREE trial</strong> with full access to all features. No payment information is required to start the trial.</p>
            </Subsection>
            <Subsection title="4.2 Paid Plans">
              <p>After the trial, you may choose from:</p>
              <ul>
                <li><strong>Weekly:</strong> ₹129 / 7 days</li>
                <li><strong>Monthly:</strong> ₹499 / 30 days</li>
                <li><strong>Yearly:</strong> ₹5,799 / 365 days</li>
              </ul>
            </Subsection>
            <Subsection title="4.3 Refund Policy">
              <p>Subscriptions are non-refundable once activated, except where required by applicable Indian law. If you experience technical issues preventing use of the Service, contact us within 7 days of purchase for a review.</p>
            </Subsection>
            <Subsection title="4.4 Price Changes">
              <p>We reserve the right to change subscription prices with 30 days' notice. Existing subscriptions will continue at the price locked in at the time of purchase until renewal.</p>
            </Subsection>
          </Section>

          <Section title="5. Acceptable Use">
            <p>You agree <strong>not</strong> to:</p>
            <ul>
              <li>Use the Service for any illegal purpose or in violation of Indian law</li>
              <li>Enter false, misleading, or defamatory information</li>
              <li>Attempt to reverse-engineer, decompile, or extract source code</li>
              <li>Use automated tools (bots, scrapers) to access the Service</li>
              <li>Share your account credentials with unauthorized persons</li>
              <li>Overload our servers with excessive API requests</li>
              <li>Use the Service to facilitate money laundering, fraud, or tax evasion</li>
            </ul>
          </Section>

          <Section title="6. Data Ownership">
            <p>You retain full ownership of all business data (ledger entries, party names, transactions) you enter into PoketBook. We claim no ownership over your data.</p>
            <p>You grant us a limited, non-exclusive license to store and process your data solely for the purpose of providing the Service.</p>
            <p>You are responsible for ensuring that party data you enter (including third-party names and phone numbers) complies with applicable privacy laws, including the Information Technology Act, 2000 and the Digital Personal Data Protection Act, 2023 (India).</p>
          </Section>

          <Section title="7. Google Integration">
            <p>If you connect Google Sheets or Gmail, you authorize PoketBook to:</p>
            <ul>
              <li>Create and write to a spreadsheet in your Google Drive for backup purposes</li>
              <li>Send emails on your behalf for backup delivery</li>
            </ul>
            <p>You may revoke this access at any time from your Google Account → Security → Third-party apps. Revoking access will disable the backup feature but will not affect your PoketBook data.</p>
          </Section>

          <Section title="8. Disclaimer of Warranties">
            <p>The Service is provided <strong>"as is"</strong> and <strong>"as available"</strong> without any warranties of any kind, express or implied, including but not limited to implied warranties of merchantability, fitness for a particular purpose, or non-infringement.</p>
            <p>We do not warrant that the Service will be uninterrupted, error-free, or completely secure. Accounting decisions made based on PoketBook data are your sole responsibility.</p>
          </Section>

          <Section title="9. Limitation of Liability">
            <p>To the maximum extent permitted by applicable law, Flutter Fox shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, goodwill, or business interruption, arising from your use of or inability to use the Service.</p>
            <p>Our total liability to you for any claims under these Terms shall not exceed the amount you paid us in the 3 months preceding the claim.</p>
          </Section>

          <Section title="10. Indemnification">
            <p>You agree to indemnify and hold harmless Flutter Fox, its directors, employees, and agents from and against any claims, damages, obligations, losses, liabilities, costs, or debt arising from your use of the Service or your violation of these Terms.</p>
          </Section>

          <Section title="11. Governing Law & Disputes">
            <p>These Terms shall be governed by and construed in accordance with the laws of <strong>India</strong>. Any disputes arising from these Terms shall be subject to the exclusive jurisdiction of the courts of <strong>New Delhi, India</strong>.</p>
            <p>Before initiating legal proceedings, both parties agree to attempt good-faith resolution through direct negotiation for a period of 30 days.</p>
          </Section>

          <Section title="12. Modifications">
            <p>We reserve the right to modify these Terms at any time. We will notify registered users by email and/or by posting a notice on the app. Your continued use of the Service after any modification constitutes acceptance of the new Terms.</p>
          </Section>

          <Section title="13. Contact">
            <p>For questions about these Terms:</p>
            <ul>
              <li><strong>Email:</strong> <a href="mailto:Solution@poketbook.in" style={{ color: "#4ade80" }}>Solution@poketbook.in</a></li>
              <li><strong>Phone:</strong> <a href="tel:+918130095013" style={{ color: "#4ade80" }}>+91 81300 95013</a></li>
              <li><strong>Address:</strong> Flutter Fox, New Delhi, India — 110001</li>
            </ul>
          </Section>

        </div>

        {/* Footer note */}
        <div style={{ marginTop: "48px", paddingTop: "24px", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", gap: "16px", flexWrap: "wrap" }}>
          <Link to="/privacy" style={{ color: "#4ade80", fontSize: "14px", textDecoration: "none" }}>Privacy Policy</Link>
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
