import { NavLink, Outlet, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, FileText, Settings as SettingsIcon } from "lucide-react";
import { Wordmark } from "./Wordmark";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/clients", label: "Clients", icon: Users },
  { to: "/reports", label: "Reports", icon: FileText },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
];

export const AppShell = () => {
  const loc = useLocation();
  // Hide shell when viewing a single report (for clean print + focus mode)
  const isReportView = /^\/reports\/[^/]+$/.test(loc.pathname);
  if (isReportView) return <Outlet />;

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="no-print w-60 shrink-0 border-r border-border bg-sidebar flex flex-col">
        <div className="px-5 py-6 border-b border-border">
          <Wordmark size="md" />
          <p className="mt-1 text-[11px] tracking-[0.15em] uppercase lynck-muted">Internal CRM</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end as any}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-md text-[14.5px] transition-colors ${
                  isActive
                    ? "bg-sidebar-accent text-foreground border border-border"
                    : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/60"
                }`
              }
            >
              <n.icon className="size-4" />
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-border text-[11px] tracking-[0.15em] uppercase lynck-muted">
          v1 · Mock data
        </div>
      </aside>
      <main className="flex-1 min-w-0 relative">
        <div className="absolute inset-0 lynck-glow pointer-events-none" />
        <div className="relative">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
