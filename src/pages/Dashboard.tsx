import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PageContainer } from "@/components/PageContainer";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { fmtMonthShort, fmtDate } from "@/lib/format";
import { ArrowUpRight, FilePlus2, Users, FileText, Calendar, ArrowRight } from "lucide-react";
import { getBusinessTypeLabel } from "@/lib/reportGoal";

interface ClientRow {
  id: string;
  name: string;
  business_type: string;
  reporting_status: string;
  next_report_due: string | null;
  last_report_month: string | null;
}
interface LatestReport {
  client_id: string;
  status: string;
  period_month: string;
  id: string;
}

export default function Dashboard() {
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [latest, setLatest] = useState<Record<string, LatestReport>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: cs } = await supabase
        .from("clients")
        .select("id,name,business_type,reporting_status,next_report_due,last_report_month")
        .eq("archived", false)
        .order("name");
      const { data: rs } = await supabase
        .from("reports")
        .select("id,client_id,status,period_month")
        .order("period_month", { ascending: false });
      const map: Record<string, LatestReport> = {};
      (rs || []).forEach((r: any) => {
        if (!map[r.client_id]) map[r.client_id] = r;
      });
      setClients((cs as any) || []);
      setLatest(map);
      setLoading(false);
    })();
  }, []);

  const stats = {
    total: clients.length,
    overdue: clients.filter((c) => c.reporting_status === "overdue").length,
    dueSoon: clients.filter((c) => c.reporting_status === "due_soon").length,
    onTrack: clients.filter((c) => c.reporting_status === "on_track").length,
  };

  return (
    <>
      <section className="crm-hero-scene relative left-1/2 right-1/2 mb-10 w-screen -translate-x-1/2">
        <div className="mx-auto flex min-h-[100svh] max-w-[1320px] flex-col justify-between px-6 pb-8 pt-28 md:px-8 md:pb-10 md:pt-32">
          <div className="crm-hero-content pt-3 md:pt-6">
            <div className="crm-eyebrow-pill lynck-section-label mb-5 inline-flex rounded-full px-3 py-1.5">
              Internal reporting system
            </div>
            <h1 className="lynck-hero-title max-w-4xl text-5xl text-white md:text-6xl xl:text-7xl">
              Build reports that <em className="not-italic text-primary">feel clear</em> before they feel complicated.
            </h1>
            <p className="mt-5 max-w-2xl text-[1.04rem] leading-8 text-white/78">
              A darker operational shell for the agency CRM, with the dashboard acting as the calm front layer for reports, approvals, and next actions.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild>
                <Link to="/reports"><FilePlus2 className="size-4 mr-2" /> New report</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/clients">Review clients <ArrowRight className="size-4 ml-2" /></Link>
              </Button>
            </div>
          </div>

          <div className="crm-hero-statbar mx-[-24px] mt-8 grid gap-6 px-6 py-6 md:mx-[-32px] md:grid-cols-3 md:px-8">
            <HeroStat label="Active clients" value={`${stats.total}`} />
            <HeroStat label="Due soon" value={`${stats.dueSoon}`} />
            <HeroStat label="Overdue" value={`${stats.overdue}`} />
          </div>
        </div>
      </section>

      <PageContainer>
        <div className="grid grid-cols-2 gap-4 mb-10 md:grid-cols-4">
          <StatCard label="Active clients" value={stats.total} icon={Users} />
          <StatCard label="On track" value={stats.onTrack} accent="good" />
          <StatCard label="Due soon" value={stats.dueSoon} accent="medium" />
          <StatCard label="Overdue" value={stats.overdue} accent="urgent" />
        </div>

        <PageHeader
          eyebrow="Today"
          title="Client"
          emphasize="roster"
          description="All active clients, current reporting status, and the latest drafted report for each account."
          actions={
            <Button asChild variant="outline">
              <Link to="/reports">Open archive <FileText className="size-4 ml-2" /></Link>
            </Button>
          }
        />

        <p className="lynck-section-label mb-3 mt-8">Clients</p>
        <div className="lynck-card overflow-hidden">
          <table className="w-full text-card-body">
            <thead>
              <tr className="text-left lynck-muted text-[11px] uppercase tracking-[0.15em]">
                <th className="px-5 py-3 font-medium">Client</th>
                <th className="px-5 py-3 font-medium">Type</th>
                <th className="px-5 py-3 font-medium">Latest report</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Next due</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={6} className="px-5 py-10 text-center lynck-muted">Loading…</td></tr>
              )}
              {!loading && clients.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-10 text-center lynck-muted">No clients yet.</td></tr>
              )}
              {clients.map((c) => {
                const l = latest[c.id];
                return (
                  <tr key={c.id} className="crm-table-row border-t border-border transition-colors">
                    <td className="px-5 py-4">
                      <Link to={`/clients/${c.id}`} className="font-medium hover:text-primary">
                        {c.name}
                      </Link>
                    </td>
                    <td className="px-5 py-4 lynck-muted">
                      {c.business_type === "ecommerce" ? "Ecommerce" : "Lead gen"}
                    </td>
                    <td className="px-5 py-4 lynck-muted">
                      {l ? fmtMonthShort(l.period_month) : "—"}
                    </td>
                    <td className="px-5 py-4">
                      {l ? <StatusBadge variant="report" value={l.status} /> : <span className="lynck-muted">—</span>}
                    </td>
                    <td className="px-5 py-4 lynck-muted inline-flex items-center gap-1.5">
                      <Calendar className="size-3.5" />
                      {c.next_report_due ? fmtDate(c.next_report_due) : "—"}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {l && (
                        <Button asChild variant="ghost" size="sm">
                          <Link to={`/reports/${l.id}`}>Open <ArrowUpRight className="size-3.5 ml-1" /></Link>
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </PageContainer>
    </>
  );
}

const accentMap = {
  good: "text-status-good",
  medium: "text-status-medium",
  urgent: "text-status-urgent",
} as const;
function StatCard({ label, value, icon: Icon, accent }: { label: string; value: number; icon?: any; accent?: keyof typeof accentMap }) {
  return (
    <div className="lynck-card p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] uppercase tracking-[0.15em] lynck-muted">{label}</span>
        {Icon && <Icon className="size-4 lynck-muted" />}
      </div>
      <div className={`font-display text-3xl font-bold ${accent ? accentMap[accent] : ""}`}>{value}</div>
    </div>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-display text-4xl text-white md:text-5xl">{value}</div>
      <div className="mt-2 text-[11px] uppercase tracking-[0.18em] text-white/58">{label}</div>
    </div>
  );
}
