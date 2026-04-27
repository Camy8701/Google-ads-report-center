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

export default function Clients() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", business_type: "ecommerce", industry: "", website: "", brand_notes: "" });

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("clients").select("*").order("name");
    setClients(data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.name.trim()) return toast.error("Client name is required");
    const { error } = await supabase.from("clients").insert([form as any]);
    if (error) return toast.error(error.message);
    toast.success("Client created");
    setOpen(false);
    setForm({ name: "", business_type: "ecommerce", industry: "", website: "", brand_notes: "" });
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
                  <Select value={form.business_type} onValueChange={(v) => setForm({ ...form, business_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ecommerce">Ecommerce</SelectItem>
                      <SelectItem value="lead_gen">Lead gen</SelectItem>
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
                <p className="text-[11px] uppercase tracking-[0.15em] lynck-muted mb-1">
                  {c.business_type === "ecommerce" ? "Ecommerce" : "Lead gen"}
                </p>
                <h3 className="font-display text-xl font-bold group-hover:text-primary transition-colors">{c.name}</h3>
              </div>
              <ArrowUpRight className="size-4 lynck-muted group-hover:text-primary transition-colors" />
            </div>
            <p className="text-card-body lynck-muted line-clamp-2 mb-4">{c.brand_notes || "No brand notes yet."}</p>
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
