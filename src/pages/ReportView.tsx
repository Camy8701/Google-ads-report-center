import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Wordmark } from "@/components/Wordmark";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { fmtMonth, fmtNum, fmtMoney, fmtPct, fmtDate, delta } from "@/lib/format";
import { getClientReportGoal, getReportGoalFamily, getReportGoalLabel, getVisibleBrandNotes, type ReportGoal, type ReportGoalFamily } from "@/lib/reportGoal";
import { ArrowLeft, Save, Sparkles, Printer, CheckCircle2, FileDown, ArrowUp, ArrowDown, Minus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface SectionRow { id: string; kind: string; position: number; title: string; body: string; data: any; }
interface MetricsRow {
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  cost: number;
  conversions: number;
  conversion_rate: number;
  cpa: number;
  conversion_value: number;
  roas: number;
  prior: any;
  top_campaigns: any[];
  top_keywords: any[];
  top_products: any[];
}
interface RecRow { id: string; position: number; title: string; why: string; expected_impact: string; urgency: string; }

const reportPalette = {
  bg: "#121416",
  surface: "#1B1F24",
  surfaceAlt: "#20262D",
  border: "#313942",
  grid: "#313942",
  text: "#F5F3EE",
  muted: "#9A958B",
  accent: "#EC8A1D",
  data: "#8FA9C7",
  dataDeep: "#6F8298",
  dataStone: "#B7A594",
  good: "#3ECF8E",
  medium: "#F5C842",
  urgent: "#F5634A",
};

const chartPalette = [reportPalette.accent, reportPalette.data, reportPalette.dataDeep, reportPalette.dataStone, "#596575"];

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
  const [syncing, setSyncing] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const syncFromGoogleAds = async () => {
    setSyncing(true);
    try {
      let adAccountId = report?.ad_account_id as string | undefined;
      // Fall back to the client's first ad account with a customer ID
      if (!adAccountId && report?.client_id) {
        const { data: accts } = await supabase
          .from("ad_accounts")
          .select("id, google_ads_customer_id, created_at")
          .eq("client_id", report.client_id)
          .order("created_at", { ascending: true });
        const firstWithId = (accts || []).find((a: any) => (a.google_ads_customer_id || "").trim());
        if (firstWithId) {
          adAccountId = firstWithId.id;
          // Persist the link so future syncs/exports use it directly
          await supabase.from("reports").update({ ad_account_id: adAccountId }).eq("id", report.id);
        }
      }
      if (!adAccountId) {
        toast.error("This report has no ad account linked. Add a Google Ads customer ID on the client page first.");
        return;
      }
      const { data, error } = await supabase.functions.invoke("sync-google-ads", {
        body: {
          ad_account_id: adAccountId,
          period_month: report.period_month,
          report_id: report.id,
        },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast.success(`Synced from Google Ads (${(data as any)?.currency || "—"})`);
      load();
    } catch (e: any) {
      toast.error("Sync failed: " + (e?.message || "unknown"));
    } finally {
      setSyncing(false);
    }
  };

  const exportPdf = async () => {
    if (!reportRef.current) return;
    setExporting(true);
    try {
      reportRef.current.setAttribute("data-exporting-pdf", "true");
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidthMm = 210;
      const pageHeightMm = 297;
      const marginMm = 10;
      const contentWidthMm = pageWidthMm - marginMm * 2;
      const contentHeightMm = pageHeightMm - marginMm * 2;
      const bg = reportPalette.bg;

      const paintPageBg = () => {
        pdf.setFillColor(8, 8, 8);
        pdf.rect(0, 0, pageWidthMm, pageHeightMm, "F");
      };

      const blocks = Array.from(reportRef.current.querySelectorAll<HTMLElement>(".print-page"));
      if (blocks.length === 0) blocks.push(reportRef.current);

      paintPageBg();
      let cursorY = marginMm;
      let isFirstPage = true;

      for (const block of blocks) {
        const canvas = await html2canvas(block, {
          scale: 2,
          useCORS: true,
          backgroundColor: bg,
          logging: false,
        });
        const imgData = canvas.toDataURL("image/png");
        const blockHeightMm = (canvas.height * contentWidthMm) / canvas.width;

        if (!isFirstPage && cursorY + blockHeightMm > pageHeightMm - marginMm) {
          pdf.addPage();
          paintPageBg();
          cursorY = marginMm;
        }
        isFirstPage = false;

        if (blockHeightMm <= contentHeightMm) {
          pdf.addImage(imgData, "PNG", marginMm, cursorY, contentWidthMm, blockHeightMm);
          cursorY += blockHeightMm + 6;
        } else {
          const pxPerMm = canvas.width / contentWidthMm;
          const sliceHeightPx = Math.floor(contentHeightMm * pxPerMm);
          let renderedPx = 0;
          let firstSlice = true;
          while (renderedPx < canvas.height) {
            if (!firstSlice) {
              pdf.addPage();
              paintPageBg();
              cursorY = marginMm;
            }
            const remainingPx = canvas.height - renderedPx;
            const thisSlicePx = Math.min(sliceHeightPx, remainingPx);
            const sliceCanvas = document.createElement("canvas");
            sliceCanvas.width = canvas.width;
            sliceCanvas.height = thisSlicePx;
            const ctx = sliceCanvas.getContext("2d")!;
            ctx.fillStyle = bg;
            ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
            ctx.drawImage(canvas, 0, -renderedPx);
            const sliceData = sliceCanvas.toDataURL("image/png");
            const sliceHeightMm = (thisSlicePx * contentWidthMm) / canvas.width;
            pdf.addImage(sliceData, "PNG", marginMm, cursorY, contentWidthMm, sliceHeightMm);
            cursorY += sliceHeightMm + 6;
            renderedPx += thisSlicePx;
            firstSlice = false;
          }
        }
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
      reportRef.current?.removeAttribute("data-exporting-pdf");
      setExporting(false);
    }
  };

  const load = async () => {
    if (!id) return;
    const { data: r } = await supabase.from("reports").select("*, clients(*)").eq("id", id).single();
    const { data: s } = await supabase.from("report_sections").select("*").eq("report_id", id).order("position");
    const { data: m } = await supabase.from("report_metrics").select("*").eq("report_id", id).single();
    const { data: rc } = await supabase.from("report_recommendations").select("*").eq("report_id", id).order("position");
    setReport(r);
    setClient(r?.clients);
    setSections((s as any) || []);
    setMetrics(m as any);
    setRecs((rc as any) || []);
  };
  useEffect(() => { load(); }, [id]);

  const saveSection = async (s: SectionRow) => {
    const newBody = editing[s.id] ?? s.body;
    const { error } = await supabase.from("report_sections").update({ body: newBody }).eq("id", s.id);
    if (error) return toast.error(error.message);
    toast.success(`${s.title} saved`);
    setEditing((e) => {
      const n = { ...e };
      delete n[s.id];
      return n;
    });
    load();
  };

  const regenerate = async (s: SectionRow) => {
    if (!metrics || !client) return;
    setRegenerating(s.id);
    try {
      const { data, error } = await supabase.functions.invoke("regenerate-section", {
        body: {
          section_kind: s.kind,
          client: {
            name: client.name,
            business_type: client.business_type,
            brand_notes: getVisibleBrandNotes(client.brand_notes),
            report_goal: getClientReportGoal(client.brand_notes, client.business_type),
          },
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
    } finally {
      setRegenerating(null);
    }
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

  const reportGoal = getClientReportGoal(client?.brand_notes, client?.business_type);
  const goalFamily = getReportGoalFamily(reportGoal);
  const summaryData = summary?.data || {};
  const takeaways: string[] = Array.isArray(summaryData.takeaways) ? summaryData.takeaways : [];
  const timeline = Array.isArray(summaryData.timeline) && summaryData.timeline.length ? summaryData.timeline : buildFallbackTimeline(metrics);
  const conversionSplit = Array.isArray(summaryData.conversionSplit) ? summaryData.conversionSplit : [];
  const leadActions = Array.isArray(summaryData.leadActions) ? summaryData.leadActions : [];
  const driverCards = Array.isArray(whatChanged?.data?.drivers) ? whatChanged?.data?.drivers : [];
  const heroMetrics = getHeroMetrics(goalFamily, metrics, conversionSplit);
  const winners = getCampaignWinners(metrics.top_campaigns || [], goalFamily);

  return (
    <div className="report-theme min-h-screen overflow-x-hidden bg-background">
      <div className="no-print sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex flex-wrap items-center justify-between gap-4 px-5 py-[14px] sm:px-8 md:px-[60px]" style={{ maxWidth: 1060 }}>
          <Link to="/reports" className="inline-flex items-center gap-2 text-sm lynck-muted hover:text-foreground">
            <ArrowLeft className="size-4" /> All reports
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge variant="report" value={report.status} />
            <Button size="sm" variant="outline" disabled={syncing} onClick={syncFromGoogleAds}>
              <RefreshCw className={`size-4 mr-1.5 ${syncing ? "animate-spin" : ""}`} /> {syncing ? "Syncing…" : "Sync from Google Ads"}
            </Button>
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

      <div ref={reportRef} className="mx-auto px-5 py-8 sm:px-8 md:px-[60px] md:py-[60px]" style={{ maxWidth: 1060 }}>
        <header className="relative mb-12 pb-10 border-b border-border print-page">
          <div className="report-hero-orb pointer-events-none absolute -right-12 -top-10 h-[280px] w-[280px] sm:h-[340px] sm:w-[340px]" />
          <div className="relative mb-12 flex flex-wrap items-start justify-between gap-6">
            <Wordmark size="md" />
            <div className="text-right text-sm">
              <p className="lynck-section-label mb-1">Generated</p>
              <p className="lynck-muted">{fmtDate(new Date())}</p>
            </div>
          </div>
          <div className="relative flex flex-wrap items-center gap-3">
            <p className="lynck-section-label">Monthly performance report</p>
            <span className="rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.15em]" style={{ borderColor: reportPalette.border, background: reportPalette.surfaceAlt, color: reportPalette.data }}>
              Goal · {getReportGoalLabel(reportGoal)}
            </span>
          </div>
          <h1 className="lynck-hero-title relative mb-6 mt-5 max-w-4xl break-words text-[clamp(2.8rem,9vw,4.75rem)] leading-[0.96]">
            {client?.name}
            <em className="not-italic text-primary"> — {fmtMonth(report.period_month)}.</em>
          </h1>
          {summary?.body && (
            <p className="relative max-w-3xl whitespace-pre-wrap leading-relaxed text-card-body lynck-muted">
              {summary.body}
            </p>
          )}
        </header>

        <section className="mb-14 print-page">
          <div className="mb-8">
            <p className="lynck-section-label mb-3">Performance snapshot</p>
            <h2 className="font-display text-3xl md:text-4xl font-bold">
              The metrics that <em className="not-italic text-primary">matter first</em>
            </h2>
          </div>

          {takeaways.length > 0 && (
            <div className="mb-6 grid gap-3 sm:grid-cols-3">
              {takeaways.map((t, i) => (
                <div key={i} className="lynck-card p-4">
                  <p className="mb-1.5 text-[11px] uppercase tracking-[0.15em] text-primary">Takeaway {i + 1}</p>
                  <p className="text-card-body">{t}</p>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {heroMetrics.map((item) => (
              <Metric key={item.label} label={item.label} value={item.value} now={item.now} prior={item.prior} invert={item.invert} neutral={item.neutral} footnote={item.footnote} />
            ))}
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-[1.6fr_1fr]">
            <ChartCard
              label="Six-month trend"
              title={goalFamily === "ecommerce" ? "Spend vs return" : goalFamily === "lead_gen" ? "Spend vs hard output" : "Spend vs demand"}
              body="A quick read on direction matters more than a paragraph of explanation here."
            >
              <MiniTrendChart data={timeline} goal={reportGoal} />
            </ChartCard>
            <ChartCard
              label="Context"
              title={goalFamily === "ecommerce" ? "Margin-aware view" : goalFamily === "lead_gen" ? "Lead mix" : "Efficiency pulse"}
              body={goalFamily === "ecommerce"
                ? "The account is being judged on value efficiency first, scale second."
                : goalFamily === "lead_gen"
                  ? "Soft conversions still matter, but the report now keeps hard conversions at the center."
                  : "This account is being read through momentum, traffic quality, and efficient reach."}
            >
              {goalFamily === "lead_gen" ? (
                <SplitMiniCard split={conversionSplit} />
              ) : (
                <div className="grid gap-3">
                  <PulseLine label="MoM cost delta" value={Math.abs(delta(metrics.cost, metrics.prior?.cost || 0).pct).toFixed(1) + "%"} tone="info" />
                  <PulseLine label={goalFamily === "ecommerce" ? "ROAS benchmark" : "Conversion pressure"} value={goalFamily === "ecommerce" ? `${metrics.roas.toFixed(2)}x` : `${fmtNum(metrics.conversions)} conversions`} tone="good" />
                  <PulseLine label="Brand notes" value={getVisibleBrandNotes(client?.brand_notes) || "No additional briefing notes attached."} tone="muted" long />
                </div>
              )}
            </ChartCard>
          </div>
        </section>

        <section className="mb-14 print-page">
          <div className="mb-8">
            <p className="lynck-section-label mb-3">Campaign comparison</p>
            <h2 className="font-display text-3xl md:text-4xl font-bold">
              Where budget <em className="not-italic text-primary">did the work</em>
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-[1.45fr_1fr]">
            <ChartCard label="Performance comparison" title="Campaign ladder">
              <CampaignComparisonChart campaigns={metrics.top_campaigns || []} goal={reportGoal} />
            </ChartCard>
            <ChartCard label="Budget allocation" title="Spend share">
              <SpendShareChart campaigns={metrics.top_campaigns || []} totalSpend={metrics.cost} />
            </ChartCard>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <WinnerCard title="Top winner" campaign={winners.best} goal={reportGoal} />
            <WinnerCard title="Weakest pocket" campaign={winners.weakest} goal={reportGoal} inverse />
          </div>
        </section>

        <section className="mb-14 print-page">
          <Section
            kind="what_changed"
            section={whatChanged}
            editing={editing}
            setEditing={setEditing}
            onSave={saveSection}
            onRegenerate={regenerate}
            regenerating={regenerating}
            printPage={false}
            extra={driverCards.length > 0 ? <DriverGrid drivers={driverCards} /> : null}
          />

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            <ChartCard label="Search insight" title="Keyword pressure">
              <KeywordInsightChart keywords={metrics.top_keywords || []} goal={reportGoal} />
            </ChartCard>
            {goalFamily === "ecommerce" ? (
              <ChartCard label="Product insight" title="Revenue concentration">
                <ProductInsightChart products={metrics.top_products || []} />
              </ChartCard>
            ) : goalFamily === "lead_gen" ? (
              <ChartCard label="Lead insight" title="Hard vs soft conversions">
                <LeadInsightPanel split={conversionSplit} actions={leadActions} />
              </ChartCard>
            ) : (
              <ChartCard label="Growth insight" title="Momentum signals">
                <GrowthInsightPanel metrics={metrics} keywords={metrics.top_keywords || []} />
              </ChartCard>
            )}
          </div>

          {opportunities?.body && (
            <div className="mt-4">
              <InsightNote label="Optimization lens" body={opportunities.body} />
            </div>
          )}
        </section>

        <SectionWrap label="Decision page" title="Recommended" emphasize="actions">
          <p className="mb-6 max-w-2xl text-card-body lynck-muted">{decision?.body || "Three priorities for next month, ordered by expected impact."}</p>
          <div className="space-y-4">
            {recs.map((r, i) => (
              <div key={r.id} className="lynck-card p-6">
                <div className="mb-3 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="lynck-section-label mt-1.5">{String(i + 1).padStart(2, "0")}</div>
                    <h3 className="font-display text-xl font-bold">{r.title}</h3>
                  </div>
                  <StatusBadge variant="urgency" value={r.urgency} />
                </div>
                <div className="grid gap-5 md:grid-cols-2 pl-12">
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

        {appendix?.body && (
          <Section
            kind="appendix"
            section={appendix}
            editing={editing}
            setEditing={setEditing}
            onSave={saveSection}
            onRegenerate={regenerate}
            regenerating={regenerating}
          />
        )}

        <footer className="mt-16 flex items-center justify-between border-t border-border pt-8 text-xs lynck-muted">
          <Wordmark size="sm" />
          <span>Always optimizing — LYNCK Studio</span>
        </footer>
      </div>
    </div>
  );
}

function SectionWrap({
  label,
  title,
  emphasize,
  children,
}: {
  label: string;
  title: string;
  emphasize?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-14 print-page">
      <p className="lynck-section-label mb-3">{label}</p>
      <h2 className="mb-6 font-display text-3xl font-bold md:text-4xl">
        {title}
        {emphasize && <em className="not-italic text-primary"> {emphasize}</em>}
      </h2>
      {children}
    </section>
  );
}

function Section({
  kind,
  section,
  editing,
  setEditing,
  onSave,
  onRegenerate,
  regenerating,
  extra,
  printPage = true,
}: {
  kind: string;
  section?: SectionRow;
  editing: Record<string, string>;
  setEditing: any;
  onSave: (s: SectionRow) => void;
  onRegenerate: (s: SectionRow) => void;
  regenerating: string | null;
  extra?: React.ReactNode;
  printPage?: boolean;
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
    <section className={`${printPage ? "print-page" : ""} mb-14`}>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="lynck-section-label mb-3">{t.label}</p>
          <h2 className="font-display text-3xl font-bold md:text-4xl">
            {t.title}
            <em className="not-italic text-primary"> {t.em}</em>
          </h2>
        </div>
        <div className="no-print pdf-export-hidden flex gap-2">
          {!isEditing && <Button size="sm" variant="ghost" onClick={() => setEditing({ ...editing, [section.id]: section.body })}>Edit</Button>}
          {isEditing && (
            <>
              <Button size="sm" variant="ghost" onClick={() => { const n = { ...editing }; delete n[section.id]; setEditing(n); }}>Cancel</Button>
              <Button size="sm" onClick={() => onSave(section)}><Save className="size-3.5 mr-1.5" />Save</Button>
            </>
          )}
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
          <p className="whitespace-pre-wrap leading-relaxed text-card-body">{section.body}</p>
        )}
      </div>
      {extra}
    </section>
  );
}

function Metric({
  label,
  value,
  now,
  prior,
  invert,
  neutral,
  footnote,
}: {
  label: string;
  value: string;
  now: number;
  prior?: number;
  invert?: boolean;
  neutral?: boolean;
  footnote?: string;
}) {
  const d = prior != null ? delta(Number(now), Number(prior)) : null;
  const isGood = !d ? false : neutral ? false : invert ? d.dir === "down" : d.dir === "up";
  const isBad = !d ? false : neutral ? false : invert ? d.dir === "up" : d.dir === "down";
  const color = isGood ? "text-status-good" : isBad ? "text-status-urgent" : "text-muted-foreground";
  const Icon = d?.dir === "up" ? ArrowUp : d?.dir === "down" ? ArrowDown : Minus;

  return (
    <div className="lynck-card p-5">
      <p className="mb-2 text-[11px] uppercase tracking-[0.15em] lynck-muted">{label}</p>
      <p className="mb-1 font-display text-2xl font-bold">{value}</p>
      {d && (
        <p className={`inline-flex items-center gap-1 text-xs ${color}`}>
          <Icon className="size-3" /> {Math.abs(d.pct).toFixed(1)}% MoM
        </p>
      )}
      {footnote && <p className="mt-3 text-xs" style={{ color: reportPalette.data }}>{footnote}</p>}
    </div>
  );
}

function ChartCard({
  label,
  title,
  body,
  children,
}: {
  label: string;
  title: string;
  body?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="lynck-card p-5">
      <p className="lynck-section-label mb-2">{label}</p>
      <h3 className="font-display text-2xl font-bold">{title}</h3>
      {body && <p className="mt-2 mb-4 max-w-xl text-sm lynck-muted">{body}</p>}
      {children}
    </div>
  );
}

function MiniTrendChart({ data, goal }: { data: any[]; goal: ReportGoal }) {
  const secondaryKey = goal === "ecommerce" ? "roas" : goal === "lead_gen" ? "conversions" : "clicks";
  const secondaryLabel = goal === "ecommerce" ? "ROAS" : goal === "lead_gen" ? "Conversions" : "Clicks";
  return (
    <div className="h-[250px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ left: 0, right: 8, top: 12, bottom: 0 }}>
          <CartesianGrid stroke={reportPalette.grid} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: reportPalette.muted, fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis yAxisId="left" tick={{ fill: reportPalette.muted, fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis yAxisId="right" orientation="right" tick={{ fill: reportPalette.muted, fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ background: reportPalette.surfaceAlt, border: `1px solid ${reportPalette.border}`, borderRadius: 12, color: reportPalette.text }}
            formatter={(value: any, name: string) => [name === "Cost" ? fmtMoney(Number(value)) : name === "ROAS" ? `${Number(value).toFixed(2)}x` : fmtNum(Number(value)), name]}
          />
          <Line yAxisId="left" type="monotone" dataKey="cost" name="Cost" stroke={reportPalette.accent} strokeWidth={3} dot={{ r: 3, fill: reportPalette.accent }} />
          <Line yAxisId="right" type="monotone" dataKey={secondaryKey} name={secondaryLabel} stroke={reportPalette.data} strokeWidth={2.5} dot={{ r: 3, fill: reportPalette.data }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function SplitMiniCard({ split }: { split: any[] }) {
  return (
    <div className="space-y-4">
      {split.map((item) => (
        <div key={item.label}>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span>{item.label}</span>
            <span className="font-medium">{fmtNum(item.value)}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full" style={{ background: reportPalette.surfaceAlt }}>
            <div className="h-full rounded-full" style={{ width: `${(item.value / Math.max(split.reduce((sum, s) => sum + s.value, 0), 1)) * 100}%`, background: item.color }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function PulseLine({ label, value, tone, long }: { label: string; value: string; tone: "good" | "info" | "muted"; long?: boolean }) {
  const toneClass = tone === "good" ? "text-status-good" : tone === "info" ? "" : "lynck-muted";
  return (
    <div className="rounded-[12px] border p-4" style={{ borderColor: reportPalette.border, background: reportPalette.surfaceAlt }}>
      <p className="mb-1 text-[11px] uppercase tracking-[0.15em] lynck-muted">{label}</p>
      <p className={`${long ? "text-sm leading-relaxed" : "text-lg"} ${toneClass}`} style={tone === "info" ? { color: reportPalette.data } : undefined}>{value}</p>
    </div>
  );
}

function CampaignComparisonChart({ campaigns, goal }: { campaigns: any[]; goal: ReportGoal }) {
  const data = (campaigns || []).map((campaign) => ({
    name: campaign.name.replace(/\s*-\s*/g, " "),
    metric: goal === "ecommerce" ? campaign.roas : campaign.conversions,
    fill: campaign.status === "winner" ? reportPalette.good : campaign.status === "weak" ? reportPalette.urgent : reportPalette.data,
    label: goal === "ecommerce" ? `${campaign.roas.toFixed(2)}x ROAS` : `${fmtNum(campaign.conversions)} conv.`,
  }));
  return (
    <div className="h-[290px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 12, right: 18, top: 8, bottom: 0 }}>
          <CartesianGrid stroke={reportPalette.grid} strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" tick={{ fill: reportPalette.muted, fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="name" width={130} tick={{ fill: reportPalette.text, fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ background: reportPalette.surfaceAlt, border: `1px solid ${reportPalette.border}`, borderRadius: 12, color: reportPalette.text }}
            formatter={(value: any) => [goal === "ecommerce" ? `${Number(value).toFixed(2)}x` : fmtNum(Number(value)), goal === "ecommerce" ? "ROAS" : "Conversions"]}
          />
          <Bar dataKey="metric" radius={[8, 8, 8, 8]}>
            {data.map((entry, index) => <Cell key={index} fill={entry.fill} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function SpendShareChart({ campaigns, totalSpend }: { campaigns: any[]; totalSpend: number }) {
  const data = (campaigns || []).map((campaign: any) => ({ name: campaign.name, value: campaign.spendShare || 0 }));
  return (
    <div className="flex h-[290px] flex-col items-center justify-center">
      <ResponsiveContainer width="100%" height={210}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={58} outerRadius={86} paddingAngle={3}>
            {data.map((_: any, index: number) => <Cell key={index} fill={chartPalette[index % chartPalette.length]} />)}
          </Pie>
          <Tooltip
            contentStyle={{ background: reportPalette.surfaceAlt, border: `1px solid ${reportPalette.border}`, borderRadius: 12, color: reportPalette.text }}
            formatter={(value: any) => [`${Number(value).toFixed(1)}%`, "Spend share"]}
          />
        </PieChart>
      </ResponsiveContainer>
      <p className="text-sm lynck-muted">Tracked spend: <span className="text-foreground">{fmtMoney(totalSpend)}</span></p>
    </div>
  );
}

function WinnerCard({ title, campaign, goal, inverse = false }: { title: string; campaign?: any; goal: ReportGoal; inverse?: boolean }) {
  if (!campaign) return null;
  return (
    <div className="lynck-card p-5">
      <p className="lynck-section-label mb-2">{title}</p>
      <h3 className="font-display text-2xl font-bold">{campaign.name}</h3>
      <div className="mt-4 grid grid-cols-3 gap-3">
        <MiniStat label="Spend" value={fmtMoney(campaign.spend)} />
        <MiniStat label={goal === "ecommerce" ? "ROAS" : "Conv."} value={goal === "ecommerce" ? `${campaign.roas.toFixed(2)}x` : fmtNum(campaign.conversions)} />
        <MiniStat label={goal === "ecommerce" ? "Delta" : "CPA"} value={goal === "ecommerce" ? `${campaign.delta > 0 ? "+" : ""}${campaign.delta}%` : fmtMoney(campaign.cpa)} tone={inverse ? "warn" : "good"} />
      </div>
    </div>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: string; tone?: "good" | "warn" }) {
  return (
    <div className="rounded-[12px] border p-3" style={{ borderColor: reportPalette.border, background: reportPalette.surfaceAlt }}>
      <p className="mb-1 text-[11px] uppercase tracking-[0.15em] lynck-muted">{label}</p>
      <p className={tone === "good" ? "text-status-good" : tone === "warn" ? "text-status-medium" : "text-foreground"}>{value}</p>
    </div>
  );
}

function DriverGrid({ drivers }: { drivers: any[] }) {
  return (
    <div className="mt-4 grid gap-4 md:grid-cols-3">
      {drivers.map((driver, index) => (
        <div key={index} className="lynck-card p-4">
          <p className="lynck-section-label mb-2">{driver.label}</p>
          <p className={`text-card-body ${driver.tone === "good" ? "text-status-good" : driver.tone === "medium" ? "text-status-medium" : driver.tone === "urgent" ? "text-status-urgent" : "lynck-muted"}`}>
            {driver.detail}
          </p>
        </div>
      ))}
    </div>
  );
}

function KeywordInsightChart({ keywords, goal }: { keywords: any[]; goal: ReportGoal }) {
  const data = (keywords || []).slice(0, 4).map((keyword) => ({
    name: keyword.term,
    clicks: keyword.clicks,
    conversions: keyword.conversions,
    cpa: keyword.cpa,
  }));
  return (
    <div>
      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 0, left: -12, bottom: 0 }}>
          <CartesianGrid stroke={reportPalette.grid} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" tick={{ fill: reportPalette.muted, fontSize: 11 }} axisLine={false} tickLine={false} interval={0} angle={-10} height={56} textAnchor="end" />
          <YAxis tick={{ fill: reportPalette.muted, fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ background: reportPalette.surfaceAlt, border: `1px solid ${reportPalette.border}`, borderRadius: 12, color: reportPalette.text }}
            formatter={(value: any, name: string) => [fmtNum(Number(value)), name === "clicks" ? "Clicks" : "Conversions"]}
          />
            <Bar dataKey="clicks" fill={reportPalette.data} radius={[6, 6, 0, 0]} />
            <Bar dataKey="conversions" fill={reportPalette.accent} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-3 text-sm lynck-muted">
        {goal === "lead_gen"
          ? "Search themes are being judged on hard output, not just cheap click volume."
          : goal === "ecommerce"
            ? "The best search themes are the ones that hold conversion volume without bloating CPA."
            : "For growth accounts, the top themes should add demand without a sharp CTR drop."}
      </p>
    </div>
  );
}

function ProductInsightChart({ products }: { products: any[] }) {
  const data = (products || []).slice(0, 4).map((product) => ({
    name: product.name,
    revenue: product.revenue,
    margin: product.margin,
  }));
  return (
    <div>
      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
          <CartesianGrid stroke={reportPalette.grid} strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" tick={{ fill: reportPalette.muted, fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="name" width={110} tick={{ fill: reportPalette.text, fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip
              contentStyle={{ background: reportPalette.surfaceAlt, border: `1px solid ${reportPalette.border}`, borderRadius: 12, color: reportPalette.text }}
              formatter={(value: any, name: string) => [name === "revenue" ? fmtMoney(Number(value)) : `${Number(value).toFixed(1)}%`, name === "revenue" ? "Revenue" : "Margin"]}
            />
            <Bar dataKey="revenue" fill={reportPalette.dataStone} radius={[8, 8, 8, 8]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 space-y-2">
        {data.map((product) => (
          <div key={product.name} className="flex items-center justify-between text-sm">
            <span>{product.name}</span>
            <span style={{ color: reportPalette.data }}>Margin {Number(product.margin ?? 0).toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LeadInsightPanel({ split, actions }: { split: any[]; actions: any[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-[1fr_1fr]">
      <div className="h-[210px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={split} dataKey="value" nameKey="label" innerRadius={52} outerRadius={82}>
              {split.map((item, index) => <Cell key={index} fill={item.color || chartPalette[index % chartPalette.length]} />)}
            </Pie>
            <Tooltip
            contentStyle={{ background: reportPalette.surfaceAlt, border: `1px solid ${reportPalette.border}`, borderRadius: 12, color: reportPalette.text }}
            formatter={(value: any) => [fmtNum(Number(value)), "Conversions"]}
          />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-3">
        {actions.map((item) => (
          <div key={item.label} className="rounded-[12px] border p-4" style={{ borderColor: reportPalette.border, background: reportPalette.surfaceAlt }}>
            <p className="text-[11px] uppercase tracking-[0.15em] lynck-muted">{item.label}</p>
            <p className="mt-1 font-display text-2xl">{fmtNum(item.value)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function GrowthInsightPanel({ metrics, keywords }: { metrics: MetricsRow; keywords: any[] }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <MiniStat label="Impressions" value={fmtNum(metrics.impressions)} />
        <MiniStat label="Clicks" value={fmtNum(metrics.clicks)} />
        <MiniStat label="CTR" value={fmtPct(metrics.ctr)} />
      </div>
      <div className="rounded-[12px] border p-4" style={{ borderColor: reportPalette.border, background: reportPalette.surfaceAlt }}>
        <p className="lynck-section-label mb-2">Read on this account</p>
        <p className="text-card-body lynck-muted">
          Growth accounts should not be forced into a fake deep explanation every month. When the data says seasonality, broader demand, or softer auction pressure, this report should say that clearly and move to the next decision.
        </p>
      </div>
      <div className="space-y-2 text-sm">
        {keywords.slice(0, 3).map((keyword) => (
          <div key={keyword.term} className="flex items-center justify-between">
            <span>{keyword.term}</span>
            <span style={{ color: reportPalette.data }}>{fmtPct(keyword.ctr || 0)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function InsightNote({ label, body }: { label: string; body: string }) {
  return (
    <div className="rounded-[16px] border p-5" style={{ borderColor: reportPalette.border, background: reportPalette.surfaceAlt }}>
      <p className="lynck-section-label mb-2">{label}</p>
      <p className="text-card-body lynck-muted">{body}</p>
    </div>
  );
}

function buildFallbackTimeline(metrics: MetricsRow) {
  return [
    { label: "M-1", cost: metrics.prior?.cost || 0, conversions: metrics.prior?.conversions || 0, roas: metrics.prior?.roas || 0, cpa: metrics.prior?.cpa || 0, clicks: metrics.prior?.clicks || 0 },
    { label: "Now", cost: metrics.cost, conversions: metrics.conversions, roas: metrics.roas, cpa: metrics.cpa, clicks: metrics.clicks },
  ];
}

function getHeroMetrics(reportGoal: ReportGoal, metrics: MetricsRow, split: any[]) {
  if (goalFamily === "ecommerce") {
    return [
      { label: "Cost", value: fmtMoney(metrics.cost), now: metrics.cost, prior: metrics.prior?.cost, neutral: true },
      { label: "Conversions", value: fmtNum(metrics.conversions), now: metrics.conversions, prior: metrics.prior?.conversions },
      { label: "Conversion value", value: fmtMoney(metrics.conversion_value), now: metrics.conversion_value, prior: metrics.prior?.conversion_value },
      { label: "ROAS", value: `${metrics.roas.toFixed(2)}x`, now: metrics.roas, prior: metrics.prior?.roas, footnote: "Primary account goal" },
    ];
  }
  if (goalFamily === "lead_gen") {
    return [
      { label: "Cost", value: fmtMoney(metrics.cost), now: metrics.cost, prior: metrics.prior?.cost, neutral: true },
      { label: "Hard conversions", value: fmtNum(split.find((item) => item.label === "Hard conversions")?.value || metrics.conversions), now: split.find((item) => item.label === "Hard conversions")?.value || metrics.conversions, prior: Math.round((metrics.prior?.conversions || 0) * 0.38) },
      { label: "Soft conversions", value: fmtNum(split.find((item) => item.label === "Soft conversions")?.value || 0), now: split.find((item) => item.label === "Soft conversions")?.value || 0, prior: Math.round((metrics.prior?.conversions || 0) * 0.62), neutral: true },
      { label: "CPA", value: fmtMoney(metrics.cpa), now: metrics.cpa, prior: metrics.prior?.cpa, invert: true, footnote: "Read against hard conversions" },
    ];
  }
  return [
    { label: "Cost", value: fmtMoney(metrics.cost), now: metrics.cost, prior: metrics.prior?.cost, neutral: true },
    { label: "Clicks", value: fmtNum(metrics.clicks), now: metrics.clicks, prior: metrics.prior?.clicks },
    { label: "CTR", value: fmtPct(metrics.ctr), now: metrics.ctr, prior: metrics.prior?.ctr },
    { label: "CPC", value: fmtMoney(metrics.cpc), now: metrics.cpc, prior: metrics.prior?.cpc, invert: true, footnote: "Growth lens" },
  ];
}

function getCampaignWinners(campaigns: any[], goal: ReportGoal) {
  if (!campaigns?.length) return { best: undefined, weakest: undefined };
  const sorted = [...campaigns].sort((a, b) => {
    if (goal === "ecommerce") return (b.roas || 0) - (a.roas || 0);
    if (goal === "lead_gen") return (a.cpa || 0) - (b.cpa || 0);
    return (b.delta || 0) - (a.delta || 0);
  });
  return {
    best: sorted[0],
    weakest: sorted[sorted.length - 1],
  };
}
