import {
  LayoutDashboard,
  ShieldAlert,
  Users,
  FolderLock,
  Navigation,
  Settings,
  History,
  ChevronLeft,
  ChevronRight,
  LogOut,
  X,
} from "lucide-react";

import { NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";

const menu = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Active SOS",
    path: "/dashboard/sos",
    icon: ShieldAlert,
  },
  {
    label: "Emergency Contacts",
    path: "/dashboard/contacts",
    icon: Users,
  },
  {
    label: "Evidence Vault",
    path: "/dashboard/evidence",
    icon: FolderLock,
  },
  {
    label: "Safe Route Planner",
    path: "/dashboard/routes",
    icon: Navigation,
  },
  {
    label: "SOS Settings",
    path: "/dashboard/settings",
    icon: Settings,
  },
  {
    label: "Incident History",
    path: "/dashboard/history",
    icon: History,
  },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const { logout } = useAuth();

  // Listen for the hamburger button in Header.jsx
  useEffect(() => {
    const openMenu = () => setMobileOpen(true);

    window.addEventListener(
      "safeops:open-mobile-menu",
      openMenu
    );

    return () => {
      window.removeEventListener(
        "safeops:open-mobile-menu",
        openMenu
      );
    };
  }, []);

  // Prevent background scrolling while the drawer is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen
      ? "hidden"
      : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  // Close drawer with Escape
  useEffect(() => {
    if (!mobileOpen) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [mobileOpen]);

  const handleLogout = async () => {
    setMobileOpen(false);
    await logout();
  };

  const renderLinks = () => (
    <>
      {menu.map((item) => {
        const Icon = item.icon;

        return (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/dashboard"}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? "active" : ""}`
            }
          >
            <Icon size={20} />
            <span>{item.label}</span>
          </NavLink>
        );
      })}

      <button
        type="button"
        className="sidebar-logout"
        onClick={handleLogout}
      >
        <LogOut size={20} />
        <span>Sign Out</span>
      </button>
    </>
  );

  return (
    <>
      {/* DESKTOP SIDEBAR */}
      <aside
        className={`sidebar ${
          collapsed ? "sidebar-collapsed" : ""
        }`}
      >
        <button
          type="button"
          className="sidebar-collapse"
          aria-label={
            collapsed
              ? "Expand sidebar"
              : "Collapse sidebar"
          }
          onClick={() =>
            setCollapsed((current) => !current)
          }
        >
          {collapsed ? (
            <ChevronRight size={18} />
          ) : (
            <ChevronLeft size={18} />
          )}
        </button>

        <nav className="sidebar-nav">
          {menu.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/dashboard"}
                className={({ isActive }) =>
                  `sidebar-link ${
                    isActive ? "active" : ""
                  }`
                }
              >
                <Icon size={20} />

                {!collapsed && (
                  <span>{item.label}</span>
                )}
              </NavLink>
            );
          })}
        </nav>

        <button
          type="button"
          className="sidebar-logout"
          onClick={handleLogout}
        >
          <LogOut size={20} />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </aside>

      {/* MOBILE DRAWER */}
      {mobileOpen && (
        <div
          className="mobile-drawer-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setMobileOpen(false);
            }
          }}
        >
          <aside
            className="mobile-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="SafeOps navigation menu"
          >
            <div className="mobile-drawer-header">
              <div className="mobile-drawer-brand">
                <div className="header-logo">
                  <ShieldAlert size={21} />
                </div>
                <strong>SafeOps Menu</strong>
              </div>

              <button
                type="button"
                className="mobile-drawer-close"
                aria-label="Close navigation menu"
                onClick={() => setMobileOpen(false)}
              >
                <X size={22} />
              </button>
            </div>

            <nav className="sidebar-nav">
              {renderLinks()}
            </nav>
          </aside>
        </div>
      )}
    </>
  );
}