import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LangToggle } from "@/contexts/LangContext";
import {
  LayoutDashboard, Users, BookOpen, Scale, FileText,
  LogOut, ChevronDown, Menu, X, Settings, Trash2,
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard, testId: "dashboard" },
  { path: "/parties", label: "Parties / Khata", icon: Users, testId: "parties" },
  { path: "/ledger", label: "Ledger / Bahi", icon: BookOpen, testId: "ledger" },
  { path: "/balance-sheet", label: "Balance Sheet", icon: Scale, testId: "balance-sheet" },
  { path: "/export", label: "Statement", icon: FileText, testId: "export" },
  { path: "/settings", label: "Settings", icon: Settings, testId: "settings" },
  { path: "/recycle-bin", label: "Recycle Bin", icon: Trash2, testId: "recycle-bin" },
];

// ── UserMenu — extracted sub-component (reduces Navbar complexity) ────────────
const UserMenu = ({ user, logout, menuRef }) => {
  const [open, setOpen] = useState(false);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuRef]);

  return (
    <div className="relative pl-3 border-l border-white/10 hidden sm:block" ref={menuRef}>
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-2 px-2 py-1.5 hover:bg-white/10 rounded transition-colors"
        data-testid="user-menu-btn"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
          {user?.name?.[0]?.toUpperCase() || "U"}
        </div>
        <span className="hidden sm:block text-sm font-medium max-w-[90px] truncate">{user?.name}</span>
        <ChevronDown size={12} className={`text-gray-300 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded shadow-xl border border-stone-200 py-1 z-50">
          <div className="px-4 py-2.5 border-b border-stone-100">
            <p className="text-sm font-semibold text-stone-800 truncate">{user?.name}</p>
            <p className="text-xs text-stone-400 truncate">{user?.email}</p>
            {user?.subscription && (
              <p className="text-xs mt-0.5">
                <span className={user.subscription.is_active ? "text-green-600" : "text-red-500"}>
                  {user.subscription.is_active
                    ? `Trial: ${user.subscription.days_remaining}d left`
                    : "Subscription expired"}
                </span>
              </p>
            )}
          </div>
          <button
            onClick={logout}
            data-testid="logout-btn"
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut size={14} /> Logout / Bahar
          </button>
        </div>
      )}
    </div>
  );
};

// ── NavLinks — extracted sub-component ────────────────────────────────────────
const NavLinks = ({ isActive }) => (
  <nav className="hidden md:flex items-center flex-1">
    {navItems.map((item) => (
      <Link
        key={item.path}
        to={item.path}
        data-testid={`nav-${item.testId}`}
        className={`flex items-center gap-1.5 px-3 lg:px-4 h-12 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
          isActive(item.path)
            ? "border-white text-white"
            : "border-transparent text-white/70 hover:bg-white/10 hover:text-white"
        }`}
      >
        <item.icon size={14} />
        <span className="hidden lg:inline">{item.label}</span>
        <span className="lg:hidden">{item.label.split(" /")[0]}</span>
      </Link>
    ))}
  </nav>
);

// ── Main Navbar ────────────────────────────────────────────────────────────────
const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef(null);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const isActive = useCallback((path) =>
    location.pathname === path ||
    (path === "/ledger" && location.pathname.startsWith("/ledger")),
  [location.pathname]);

  return (
    <header
      className="flex-shrink-0 text-white shadow-md z-40 relative"
      style={{ background: "var(--primary-gradient)" }}
      data-testid="header-nav"
    >
      <div className="flex items-center h-12 px-4 gap-0">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 pr-4 border-r border-white/10 flex-shrink-0">
          <img src="/logo.png" alt="poketbook" className="w-8 h-8 object-contain" />
          <span className="font-bold text-base" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>
            <span className="text-white">Poket</span><span className="text-green-400">Book</span>
          </span>
        </Link>

        {/* Desktop nav links */}
        <NavLinks isActive={isActive} />

        {/* User menu dropdown (desktop) */}
        <UserMenu user={user} logout={logout} menuRef={menuRef} />

        {/* Language Toggle (desktop) */}
        <div className="hidden sm:block ml-2 flex-shrink-0">
          <LangToggle />
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen((p) => !p)}
          className="md:hidden flex items-center justify-center w-9 h-9 ml-auto hover:bg-white/10 rounded transition-colors"
          aria-label="Toggle menu"
          data-testid="hamburger-btn"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/10 var(--primary-dark)" data-testid="mobile-menu">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
            <div className="w-8 h-8 bg-blue-700 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
              {user?.name?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
              <p className="text-xs text-blue-300 truncate">{user?.email}</p>
            </div>
          </div>
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              data-testid={`mobile-nav-${item.testId}`}
              className={`flex items-center gap-3 px-5 py-3.5 text-base font-medium border-b border-white/10 transition-colors ${
                isActive(item.path) ? "bg-blue-700 text-white border-l-4 border-l-green-400" : "text-gray-200 hover:bg-white/10 hover:text-white"
              }`}
            >
              <item.icon size={18} />{item.label}
            </Link>
          ))}
          <button onClick={logout} data-testid="logout-btn"
            className="w-full flex items-center gap-3 px-5 py-3.5 text-base text-gray-300 hover:bg-white/10 transition-colors">
            <LogOut size={18} /> Logout / Bahar
          </button>
        </div>
      )}
    </header>
  );
};

export default Navbar;
