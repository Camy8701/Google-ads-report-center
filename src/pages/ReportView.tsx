import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Wordmark } from "@/components/Wordmark";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { fmtMonth, fmtNum, fmtMoney, fmtPct, fmtDate, delta } from "@/lib/format";
import { ArrowLeft, Save, Sparkles, Printer, CheckCircle2, FileDown, ArrowUp, ArrowDown, Minus } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface SectionRow { id: string; kind: string; position: number; title: string; body: string; data: any; }
interface MetricsRow { impressions: number; clicks: number; ctr: number; cpc: number; cost: number; conversions: number; conversion_rate: number; cpa: number; conversion_value: number; roas: number; prior: any; top_campaigns: any[]; top_keywords: any[]; top_products: any[]; }
interface RecRow { id: string; position: number; title: string; why: string; expected_impact: string; urgency: string; }

export default function ReportView() {
  const { id } = useParams();
  const [report, setReport] = useState<any>(null);
  const [client, setClient] = useState<any>(null);
  const [sections, setSections] = useState<SectionRow[]>([]);
  const [metrics, setMetrics] = useState<MetricsRow | null>(null);
  const [recs, setRecs] = useState<RecRow[]>([]);
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [regenerating, setRegenerating] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const exportPdf = async () => {
    if (!reportRef.current) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#080808",
        logging: false,
      });
      const imgWidth = 210; // A4 mm
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const pdf = new jsPDF("p", "mm", "a4");
      const imgData = canvas.toDataURL("image/png");
      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      const safe = (s: string) => s.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
      const fname = `lynck-${safe(client?.name || "client")}-${safe(fmtMonth(report.period_month))}.pdf`;
      pdf.save(fname);
      await supabase.from("reports").update({ status: "exported", exported_at: new Date().toISOString() }).eq("id", id);
      load();
      toast.success("PDF downloaded");
    } catch (e: any) {
      toast.error("Export failed: " + (e?.message || "unknown"));
    } finally {
      setExporting(false);
    }
  };

  const load = async () => {
    if (!id) return;
    const { data: r } = await supabase.from("reports").select("*, clients(*)").eq("id", id).single();
    const { data: s } = await supabase.from("report_sections").select("*").eq("report_id", id).order("position");
    const { data: m } = await supabase.from("report_metrics").select("*").eq("report_id", id).single();
    const { data: rc } = await supabase.from("report_recommendations").select("*").eq("report_id", id).order("position");
    setReport(r); setClient(r?.clients);
    setSections((s as any) || []); setMetrics(m as any); setRecs((rc as any) || []);
  };
  useEffect(() => { load(); }, [id]);

  const saveSection = async (s: SectionRow) => {
    const newBody = editing[s.id] ?? s.body;
    const { error } = await supabase.from("report_sections").update({ body: newBody }).eq("id", s.id);
    if (error) return toast.error(error.message);
    toast.success(`${s.title} saved`);
    setEditing((e) => { const n = { ...e }; delete n[s.id]; return n; });
    load();
  };

  const regenerate = async (s: SectionRow) => {
    if (!metrics || !client) return;
    setRegenerating(s.id);
    try {
      const { data, error } = await supabase.functions.invoke("regenerate-section", {
        body: {
          section_kind: s.kind,
          client: { name: client.name, business_type: client.business_type, brand_notes: client.brand_notes },
          period_month: report.period_month,
          metrics,
        },
      });
      if (error) throw error;
      const newBody = data?.body;
      if (!newBody) throw new Error("No content returned");
      await supabase.from("report_sections").update({ body: newBody }).eq("id", s.id);
      toast.success(`${s.title} regenerated`);
      load();
    } catch (e: any) {
      const msg = String(e?.message || "");
      if (msg.includes("429")) toast.error("Rate limit reached, try again in a minute.");
      else if (msg.includes("402")) toast.error("AI credits depleted. Add credits in workspace settings.");
      else toast.error("Could not regenerate: " + msg);
    } finally { setRegenerating(null); }
  };

  const setStatus = async (status: string) => {
    const patch: any = { status };
    if (status === "approved") patch.approved_at = new Date().toISOString();
    if (status === "exported") patch.exported_at = new Date().toISOString();
    await supabase.from("reports").update(patch).eq("id", id);
    toast.success(`Marked ${status.replace("_", " ")}`);
    load();
  };

  if (!report || !metrics) {
    return <div className="min-h-screen flex items-center justify-center lynck-muted">Loading report…</div>;
  }

  const sec = (kind: string) => sections.find((x) => x.kind === kind);
  const summary = sec("executive_summary");
  const whatChanged = sec("what_changed");
  const opportunities = sec("opportunities");
  const decision = sec("decision_page");
  const appendix = sec("appendix");

  const takeaways: string[] = (summary?.data?.takeaways as string[]) || [];

  return (
    <div className="min-h-screen bg-background">
      {/* TOP BAR (no print) */}
      <div className="no-print sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex items-center justify-between gap-4" style={{ maxWidth: 1060, padding: "14px 60px" }}>
          <Link to="/reports" className="inline-flex items-center gap-2 text-sm lynck-muted hover:text-foreground">
            <ArrowLeft className="size-4" /> All reports
          </Link>
          <div className="flex items-center gap-2">
            <StatusBadge variant="report" value={report.status} />
            {report.status !== "approved" && report.status !== "exported" && (
              <Button size="sm" variant="outline" onClick={() => setStatus("in_review")}>Mark in review</Button>
            )}
            {report.status !== "approved" && (
              <Button size="sm" variant="outline" onClick={() => setStatus("approved")}>
                <CheckCircle2 className="size-4 mr-1.5" /> Approve
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={() => window.print()}>
              <Printer className="size-4 mr-1.5" /> Print
            </Button>
            <Button size="sm" disabled={exporting} onClick={exportPdf}>
              <FileDown className="size-4 mr-1.5" /> {exporting ? "Exporting…" : "Export PDF"}
            </Button>
          </div>
        </div>
      </div>

      {/* REPORT BODY */}
      <div ref={reportRef} className="mx-auto" style={{ maxWidth: 1060, padding: "60px" }}>
        {/* HEADER */}
        <header className="relative mb-12 pb-10 border-b border-border print-page">
          <div className="absolute top-0 right-0 w-[520px] h-[260px] lynck-glow pointer-events-none" />
          <div className="flex items-start justify-between mb-12 relative">
            <Wordmark size="md" />
            <div className="text-right text-sm">
              <p className="lynck-section-label mb-1">Generated</p>
              <p className="lynck-muted">{fmtDate(new Date())}</p>
            </div>
          </div>
          <p className="lynck-section-label mb-4 relative">
            Monthly performance report
          </p>
          <h1 className="lynck-hero-title text-5xl md:text-6xl mb-6 relative max-w-3xl">
            {client?.name}
            <em className="not-italic text-primary"> — {fmtMonth(report.period_month)}.</em>
          </h1>
          {summary?.body && (
            <p className="text-card-body lynck-muted max-w-2xl relative whitespace-pre-wrap leading-relaxed">
              {summary.body}
            </p>
          )}
        </header>

        {/* EXECUTIVE TAKEAWAYS */}
        {takeaways.length > 0 && (
          <section className="mb-14 print-page">
            <p className="lynck-section-label mb-3">The month at a glance</p>
            <div className="grid sm:grid-cols-3 gap-3">
              {takeaways.map((t, i) => (
                <div key={i} className="lynck-card p-4">
                  <p className="text-[11px] uppercase tracking-[0.15em] text-primary mb-1.5">Takeaway {i + 1}</p>
                  <p className="text-card-body">{t}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CORE METRICS */}
        <SectionWrap label="Core performance" title="The numbers" emphasize="this month">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Metric label="Impressions" value={fmtNum(metrics.impressions)} now={metrics.impressions} prior={metrics.prior?.impressions} />
            <Metric label="Clicks" value={fmtNum(metrics.clicks)} now={metrics.clicks} prior={metrics.prior?.clicks} />
            <Metric label="CTR" value={fmtPct(metrics.ctr)} now={metrics.ctr} prior={metrics.prior?.ctr} />
            <Metric label="CPC" value={fmtMoney(metrics.cpc)} now={metrics.cpc} prior={metrics.prior?.cpc} invert />
            <Metric label="Cost" value={fmtMoney(metrics.cost)} now={metrics.cost} prior={metrics.prior?.cost} neutral />
            <Metric label="Conversions" value={fmtNum(metrics.conversions)} now={metrics.conversions} prior={metrics.prior?.conversions} />
            <Metric label="Conv. rate" value={fmtPct(metrics.conversion_rate)} now={metrics.conversion_rate} prior={metrics.prior?.conversion_rate} />
            <Metric label="CPA" value={fmtMoney(metrics.cpa)} now={metrics.cpa} prior={metrics.prior?.cpa} invert />
            {metrics.conversion_value > 0 && (
              <>
                <Metric label="Conv. value" value={fmtMoney(metrics.conversion_value)} now={metrics.conversion_value} prior={metrics.prior?.conversion_value} />
                <Metric label="ROAS" value={`${metrics.roas.toFixed(2)}x`} now={metrics.roas} prior={metrics.prior?.roas} />
              </>
            )}
          </div>
        </SectionWrap>

        {/* BEST PERFORMING */}
        <SectionWrap label="Best performing" title="What's working" emphasize="hardest">
          <div className="grid md:grid-cols-2 gap-4">
            <BestList title="Top campaigns" items={metrics.top_campaigns?.map((c: any) => ({ primary: c.name, secondary: `${fmtMoney(c.cost)} · ${c.conversions} conv${c.roas ? ` · ${c.roas}x ROAS` : ""}` }))} />
            <BestList title="Top search themes" items={metrics.top_keywords?.map((k: any) => ({ primary: k.term, secondary: `${fmtNum(k.clicks)} clicks · ${k.conversions} conv` }))} />
            {metrics.top_products?.length > 0 && (
              <div className="md:col-span-2">
                <BestList title="Top products" items={metrics.top_products.map((p: any) => ({ primary: p.name, secondary: `${p.sales} sales · ${fmtMoney(p.revenue)} revenue` }))} />
              </div>
            )}
          </div>
        </SectionWrap>

        {/* WHAT CHANGED */}
        <Section kind="what_changed" section={whatChanged} editing={editing} setEditing={setEditing} onSave={saveSection} onRegenerate={regenerate} regenerating={regenerating} />

        {/* OPPORTUNITIES */}
        <Section kind="opportunities" section={opportunities} editing={editing} setEditing={setEditing} onSave={saveSection} onRegenerate={regenerate} regenerating={regenerating} />

        {/* DECISION PAGE */}
        <SectionWrap label="Decision page" title="Recommended" emphasize="actions">
          <p className="text-card-body lynck-muted mb-6 max-w-2xl">{decision?.body || "Three priorities for next month, ordered by expected impact."}</p>
          <div className="space-y-4">
            {recs.map((r, i) => (
              <div key={r.id} className="lynck-card p-6">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-start gap-4">
                    <div className="lynck-section-label mt-1.5">{String(i + 1).padStart(2, "0")}</div>
                    <h3 className="font-display text-xl font-bold">{r.title}</h3>
                  </div>
                  <StatusBadge variant="urgency" value={r.urgency} />
                </div>
                <div className="grid md:grid-cols-2 gap-5 pl-12">
                  <div>
                    <p className="lynck-section-label mb-1.5">Why it matters</p>
                    <p className="text-card-body">{r.why}</p>
                  </div>
                  <div>
                    <p className="lynck-section-label mb-1.5">Expected impact</p>
                    <p className="text-card-body">{r.expected_impact}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionWrap>

        {/* APPENDIX */}
        {appendix?.body && (
          <Section kind="appendix" section={appendix} editing={editing} setEditing={setEditing} onSave={saveSection} onRegenerate={regenerate} regenerating={regenerating} />
        )}

        <footer className="mt-16 pt-8 border-t border-border flex items-center justify-between text-xs lynck-muted">
          <Wordmark size="sm" />
          <span>Always optimizing — LYNCK Studio</span>
        </footer>
      </div>
    </div>
  );
}

/* ---------- Sub-components ---------- */

function SectionWrap({ label, title, emphasize, children }: { label: string; title: string; emphasize?: string; children: React.ReactNode }) {
  return (
    <section className="mb-14 print-page">
      <p className="lynck-section-label mb-3">{label}</p>
      <h2 className="font-display text-3xl md:text-4xl font-bold mb-6">
        {title}{emphasize && <em className="not-italic text-primary"> {emphasize}</em>}
      </h2>
      {children}
    </section>
  );
}

function Section({
  kind, section, editing, setEditing, onSave, onRegenerate, regenerating, extra,
}: {
  kind: string; section?: SectionRow; editing: Record<string, string>; setEditing: any;
  onSave: (s: SectionRow) => void; onRegenerate: (s: SectionRow) => void; regenerating: string | null; extra?: React.ReactNode;
}) {
  if (!section) return null;
  const titleMap: Record<string, { label: string; title: string; em: string }> = {
    executive_summary: { label: "Executive summary", title: "The month at", em: "a glance" },
    what_changed: { label: "What changed", title: "Why the numbers", em: "moved" },
    opportunities: { label: "Opportunities", title: "Where to lean", em: "in next" },
    appendix: { label: "Appendix", title: "Supporting", em: "detail" },
  };
  const t = titleMap[kind] || { label: section.title, title: section.title, em: "" };
  const isEditing = editing[section.id] !== undefined;
  return (
    <section className="mb-14 print-page">
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <p className="lynck-section-label mb-3">{t.label}</p>
          <h2 className="font-display text-3xl md:text-4xl font-bold">
            {t.title}<em className="not-italic text-primary"> {t.em}</em>
          </h2>
        </div>
        <div className="no-print flex gap-2">
          {!isEditing && <Button size="sm" variant="ghost" onClick={() => setEditing({ ...editing, [section.id]: section.body })}>Edit</Button>}
          {isEditing && <>
            <Button size="sm" variant="ghost" onClick={() => { const n = { ...editing }; delete n[section.id]; setEditing(n); }}>Cancel</Button>
            <Button size="sm" onClick={() => onSave(section)}><Save className="size-3.5 mr-1.5" />Save</Button>
          </>}
          <Button size="sm" variant="outline" disabled={regenerating === section.id} onClick={() => onRegenerate(section)}>
            <Sparkles className="size-3.5 mr-1.5" />
            {regenerating === section.id ? "Regenerating…" : "Regenerate"}
          </Button>
        </div>
      </div>
      <div className="lynck-card p-6">
        {isEditing ? (
          <Textarea rows={6} value={editing[section.id]} onChange={(e) => setEditing({ ...editing, [section.id]: e.target.value })} className="text-card-body" />
        ) : (
          <p className="text-card-body whitespace-pre-wrap leading-relaxed">{section.body}</p>
        )}
      </div>
      {extra}
    </section>
  );
}

function Metric({ label, value, now, prior, invert, neutral }: { label: string; value: string; now: number; prior?: number; invert?: boolean; neutral?: boolean }) {
  const d = prior != null ? delta(Number(now), Number(prior)) : null;
  const isGood = !d ? false : neutral ? false : invert ? d.dir === "down" : d.dir === "up";
  const isBad = !d ? false : neutral ? false : invert ? d.dir === "up" : d.dir === "down";
  const color = isGood ? "text-status-good" : isBad ? "text-status-urgent" : "text-muted-foreground";
  const Icon = d?.dir === "up" ? ArrowUp : d?.dir === "down" ? ArrowDown : Minus;
  return (
    <div className="lynck-card p-4">
      <p className="text-[11px] uppercase tracking-[0.15em] lynck-muted mb-2">{label}</p>
      <p className="font-display text-2xl font-bold mb-1">{value}</p>
      {d && (
        <p className={`text-xs inline-flex items-center gap-1 ${color}`}>
          <Icon className="size-3" /> {Math.abs(d.pct).toFixed(1)}% MoM
        </p>
      )}
    </div>
  );
}

function BestList({ title, items }: { title: string; items?: { primary: string; secondary: string }[] }) {
  if (!items?.length) return null;
  return (
    <div className="lynck-card p-5">
      <p className="lynck-section-label mb-3">{title}</p>
      <ul className="space-y-3">
        {items.map((it, i) => (
          <li key={i} className="flex items-start justify-between gap-3 pb-3 border-b border-border last:border-0 last:pb-0">
            <span className="text-card-body font-medium">{it.primary}</span>
            <span className="text-xs lynck-muted text-right shrink-0">{it.secondary}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
