import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PageContainer } from "@/components/PageContainer";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import { getBusinessTypeLabel, getClientReportGoal, getDefaultReportGoal, getReportGoalLabel, getVisibleBrandNotes, withReportGoalMeta, type ReportGoal } from "@/lib/reportGoal";

type BusinessType = "ecommerce" | "lead_gen" | "local_services" | "saas";

export default function Clients() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<{ name: string; business_type: BusinessType; report_goal: ReportGoal; industry: string; website: string; brand_notes: string; google_ads_customer_id: string; currency: string; language: string }>({
    name: "",
    business_type: "ecommerce",
    report_goal: "sales",
    industry: "",
    website: "",
    brand_notes: "",
    google_ads_customer_id: "",
    currency: "EUR",
    language: "en",
  });

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("clients").select("*").order("name");
    setClients(data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.name.trim()) return toast.error("Client name is required");
    const payload = {
      name: form.name,
      business_type: form.business_type,
      industry: form.industry,
      website: form.website,
      brand_notes: withReportGoalMeta(form.brand_notes, form.report_goal),
      language: form.language || "en",
    };
    const { data: inserted, error } = await supabase.from("clients").insert([payload as any]).select().single();
    if (error || !inserted) return toast.error(error?.message || "Failed to create client");

    const cleanCid = form.google_ads_customer_id.replace(/\D/g, "");
    if (cleanCid) {
      const { error: aaErr } = await supabase.from("ad_accounts").insert([{
        client_id: inserted.id,
        google_ads_customer_id: cleanCid,
        currency: form.currency || "EUR",
        label: form.name,
        data_source_status: "mock",
      } as any]);
      if (aaErr) toast.error(`Client created, but ad account failed: ${aaErr.message}`);
    }

    toast.success("Client created");
    await supabase.from("client_notes").insert([
      { client_id: inserted.id, tab_key: "targets", tab_label: "Targets", content: "", position: 0 },
      { client_id: inserted.id, tab_key: "updates", tab_label: "Updates", content: "", position: 1 },
      { client_id: inserted.id, tab_key: "adjustments", tab_label: "Adjustments", content: "", position: 2 },
    ] as any[]);
    setOpen(false);
    setForm({ name: "", business_type: "ecommerce", report_goal: "sales", industry: "", website: "", brand_notes: "", google_ads_customer_id: "", currency: "EUR", language: "en" });
    load();
  };

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Clients"
        title="Active"
        emphasize="roster"
        description="Every account I report on, with brand notes and contact details."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="size-4 mr-2" /> New client</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle className="font-display">New client</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <Field label="Client name">
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Acme Outdoor" />
                </Field>
                <Field label="Business type">
                  <Select value={form.business_type} onValueChange={(v: BusinessType) => setForm({ ...form, business_type: v, report_goal: getDefaultReportGoal(v) })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ecommerce">Ecommerce</SelectItem>
                      <SelectItem value="lead_gen">Lead gen</SelectItem>
                      <SelectItem value="local_services">Local services</SelectItem>
                      <SelectItem value="saas">SaaS</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Reporting goal">
                  <Select value={form.report_goal} onValueChange={(v: ReportGoal) => setForm({ ...form, report_goal: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sales">Sales</SelectItem>
                      <SelectItem value="leads">Leads</SelectItem>
                      <SelectItem value="growth">Growth</SelectItem>
                      <SelectItem value="awareness">Awareness</SelectItem>
                      <SelectItem value="website_traffic">Website traffic</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Industry">
                    <Input value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} />
                  </Field>
                  <Field label="Website">
                    <Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
                  </Field>
                </div>
                <div className="grid grid-cols-[2fr_1fr] gap-3">
                  <Field label="Google Ads customer ID">
                    <Input
                      value={form.google_ads_customer_id}
                      onChange={(e) => setForm({ ...form, google_ads_customer_id: e.target.value })}
                      placeholder="123-456-7890"
                    />
                  </Field>
                  <Field label="Currency">
                    <Input
                      value={form.currency}
                      onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase() })}
                      placeholder="EUR"
                      maxLength={3}
                    />
                  </Field>
                </div>
                <Field label="Report language">
                  <Select value={form.language} onValueChange={(v) => setForm({ ...form, language: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">🇬🇧 English</SelectItem>
                      <SelectItem value="de">🇩🇪 German</SelectItem>
                      <SelectItem value="fr">🇫🇷 French</SelectItem>
                      <SelectItem value="es">🇪🇸 Spanish</SelectItem>
                      <SelectItem value="nl">🇳🇱 Dutch</SelectItem>
                      <SelectItem value="it">🇮🇹 Italian</SelectItem>
                      <SelectItem value="pt">🇵🇹 Portuguese</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Brand notes">
                  <Textarea rows={4} value={form.brand_notes} onChange={(e) => setForm({ ...form, brand_notes: e.target.value })} placeholder="Tone, voice, KPIs to focus on…" />
                </Field>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={create}>Create client</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid sm:grid-cols-2 gap-4">
        {loading && <div className="lynck-muted">Loading…</div>}
        {clients.map((c) => (
          <Link to={`/clients/${c.id}`} key={c.id} className="lynck-card p-5 hover:border-primary/40 transition-colors group">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <p className="text-[11px] uppercase tracking-[0.15em] lynck-muted">
                    {getBusinessTypeLabel(c.business_type)}
                  </p>
                  <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-primary">
                    {getReportGoalLabel(getClientReportGoal(c.brand_notes, c.business_type))}
                  </span>
                </div>
                <h3 className="font-display text-xl font-bold group-hover:text-primary transition-colors">{c.name}</h3>
              </div>
              <ArrowUpRight className="size-4 lynck-muted group-hover:text-primary transition-colors" />
            </div>
            <p className="text-card-body lynck-muted line-clamp-2 mb-4">{getVisibleBrandNotes(c.brand_notes) || "No brand notes yet."}</p>
            <div className="flex items-center justify-between">
              <StatusBadge variant="reporting" value={c.reporting_status} />
              <span className="text-xs lynck-muted">{c.industry || "—"}</span>
            </div>
          </Link>
        ))}
      </div>
    </PageContainer>
  );
}

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <label className="text-[11px] uppercase tracking-[0.15em] lynck-muted mb-1.5 block">{label}</label>
    {children}
  </div>
);
