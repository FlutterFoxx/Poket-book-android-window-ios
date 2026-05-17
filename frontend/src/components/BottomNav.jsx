import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, BookOpen, Scale, Trash2 } from "lucide-react";

const BOTTOM_ITEMS = [
  { path: "/", icon: LayoutDashboard, label: "Home" },
  { path: "/parties", icon: Users, label: "Parties" },
  { path: "/ledger", icon: BookOpen, label: "Ledger" },
  { path: "/balance-sheet", icon: Scale, label: "Sheet" },
  { path: "/recycle-bin", icon: Trash2, label: "Bin" },
];

// Detect desktop/Electron — hide bottom nav on desktop
const isDesktop = () => {
  try {
    if (typeof navigator !== "undefined" && navigator.userAgent?.includes("Electron")) return true;
    if (typeof window !== "undefined" && window.matchMedia?.("(min-width: 768px)")?.matches) return true;
  } catch { return false; }
  return false;
};

export const BottomNav = () => {
  const { pathname } = useLocation();
  if (isDesktop()) return null;

  const active = (path) =>
    pathname === path || (path === "/ledger" && pathname.startsWith("/ledger"));

  return (
    <nav
      className="md:hidden flex-shrink-0"
      style={{
        background: "var(--primary-gradient)",
        borderTop: "1px solid rgba(255,255,255,0.1)",
        display: "flex",
        position: "sticky",
        bottom: 0,
        zIndex: 40,
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
      data-testid="bottom-nav"
    >
      {BOTTOM_ITEMS.map(({ path, icon: Icon, label }) => {
        const active = active(path);
        return (
          <Link
            key={path}
            to={path}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "8px 4px 6px",
              color: active ? "#4ade80" : "rgba(255,255,255,0.55)",
              textDecoration: "none",
              transition: "color 0.15s",
              minWidth: 0,
            }}
          >
            <Icon size={20} style={{ marginBottom: "2px" }} />
            <span style={{ fontSize: "10px", fontWeight: active ? 700 : 500, letterSpacing: "0.2px" }}>
              {label}
            </span>
            {active && (
              <div style={{ width: "18px", height: "3px", background: "#4ade80", borderRadius: "2px", marginTop: "2px" }} />
            )}
          </Link>
        );
      })}
    </nav>
  );
};
