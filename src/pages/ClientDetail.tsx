import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PageContainer } from "@/components/PageContainer";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { fmtDate, fmtMonthShort } from "@/lib/format";
import { ArrowLeft, Save, FileText, Mail, Building2 } from "lucide-react";
import { toast } from "sonner";

export default function ClientDetail() {
  const { id } = useParams();
  const [client, setClient] = useState<any>(null);
  const [contacts, setContacts] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<any>({});

  const load = async () => {
    if (!id) return;
    const [{ data: c }, { data: ct }, { data: ac }, { data: rp }] = await Promise.all([
      supabase.from("clients").select("*").eq("id", id).single(),
      supabase.from("client_contacts").select("*").eq("client_id", id),
      supabase.from("ad_accounts").select("*").eq("client_id", id),
      supabase.from("reports").select("*").eq("client_id", id).order("period_month", { ascending: false }),
    ]);
    setClient(c); setContacts(ct || []); setAccounts(ac || []); setReports(rp || []);
    setForm(c || {});
  };
  useEffect(() => { load(); }, [id]);

  const save = async () => {
    const { error } = await supabase.from("clients").update({
      name: form.name, business_type: form.business_type, industry: form.industry,
      website: form.website, brand_notes: form.brand_notes, reporting_status: form.reporting_status,
    }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Saved");
    setEditing(false); load();
  };

  if (!client) return <PageContainer><div className="lynck-muted">Loading…</div></PageContainer>;

  return (
    <PageContainer>
      <Link to="/clients" className="inline-flex items-center gap-2 text-sm lynck-muted hover:text-foreground mb-6">
        <ArrowLeft className="size-4" /> Back to clients
      </Link>
      <PageHeader
        eyebrow={client.business_type === "ecommerce" ? "Ecommerce" : "Lead gen"}
        title={client.name}
        description={client.industry || ""}
        actions={
          <div className="flex gap-2">
            {!editing && <Button variant="outline" onClick={() => setEditing(true)}>Edit</Button>}
            {editing && <>
              <Button variant="ghost" onClick={() => { setEditing(false); setForm(client); }}>Cancel</Button>
              <Button onClick={save}><Save className="size-4 mr-2" />Save</Button>
            </>}
          </div>
        }
      />

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <div className="lynck-card p-5 md:col-span-2">
          <p className="lynck-section-label mb-3">Brand notes</p>
          {editing ? (
            <Textarea rows={6} value={form.brand_notes || ""} onChange={(e) => setForm({ ...form, brand_notes: e.target.value })} />
          ) : (
            <p className="text-card-body whitespace-pre-wrap">{client.brand_notes || "No brand notes yet."}</p>
          )}
        </div>
        <div className="lynck-card p-5 space-y-4">
          <div>
            <p className="lynck-section-label mb-2">Reporting status</p>
            <StatusBadge variant="reporting" value={client.reporting_status} />
          </div>
          <div>
            <p className="lynck-section-label mb-1">Next due</p>
            <p className="text-card-body">{client.next_report_due ? fmtDate(client.next_report_due) : "—"}</p>
          </div>
          <div>
            <p className="lynck-section-label mb-1">Last report</p>
            <p className="text-card-body">{client.last_report_month ? fmtMonthShort(client.last_report_month) : "—"}</p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-8">
        <div className="lynck-card p-5">
          <p className="lynck-section-label mb-3 inline-flex items-center gap-2"><Mail className="size-3" /> Contacts</p>
          {contacts.length === 0 && <p className="text-card-body lynck-muted">No contacts yet.</p>}
          <ul className="space-y-3">
            {contacts.map((c) => (
              <li key={c.id} className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-card-body font-medium">{c.full_name} {c.is_main && <span className="text-[10px] ml-1 text-primary uppercase tracking-[0.15em]">Main</span>}</p>
                  <p className="text-xs lynck-muted">{c.role} · {c.email}</p>
                </div>
                {c.is_report_recipient && <span className="text-[10px] uppercase tracking-[0.15em] text-status-good">Recipient</span>}
              </li>
            ))}
          </ul>
        </div>
        <div className="lynck-card p-5">
          <p className="lynck-section-label mb-3 inline-flex items-center gap-2"><Building2 className="size-3" /> Google Ads accounts</p>
          {accounts.length === 0 && <p className="text-card-body lynck-muted">No accounts linked.</p>}
          <ul className="space-y-3">
            {accounts.map((a) => (
              <li key={a.id} className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-card-body font-medium">{a.label}</p>
                  <p className="text-xs lynck-muted">Customer ID · {a.google_ads_customer_id || "—"}</p>
                </div>
                <span className="text-[10px] uppercase tracking-[0.15em] lynck-muted">{a.data_source_status}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className="lynck-section-label mb-3 inline-flex items-center gap-2"><FileText className="size-3" /> Report history</p>
      <div className="lynck-card overflow-hidden">
        <table className="w-full text-card-body">
          <thead>
            <tr className="text-left lynck-muted text-[11px] uppercase tracking-[0.15em]">
              <th className="px-5 py-3 font-medium">Month</th>
              <th className="px-5 py-3 font-medium">Title</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {reports.length === 0 && (
              <tr><td colSpan={4} className="px-5 py-8 text-center lynck-muted">No reports yet.</td></tr>
            )}
            {reports.map((r) => (
              <tr key={r.id} className="border-t border-border hover:bg-secondary/40">
                <td className="px-5 py-4">{fmtMonthShort(r.period_month)}</td>
                <td className="px-5 py-4">{r.title}</td>
                <td className="px-5 py-4"><StatusBadge variant="report" value={r.status} /></td>
                <td className="px-5 py-4 text-right">
                  <Button asChild variant="ghost" size="sm"><Link to={`/reports/${r.id}`}>Open</Link></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageContainer>
  );
}
