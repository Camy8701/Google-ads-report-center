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
import { ArrowLeft, Save, FileText, Mail, Building2, RefreshCw, Plus, X } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { getBusinessTypeLabel, getClientReportGoal, getReportGoalLabel, getVisibleBrandNotes, withReportGoalMeta, type ReportGoal } from "@/lib/reportGoal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ClientDetail() {
  const { id } = useParams();
  const [client, setClient] = useState<any>(null);
  const [contacts, setContacts] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<any>({});
  const [syncMonth, setSyncMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [syncingAccountId, setSyncingAccountId] = useState<string | null>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [noteContent, setNoteContent] = useState<Record<string, string>>({});
  const [noteDirty, setNoteDirty] = useState<Record<string, boolean>>({});
  const [noteSaving, setNoteSaving] = useState<string | null>(null);
  const [addingTab, setAddingTab] = useState(false);
  const [newTabLabel, setNewTabLabel] = useState("");

  const load = async () => {
    if (!id) return;
    const [{ data: c }, { data: ct }, { data: ac }, { data: rp }] = await Promise.all([
      supabase.from("clients").select("*").eq("id", id).single(),
      supabase.from("client_contacts").select("*").eq("client_id", id),
      supabase.from("ad_accounts").select("*").eq("client_id", id),
      supabase.from("reports").select("*").eq("client_id", id).order("period_month", { ascending: false }),
    ]);
    setClient(c); setContacts(ct || []); setAccounts(ac || []); setReports(rp || []);
    const { data: n } = await supabase
      .from("client_notes")
      .select("*")
      .eq("client_id", id)
      .order("position");
    setNotes(n || []);
    const cm: Record<string, string> = {};
    (n || []).forEach((note: any) => { cm[note.tab_key] = note.content || ""; });
    setNoteContent(cm);
    setNoteDirty({});
    setForm({
      ...(c || {}),
      brand_notes: getVisibleBrandNotes(c?.brand_notes),
      report_goal: getClientReportGoal(c?.brand_notes, c?.business_type),
    });
  };
  useEffect(() => { load(); }, [id]);

  const save = async () => {
    const { error } = await supabase.from("clients").update({
      name: form.name, business_type: form.business_type, industry: form.industry,
      website: form.website, brand_notes: withReportGoalMeta(form.brand_notes || "", form.report_goal as ReportGoal), reporting_status: form.reporting_status,
    }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Saved");
    setEditing(false); load();
  };

  const runSync = async (accountId: string) => {
    setSyncingAccountId(accountId);
    try {
      const { data, error } = await supabase.functions.invoke("sync-google-ads", {
        body: {
          ad_account_id: accountId,
          period_month: `${syncMonth}-01`,
        },
      });
      if (error) throw error;
      toast.success(`Google Ads sync finished${data?.synced_search_terms ? ` · ${data.synced_search_terms} search terms` : ""}`);
      await load();
    } catch (e: any) {
      toast.error(e?.message || "Google Ads sync failed");
    } finally {
      setSyncingAccountId(null);
    }
  };

  const saveNote = async (tabKey: string) => {
    setNoteSaving(tabKey);
    await supabase.from("client_notes")
      .update({ content: noteContent[tabKey] ?? "", updated_at: new Date().toISOString() })
      .eq("client_id", id)
      .eq("tab_key", tabKey);
    setNoteDirty((d) => ({ ...d, [tabKey]: false }));
    setNoteSaving(null);
  };

  const addTab = async () => {
    if (!newTabLabel.trim()) return;
    const tabKey = newTabLabel.toLowerCase().replace(/[^a-z0-9]+/g, "_");
    const { error } = await supabase.from("client_notes").insert([{
      client_id: id,
      tab_key: tabKey,
      tab_label: newTabLabel.trim(),
      content: "",
      position: notes.length,
    } as any]);
    if (error) return toast.error(error.message);
    setNewTabLabel("");
    setAddingTab(false);
    load();
  };

  const deleteTab = async (tabKey: string) => {
    await supabase.from("client_notes").delete().eq("client_id", id).eq("tab_key", tabKey);
    load();
  };

  if (!client) return <PageContainer><div className="lynck-muted">Loading…</div></PageContainer>;

  return (
    <PageContainer>
      <Link to="/clients" className="inline-flex items-center gap-2 text-sm lynck-muted hover:text-foreground mb-6">
        <ArrowLeft className="size-4" /> Back to clients
      </Link>
      <PageHeader
        eyebrow={`${getBusinessTypeLabel(client.business_type)} · ${getReportGoalLabel(getClientReportGoal(client.brand_notes, client.business_type))}`}
        title={client.name}
        description={client.industry || ""}
        actions={
          <div className="flex gap-2">
            {!editing && <Button variant="outline" onClick={() => setEditing(true)}>Edit</Button>}
            {editing && <>
              <Button
                variant="ghost"
                onClick={() => {
                  setEditing(false);
                  setForm({
                    ...(client || {}),
                    brand_notes: getVisibleBrandNotes(client?.brand_notes),
                    report_goal: getClientReportGoal(client?.brand_notes, client?.business_type),
                  });
                }}
              >
                Cancel
              </Button>
              <Button onClick={save}><Save className="size-4 mr-2" />Save</Button>
            </>}
          </div>
        }
      />

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <div className="lynck-card p-5 md:col-span-2">
          <p className="lynck-section-label mb-3">Brand notes</p>
          {editing ? (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] uppercase tracking-[0.15em] lynck-muted mb-1.5 block">Business type</label>
                  <Select value={form.business_type} onValueChange={(v) => setForm({ ...form, business_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ecommerce">Ecommerce</SelectItem>
                      <SelectItem value="lead_gen">Lead gen</SelectItem>
                      <SelectItem value="local_services">Local services</SelectItem>
                      <SelectItem value="saas">SaaS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-[11px] uppercase tracking-[0.15em] lynck-muted mb-1.5 block">Reporting goal</label>
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
                </div>
              </div>
              <Textarea rows={6} value={form.brand_notes || ""} onChange={(e) => setForm({ ...form, brand_notes: e.target.value })} />
            </div>
          ) : (
            <div className="space-y-3">
              <span className="inline-flex rounded-full border border-border px-3 py-1 text-[11px] uppercase tracking-[0.15em] text-primary">
                Reporting goal · {getReportGoalLabel(getClientReportGoal(client.brand_notes, client.business_type))}
              </span>
              <p className="text-card-body whitespace-pre-wrap">{getVisibleBrandNotes(client.brand_notes) || "No brand notes yet."}</p>
            </div>
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
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <p className="lynck-section-label inline-flex items-center gap-2"><Building2 className="size-3" /> Google Ads accounts</p>
            <div className="flex items-center gap-2">
              {accounts.length > 0 && (
                <Input
                  type="month"
                  value={syncMonth}
                  onChange={(e) => setSyncMonth(e.target.value)}
                  className="h-9 w-[160px]"
                />
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  const { error } = await supabase.from("ad_accounts").insert([{
                    client_id: id, label: "Primary account", currency: "EUR", data_source_status: "mock",
                  }] as any);
                  if (error) return toast.error(error.message);
                  load();
                }}
              >
                + Add
              </Button>
            </div>
          </div>
          {accounts.length === 0 && <p className="text-card-body lynck-muted">No accounts linked.</p>}
          <ul className="space-y-4">
            {accounts.map((a) => (
              <li key={a.id} className="space-y-2 border-b border-border pb-4 last:border-0 last:pb-0">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] uppercase tracking-[0.15em] lynck-muted mb-1 block">Label</label>
                    <Input
                      defaultValue={a.label || ""}
                      onBlur={async (e) => {
                        if (e.target.value === (a.label || "")) return;
                        await supabase.from("ad_accounts").update({ label: e.target.value }).eq("id", a.id);
                        load();
                      }}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-[0.15em] lynck-muted mb-1 block">Google Ads customer ID</label>
                    <Input
                      placeholder="1234567890"
                      defaultValue={a.google_ads_customer_id || ""}
                      onBlur={async (e) => {
                        const cleaned = e.target.value.replace(/\D/g, "");
                        if (cleaned === (a.google_ads_customer_id || "")) return;
                        await supabase.from("ad_accounts").update({ google_ads_customer_id: cleaned || null }).eq("id", a.id);
                        toast.success("Customer ID saved");
                        load();
                      }}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.15em] lynck-muted">
                  <span>Status · {a.data_source_status}</span>
                  <span>{a.last_sync_at ? `Last sync · ${fmtDate(a.last_sync_at)}` : "Never synced"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-[0.15em] lynck-muted">{a.data_source_status}</span>
                  <Button size="sm" variant="outline" disabled={syncingAccountId === a.id} onClick={() => runSync(a.id)}>
                    <RefreshCw className={`size-3.5 mr-1.5 ${syncingAccountId === a.id ? "animate-spin" : ""}`} />
                    {syncingAccountId === a.id ? "Syncing…" : "Sync"}
                  </Button>
                </div>
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
              <tr key={r.id} className="crm-table-row border-t border-border">
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
      <div className="mt-8">
        <p className="lynck-section-label mb-3 inline-flex items-center gap-2">
          <FileText className="size-3" /> Client context
        </p>
        <div className="lynck-card overflow-hidden">
          {notes.length === 0 ? (
            <div className="p-8 text-center lynck-muted text-sm">No note tabs yet. They are created automatically when you add a client.</div>
          ) : (
            <Tabs defaultValue={notes[0]?.tab_key} className="w-full">
              <div className="flex items-center border-b border-border px-1 bg-surface overflow-x-auto">
                <TabsList className="h-auto bg-transparent gap-0 p-0 rounded-none">
                  {notes.map((note) => (
                    <TabsTrigger
                      key={note.tab_key}
                      value={note.tab_key}
                      className="relative rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 text-sm font-medium lynck-muted data-[state=active]:text-foreground transition-none group"
                    >
                      {note.tab_label}
                      {noteDirty[note.tab_key] && (
                        <span className="ml-1.5 inline-block size-1.5 rounded-full bg-primary" />
                      )}
                      {notes.length > 1 && (
                        <button
                          className="ml-2 opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity"
                          onClick={(e) => { e.stopPropagation(); deleteTab(note.tab_key); }}
                        >
                          <X className="size-3" />
                        </button>
                      )}
                    </TabsTrigger>
                  ))}
                </TabsList>
                <div className="ml-2 flex-shrink-0">
                  {addingTab ? (
                    <div className="flex items-center gap-2 py-2">
                      <Input
                        autoFocus
                        value={newTabLabel}
                        onChange={(e) => setNewTabLabel(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") addTab(); if (e.key === "Escape") { setAddingTab(false); setNewTabLabel(""); } }}
                        placeholder="Tab name…"
                        className="h-7 w-32 text-sm"
                      />
                      <Button size="sm" className="h-7 text-xs" onClick={addTab}>Add</Button>
                      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setAddingTab(false); setNewTabLabel(""); }}>Cancel</Button>
                    </div>
                  ) : (
                    <Button variant="ghost" size="sm" className="h-7 text-xs lynck-muted" onClick={() => setAddingTab(true)}>
                      <Plus className="size-3 mr-1" /> Add tab
                    </Button>
                  )}
                </div>
              </div>
              {notes.map((note) => (
                <TabsContent key={note.tab_key} value={note.tab_key} className="m-0 focus-visible:outline-none">
                  <div className="relative">
                    <Textarea
                      value={noteContent[note.tab_key] ?? ""}
                      onChange={(e) => {
                        setNoteContent((c) => ({ ...c, [note.tab_key]: e.target.value }));
                        setNoteDirty((d) => ({ ...d, [note.tab_key]: true }));
                      }}
                      onBlur={() => noteDirty[note.tab_key] && saveNote(note.tab_key)}
                      placeholder={
                        note.tab_key === "targets"
                          ? "Target ROAS, CPA goals, budget targets, KPIs the client tracks…"
                          : note.tab_key === "updates"
                          ? "Account changes, budget adjustments, campaign launches, pauses…"
                          : note.tab_key === "adjustments"
                          ? "Bid changes, audience tweaks, ad copy updates, structural changes…"
                          : "Add notes here…"
                      }
                      className="min-h-[280px] resize-y border-0 rounded-none focus-visible:ring-0 text-card-body leading-relaxed p-5 bg-transparent"
                      rows={12}
                    />
                    <div className="flex items-center justify-between px-5 py-2.5 border-t border-border text-xs lynck-muted">
                      <span>{note.updated_at ? `Last saved ${new Date(note.updated_at).toLocaleString()}` : "Not saved yet"}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs"
                        disabled={!noteDirty[note.tab_key] || noteSaving === note.tab_key}
                        onClick={() => saveNote(note.tab_key)}
                      >
                        <Save className="size-3 mr-1.5" />
                        {noteSaving === note.tab_key ? "Saving…" : noteDirty[note.tab_key] ? "Save" : "Saved"}
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
