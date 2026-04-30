import { Link } from "react-router-dom";
import { IndianRupee, Mail, Phone, MapPin, MessageCircle, Send, ExternalLink } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const ContactUsPage = () => {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });

  const handleSubmit = (e) => {
    e.preventDefault();
    const mailtoLink = `mailto:Solution@poketbook.in?subject=${encodeURIComponent(form.subject || "Support Request from " + form.name)}&body=${encodeURIComponent(`Name: ${form.name}\nEmail: ${form.email}\n\n${form.message}`)}`;
    window.open(mailtoLink, "_blank");
    toast.success("Email client open ho raha hai!");
  };

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Work Sans', sans-serif" }}>
      {/* Nav */}
      <nav style={{ background: "var(--primary-gradient)" }} className="text-white sticky top-0 z-50 shadow-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-white/20 rounded flex items-center justify-center">
              <IndianRupee size={15} className="text-white" />
            </div>
            <span className="font-bold text-lg" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>poketbook</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/how-to-use" className="text-sm text-red-200 hover:text-white transition-colors hidden sm:inline">How to Use</Link>
            <Link to="/login" className="bg-white text-red-700 px-4 py-1.5 rounded text-sm font-bold hover:bg-red-50 transition-colors">Login</Link>
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className="text-white py-14 px-4 text-center" style={{ background: "var(--primary-gradient)" }}>
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-4">
            <MessageCircle size={28} className="text-amber-400" />
            <h1 className="text-4xl font-black" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>Contact Us</h1>
          </div>
          <p className="text-lg" style="color: rgba(255,255,255,0.8)">Koi bhi sawaal ho, hum yahan hain. Seedha contact karein!</p>
        </div>
      </section>

      {/* Contact Cards */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-12">
            {/* Email */}
            <a href="mailto:Solution@poketbook.in"
              className="flex flex-col items-center gap-3 border-2 border-red-200 rounded-xl p-6 bg-red-50 hover:bg-red-100 transition-colors group text-center">
              <div className="w-12 h-12 bg-red-700 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                <Mail size={22} className="text-white" />
              </div>
              <div>
                <div className="font-bold text-stone-900 text-base mb-1">Email</div>
                <div className="text-red-700 font-semibold text-sm">Solution@poketbook.in</div>
                <div className="text-stone-500 text-xs mt-1">Reply within 24 hours</div>
              </div>
            </a>

            {/* Phone / WhatsApp */}
            <a href="https://wa.me/918130095013" target="_blank" rel="noopener noreferrer"
              className="flex flex-col items-center gap-3 border-2 border-green-200 rounded-xl p-6 bg-green-50 hover:bg-green-100 transition-colors group text-center">
              <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                <Phone size={22} className="text-white" />
              </div>
              <div>
                <div className="font-bold text-stone-900 text-base mb-1">WhatsApp / Call</div>
                <div className="text-green-700 font-semibold text-sm">+91 81300 95013</div>
                <div className="text-stone-500 text-xs mt-1">Mon–Sat, 10am–7pm IST</div>
              </div>
            </a>

            {/* Flutter Fox */}
            <a href="https://flutterfox.in" target="_blank" rel="dofollow"
              className="flex flex-col items-center gap-3 border-2 border-amber-200 rounded-xl p-6 bg-amber-50 hover:bg-amber-100 transition-colors group text-center">
              <div className="w-12 h-12 bg-amber-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                <ExternalLink size={22} className="text-white" />
              </div>
              <div>
                <div className="font-bold text-stone-900 text-base mb-1">Made by Flutter Fox</div>
                <div className="text-amber-700 font-semibold text-sm">flutterfox.in</div>
                <div className="text-stone-500 text-xs mt-1">Web & App Development</div>
              </div>
            </a>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Contact Form */}
            <div>
              <h2 className="text-2xl font-black text-stone-900 mb-6" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>
                Message Bhejein
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-600 uppercase tracking-wide mb-1">Aapka Naam *</label>
                  <input type="text" value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} required
                    placeholder="Apna naam likhein"
                    className="w-full border-2 border-stone-300 px-4 py-2.5 text-base focus:outline-none focus:border-red-600 rounded-lg bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-600 uppercase tracking-wide mb-1">Email *</label>
                  <input type="email" value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))} required
                    placeholder="apna@email.com"
                    className="w-full border-2 border-stone-300 px-4 py-2.5 text-base focus:outline-none focus:border-red-600 rounded-lg bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-600 uppercase tracking-wide mb-1">Subject</label>
                  <input type="text" value={form.subject} onChange={e => setForm(p => ({...p, subject: e.target.value}))}
                    placeholder="Kya sawaal hai?"
                    className="w-full border-2 border-stone-300 px-4 py-2.5 text-base focus:outline-none focus:border-red-600 rounded-lg bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-600 uppercase tracking-wide mb-1">Message *</label>
                  <textarea value={form.message} onChange={e => setForm(p => ({...p, message: e.target.value}))} required rows={5}
                    placeholder="Apna sawaal ya problem batayein..."
                    className="w-full border-2 border-stone-300 px-4 py-2.5 text-base focus:outline-none focus:border-red-600 rounded-lg bg-white resize-none" />
                </div>
                <button type="submit"
                  className="w-full bg-red-700 text-white px-6 py-3 rounded-lg font-bold text-base hover:bg-red-800 transition-colors flex items-center justify-center gap-2">
                  <Send size={18} /> Email Send Karein
                </button>
              </form>

              {/* Direct contact links */}
              <div className="mt-6 p-4 bg-stone-50 rounded-xl border border-stone-200">
                <p className="text-sm font-bold text-stone-700 mb-3">Seedha Contact:</p>
                <div className="space-y-2">
                  <a href="mailto:Solution@poketbook.in" className="flex items-center gap-2 text-sm text-red-700 hover:text-red-900">
                    <Mail size={14} /> Solution@poketbook.in
                  </a>
                  <a href="tel:+918130095013" className="flex items-center gap-2 text-sm text-green-700 hover:text-green-900">
                    <Phone size={14} /> +91 81300 95013
                  </a>
                  <a href="https://wa.me/918130095013" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-green-600 hover:text-green-800">
                    <MessageCircle size={14} /> WhatsApp par message karein
                  </a>
                </div>
              </div>
            </div>

            {/* Map + Business Info */}
            <div>
              <h2 className="text-2xl font-black text-stone-900 mb-6" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>
                Hamare Baare Mein
              </h2>

              {/* Google Maps Embed */}
              <div className="rounded-xl overflow-hidden border-2 border-stone-200 mb-5 shadow-md">
                <iframe
                  title="Flutter Fox Location"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d224356.9555553217!2d76.8130545!3d28.6435847!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390cfd5b347eb62d%3A0x52c2b7494e204dce!2sNew%20Delhi%2C%20Delhi!5e0!3m2!1sen!2sin!4v1713792000000!5m2!1sen!2sin"
                  width="100%"
                  height="220"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>

              {/* Business Card */}
              <div className="bg-gradient-to-br from-stone-900 to-stone-800 text-white rounded-xl p-5 mb-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center">
                    <IndianRupee size={16} className="text-white" />
                  </div>
                  <div>
                    <div className="font-black text-base">poketbook</div>
                    <div className="text-stone-400 text-xs">by Flutter Fox</div>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-stone-300">
                    <Mail size={13} className="text-red-400" />
                    <span>Solution@poketbook.in</span>
                  </div>
                  <div className="flex items-center gap-2 text-stone-300">
                    <Phone size={13} className="text-green-400" />
                    <span>+91 81300 95013</span>
                  </div>
                  <div className="flex items-center gap-2 text-stone-300">
                    <MapPin size={13} className="text-amber-400" />
                    <span>New Delhi, India</span>
                  </div>
                  <div className="flex items-center gap-2 text-stone-300">
                    <ExternalLink size={13} className="text-amber-400" />
                    <a href="https://flutterfox.in" rel="dofollow" target="_blank" className="text-amber-400 hover:text-amber-300 underline">
                      flutterfox.in
                    </a>
                  </div>
                </div>
              </div>

              {/* Google Business Link */}
              <a
                href="https://www.google.com/search?q=Flutter+Fox+poketbook"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full border-2 border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100 py-3 rounded-xl font-semibold text-sm transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Google par Review Dein / Dhundein
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-stone-900 text-stone-400 py-8 px-4 text-center text-sm mt-8">
        <div className="flex items-center justify-center gap-2 mb-2">
          <IndianRupee size={16} className="text-red-400" />
          <span className="font-bold text-white">poketbook</span>
          <span>— Udhar/Khaata Digital Ledger</span>
        </div>
        <p className="text-stone-300 text-xs mb-1">
          Made with ❤️ in house of{" "}
          <a href="https://flutterfox.in" rel="dofollow" target="_blank" className="text-red-400 hover:text-red-300 underline font-semibold">
            Flutter Fox
          </a>
        </p>
        <p className="text-stone-600 text-xs">
          © {new Date().getFullYear()} poketbook by Flutter Fox. All Rights Reserved.
        </p>
      </footer>
    </div>
  );
};

export default ContactUsPage;
