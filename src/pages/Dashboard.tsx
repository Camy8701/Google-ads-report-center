import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PageContainer } from "@/components/PageContainer";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { fmtMonthShort, fmtDate } from "@/lib/format";
import { ArrowUpRight, FilePlus2, Users, FileText, Calendar } from "lucide-react";

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
    <PageContainer>
      <PageHeader
        eyebrow="TODAY"
        title="Reporting"
        emphasize="command center"
        description="All active clients, current reporting status, and next moves."
        actions={
          <Button asChild>
            <Link to="/reports"><FilePlus2 className="size-4 mr-2" /> New report</Link>
          </Button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <StatCard label="Active clients" value={stats.total} icon={Users} />
        <StatCard label="On track" value={stats.onTrack} accent="good" />
        <StatCard label="Due soon" value={stats.dueSoon} accent="medium" />
        <StatCard label="Overdue" value={stats.overdue} accent="urgent" />
      </div>

      <p className="lynck-section-label mb-3">Clients</p>
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
                <tr key={c.id} className="border-t border-border hover:bg-secondary/40 transition-colors">
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
