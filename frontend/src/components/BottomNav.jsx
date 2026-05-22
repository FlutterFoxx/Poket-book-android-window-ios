import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { LayoutDashboard, Users, BookOpen, Scale, FileText } from "lucide-react";

const BOTTOM_ITEMS = [
  { path: "/", icon: LayoutDashboard, label: "Home" },
  { path: "/parties", icon: Users, label: "Parties" },
  { path: "/ledger", icon: BookOpen, label: "Ledger" },
  { path: "/balance-sheet", icon: Scale, label: "Sheet" },
  { path: "/export", icon: FileText, label: "Statement" },
];

const isDesktop = () => {
  try {
    if (typeof navigator !== "undefined" && navigator.userAgent?.includes("Electron")) return true;
    if (typeof window !== "undefined" && window.matchMedia?.("(min-width: 768px)")?.matches) return true;
  } catch { return false; }
  return false;
};

export const BottomNav = () => {
  const { pathname } = useLocation();
  const [visible, setVisible] = useState(true);
  const [lastY, setLastY] = useState(0);

  useEffect(() => {
    let ticking = false;
    const onScroll = (e) => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const el = (e.target && e.target !== document) ? e.target : document.documentElement;
        const y = el.scrollTop || window.scrollY || 0;
        if (Math.abs(y - lastY) > 8) {
          setVisible(y < lastY || y < 40);
          setLastY(y);
        }
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true, capture: true });
    return () => window.removeEventListener("scroll", onScroll, { capture: true });
  }, [lastY]);

  if (isDesktop()) return null;

  const active = (path) =>
    pathname === path || (path === "/ledger" && pathname.startsWith("/ledger"));

  return (
    <nav
      className="md:hidden flex-shrink-0 no-screenshot"
      data-testid="bottom-nav"
      style={{
        background: "#ffffff",
        borderTop: "1.5px solid #E5E7EB",
        display: "flex",
        position: "sticky",
        bottom: 0,
        zIndex: 40,
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        boxShadow: "0 -2px 12px rgba(0,0,0,0.08)",
        transform: visible ? "translateY(0)" : "translateY(110%)",
        transition: "transform 0.22s ease",
      }}
    >
      {BOTTOM_ITEMS.map(({ path, icon: Icon, label }) => {
        const isActive = active(path);
        return (
          <Link key={path} to={path}
            style={{
              flex: 1, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              padding: "8px 4px 6px",
              color: isActive ? "#0A1628" : "#9CA3AF",
              textDecoration: "none", transition: "color 0.15s", minWidth: 0,
            }}
          >
            <Icon size={20} style={{ marginBottom: "2px" }} />
            <span style={{ fontSize: "10px", fontWeight: isActive ? 700 : 500, letterSpacing: "0.2px" }}>
              {label}
            </span>
            {isActive && (
              <div style={{ width: "18px", height: "3px", background: "#F59E0B", borderRadius: "2px", marginTop: "2px" }} />
            )}
          </Link>
        );
      })}
    </nav>
  );
};
