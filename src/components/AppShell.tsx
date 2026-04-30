import { NavLink, Outlet, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, FileText, Settings as SettingsIcon, Sparkles } from "lucide-react";
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
    <div className="crm-shell-aura min-h-screen relative">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 lynck-glow opacity-90" />
      </div>

      <header className="no-print sticky top-0 z-40 px-4 pt-4">
        <div className="mx-auto max-w-[1280px]">
          <div className="crm-topbar px-4 py-3 md:px-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 shadow-sm">
                  <Wordmark size="sm" />
                </div>
                <div className="hidden md:block">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] lynck-muted">Internal operations</p>
                  <p className="text-sm text-foreground">Google Ads reporting CRM</p>
                </div>
              </div>

              <nav className="hidden md:flex items-center gap-2">
                {nav.map((n) => (
                  <NavLink
                    key={n.to}
                    to={n.to}
                    end={n.end as any}
                    className={({ isActive }) =>
                      `crm-nav-link inline-flex items-center gap-2 px-4 py-2 text-[13px] font-semibold uppercase tracking-[0.08em] ${
                        isActive ? "active" : ""
                      }`
                    }
                  >
                    <n.icon className="size-4" />
                    {n.label}
                  </NavLink>
                ))}
              </nav>

              <div className="hidden lg:flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm shadow-sm">
                <Sparkles className="size-4 text-primary" />
                <span className="text-foreground">Mock data mode</span>
              </div>
            </div>
          </div>

          <nav className="mt-3 flex gap-2 overflow-x-auto pb-1 md:hidden">
            {nav.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end as any}
                className={({ isActive }) =>
                  `crm-nav-link inline-flex shrink-0 items-center gap-2 px-4 py-2 text-[13px] font-semibold uppercase tracking-[0.08em] ${
                    isActive ? "active" : "border border-white/10 bg-white/5"
                  }`
                }
              >
                <n.icon className="size-4" />
                {n.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="relative z-10">
        <div key={loc.pathname} className="crm-page-fade">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
