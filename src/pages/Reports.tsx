import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PageContainer } from "@/components/PageContainer";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { fmtMonthShort } from "@/lib/format";
import { Plus, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import { generateMockReport } from "@/lib/mockReport";
import { getClientReportGoal } from "@/lib/reportGoal";

export default function Reports() {
  const [reports, setReports] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const today = new Date();
  const defaultMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const [form, setForm] = useState({ client_id: "", month: defaultMonth });
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoading(true);
    const [{ data: rs }, { data: cs }] = await Promise.all([
      supabase.from("reports").select("*, clients(name, business_type)").order("period_month", { ascending: false }),
      supabase.from("clients").select("id,name,business_type,brand_notes").eq("archived", false).order("name"),
    ]);
    setReports(rs || []); setClients(cs || []); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const createReport = async () => {
    if (!form.client_id) return toast.error("Pick a client");
    setCreating(true);
    const period = `${form.month}-01`;
    const client = clients.find((c) => c.id === form.client_id);
    const exists = reports.find((r) => r.client_id === form.client_id && r.period_month === period);
    if (exists) {
      setCreating(false);
      setOpen(false);
      toast.success("Report already exists — opening");
      window.location.href = `/reports/${exists.id}`;
      return;
    }
    const mock = generateMockReport({
      businessType: client?.business_type || "ecommerce",
      reportGoal: getClientReportGoal(client?.brand_notes, client?.business_type),
      periodMonth: period,
    });
    const title = `${client.name} — ${new Date(period).toLocaleDateString(undefined, { month: "long", year: "numeric" })}`;
    const { data: r, error } = await supabase.from("reports").insert([{
      client_id: form.client_id, title, period_month: period, status: "draft",
      headline: mock.headline, overall_status: mock.overall_status as "good" | "medium" | "urgent" | "info",
    }]).select().single();
    if (error || !r) { setCreating(false); return toast.error(error?.message || "Failed"); }
    await supabase.from("report_metrics").insert([{ report_id: r.id, ...mock.metrics }]);
    await supabase.from("report_sections").insert(mock.sections.map((s: any) => ({ ...s, report_id: r.id })));
    await supabase.from("report_recommendations").insert(mock.recommendations.map((s: any) => ({ ...s, report_id: r.id })));
    setCreating(false); setOpen(false);
    toast.success("Report drafted");
    window.location.href = `/reports/${r.id}`;
  };

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Reports"
        title="Monthly"
        emphasize="archive"
        description="Every report I have drafted, reviewed, and shipped."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="size-4 mr-2" /> New report</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle className="font-display">Generate monthly report</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <label className="text-[11px] uppercase tracking-[0.15em] lynck-muted mb-1.5 block">Client</label>
                  <Select value={form.client_id} onValueChange={(v) => setForm({ ...form, client_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select a client" /></SelectTrigger>
                    <SelectContent>
                      {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-[11px] uppercase tracking-[0.15em] lynck-muted mb-1.5 block">Reporting month</label>
                  <Input type="month" value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })} />
                </div>
                <p className="text-xs lynck-muted">Mock data will be generated. You can edit every section and regenerate with AI before approving.</p>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={createReport} disabled={creating}>{creating ? "Generating…" : "Generate draft"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="lynck-card overflow-hidden">
        <table className="w-full text-card-body">
          <thead>
            <tr className="text-left lynck-muted text-[11px] uppercase tracking-[0.15em]">
              <th className="px-5 py-3 font-medium">Client</th>
              <th className="px-5 py-3 font-medium">Month</th>
              <th className="px-5 py-3 font-medium">Title</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={5} className="px-5 py-10 text-center lynck-muted">Loading…</td></tr>}
            {!loading && reports.length === 0 && <tr><td colSpan={5} className="px-5 py-10 text-center lynck-muted">No reports yet.</td></tr>}
            {reports.map((r) => (
              <tr key={r.id} className="crm-table-row border-t border-border">
                <td className="px-5 py-4">
                  <Link to={`/clients/${r.client_id}`} className="hover:text-primary">{r.clients?.name}</Link>
                </td>
                <td className="px-5 py-4 lynck-muted">{fmtMonthShort(r.period_month)}</td>
                <td className="px-5 py-4">{r.title}</td>
                <td className="px-5 py-4"><StatusBadge variant="report" value={r.status} /></td>
                <td className="px-5 py-4 text-right">
                  <Button asChild variant="ghost" size="sm"><Link to={`/reports/${r.id}`}>Open <ArrowUpRight className="size-3.5 ml-1" /></Link></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageContainer>
  );
}
