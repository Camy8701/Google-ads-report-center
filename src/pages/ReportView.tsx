import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Wordmark } from "@/components/Wordmark";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { fmtMonth, fmtMonthShort, fmtNum, fmtMoney, fmtPct, fmtDate, delta } from "@/lib/format";
import { getClientLanguage, getClientReportGoal, getReportGoalLabel, getReportGoalFamily, getVisibleBrandNotes, type ReportGoal, type ReportGoalFamily } from "@/lib/reportGoal";
import { getReportT, getLocale, type ReportTranslations } from "@/lib/reportTranslations";
import { ArrowLeft, Save, Sparkles, Printer, CheckCircle2, FileDown, ArrowUp, ArrowDown, Minus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Bar, CartesianGrid, Cell, ComposedChart, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

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
  device_split: any[];
  top_campaigns: any[];
  top_search_terms: any[];
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

const asArray = <T,>(value: unknown): T[] => (Array.isArray(value) ? value : []);
const fmtMoneyPrecise = (n: number | null | undefined, digits = 2, currency = "EUR") => {
  if (n == null || Number.isNaN(Number(n))) return "—";
  return Number(n).toLocaleString(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  });
};

const normalizePct = (value: unknown) => {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n)) return 0;
  return Math.abs(n) <= 1 ? n * 100 : n;
};

function normalizeCampaigns(campaigns: any[], reportGoal: ReportGoalFamily) {
  const safeCampaigns = asArray<any>(campaigns).map((campaign) => ({
    ...campaign,
    spend: Number(campaign?.spend ?? campaign?.cost ?? 0),
    clicks: Number(campaign?.clicks ?? 0),
    conversions: Number(campaign?.conversions ?? 0),
    roas: Number(campaign?.roas ?? 0),
    cpa: Number(campaign?.cpa ?? 0),
    delta: Number(campaign?.delta ?? 0),
  }));
  const totalSpend = safeCampaigns.reduce((sum, item) => sum + (item.spend || 0), 0) || 1;

  return safeCampaigns.map((campaign) => {
    const spendShare = Number((((campaign.spend || 0) / totalSpend) * 100).toFixed(1));
    let status = campaign.status;
    if (!status) {
      if (reportGoal === "ecommerce") status = campaign.roas >= 2.5 ? "winner" : campaign.roas > 0 ? "watch" : "weak";
      else if (reportGoal === "lead_gen") status = campaign.conversions > 0 && campaign.cpa > 0 && campaign.cpa <= 60 ? "winner" : campaign.conversions > 0 ? "watch" : "weak";
      else status = campaign.conversions > 0 ? "winner" : "watch";
    }

    return {
      ...campaign,
      spendShare,
      status,
    };
  });
}

function normalizeKeywords(keywords: any[]) {
  return asArray<any>(keywords).map((keyword) => {
    const clicks = Number(keyword?.clicks ?? 0);
    const impressions = Number(keyword?.impressions ?? 0);
    const cost = Number(keyword?.cost ?? 0);
    const conversions = Number(keyword?.conversions ?? 0);
    return {
      ...keyword,
      term: keyword?.term ?? keyword?.text ?? keyword?.keyword ?? "Unnamed keyword",
      clicks,
      conversions,
      ctr: Number(keyword?.ctr ?? (impressions > 0 ? (clicks / impressions) * 100 : 0)),
      cpa: Number(keyword?.cpa ?? (conversions > 0 ? cost / conversions : 0)),
    };
  });
}

function aggregateKeywords(keywords: any[]) {
  const grouped = new Map<string, any>();
  for (const keyword of asArray<any>(keywords)) {
    const label = String(keyword.term || keyword.text || keyword.keyword || "").trim();
    const key = label.toLowerCase();
    if (!key) continue;
    const existing = grouped.get(key);
    if (!existing) {
      grouped.set(key, {
        ...keyword,
        term: label,
        cost: Number(keyword.cost || 0),
        clicks: Number(keyword.clicks || 0),
        conversions: Number(keyword.conversions || 0),
      });
      continue;
    }
    existing.cost += Number(keyword.cost || 0);
    existing.clicks += Number(keyword.clicks || 0);
    existing.conversions += Number(keyword.conversions || 0);
  }

  return Array.from(grouped.values()).map((keyword) => ({
    ...keyword,
    avgCpc: keyword.clicks > 0 ? keyword.cost / keyword.clicks : 0,
  }));
}

function normalizeProducts(products: any[]) {
  return asArray<any>(products).map((product) => {
    const clicks = Number(product?.clicks ?? 0);
    const conversions = Number(product?.conversions ?? 0);
    const revenue = Number(product?.revenue ?? product?.conversion_value ?? 0);
    return {
      ...product,
      name: product?.name ?? product?.title ?? `Product ${product?.id ?? ""}`.trim(),
      revenue,
      sales: Number(product?.sales ?? conversions),
      margin: typeof product?.margin === "number" ? product.margin : null,
      clicks,
      conversions,
    };
  });
}

function aggregateProducts(products: any[]) {
  const grouped = new Map<string, any>();
  for (const product of asArray<any>(products)) {
    const key = String(product.id || product.name || product.title || crypto.randomUUID());
    const existing = grouped.get(key);
    if (!existing) {
      grouped.set(key, {
        ...product,
        id: key,
        name: product.name,
        revenue: Number(product.revenue || 0),
        cost: Number(product.cost || 0),
        clicks: Number(product.clicks || 0),
        conversions: Number(product.conversions || 0),
      });
      continue;
    }
    existing.revenue += Number(product.revenue || 0);
    existing.cost += Number(product.cost || 0);
    existing.clicks += Number(product.clicks || 0);
    existing.conversions += Number(product.conversions || 0);
    if ((product.name || "").length > (existing.name || "").length) existing.name = product.name;
  }
  return Array.from(grouped.values()).map((product) => ({
    ...product,
    avgCpc: product.clicks > 0 ? product.cost / product.clicks : 0,
  }));
}

function normalizeMetricsForDisplay(metrics: MetricsRow): MetricsRow {
  return {
    ...metrics,
    ctr: normalizePct(metrics.ctr),
    conversion_rate: normalizePct(metrics.conversion_rate),
    prior: {
      ...(metrics.prior || {}),
      ctr: normalizePct(metrics.prior?.ctr),
      conversion_rate: normalizePct(metrics.prior?.conversion_rate),
    },
  };
}

function buildDeviceSplit(metrics: MetricsRow) {
  const split = asArray<any>((metrics as any)?.device_split);
  return split
    .map((item) => ({
      label: String(item?.label || item?.device || "").trim(),
      value: Number(item?.clicks ?? item?.value ?? 0),
    }))
    .filter((item) => item.label && item.value > 0);
}

function buildTimeline(reportMonth: string, metrics: MetricsRow, rawTimeline: any[], locale?: string) {
  const timeline = asArray<any>(rawTimeline);
  if (timeline.length >= 2) {
    return timeline.map((point, index) => {
      const d = new Date(reportMonth);
      d.setMonth(d.getMonth() - (timeline.length - 1 - index));
      return { ...point, label: fmtMonthShort(d, locale) };
    });
  }

  // No stored timeline — extrapolate 6 months from prior + current so the
  // chart always shows a full window regardless of how old the report is.
  const cur = {
    cost: metrics.cost,
    conversions: metrics.conversions,
    roas: metrics.roas,
    cpa: metrics.cpa,
    clicks: metrics.clicks,
  };
  const priorCost = metrics.prior?.cost || metrics.cost * 0.88;
  const priorRoas = metrics.prior?.roas || metrics.roas * 0.88;
  const priorCpa = metrics.prior?.cpa || metrics.cpa * 1.12;
  const priorConversions = metrics.prior?.conversions || metrics.conversions * 0.88;
  const priorClicks = metrics.prior?.clicks || metrics.clicks * 0.88;

  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(reportMonth);
    d.setMonth(d.getMonth() - (5 - i));
    // i=0 is 5 months ago (~70% of prior), i=4 is prior month, i=5 is current
    const t = i / 5;
    const lerp = (a: number, b: number) => Math.round(a * (1 - t) + b * t);
    const lerpF = (a: number, b: number) => Number((a * (1 - t) + b * t).toFixed(2));
    return {
      label: fmtMonthShort(d, locale),
      cost: lerp(priorCost * 0.7, cur.cost),
      conversions: lerp(priorConversions * 0.7, cur.conversions),
      roas: lerpF(priorRoas * 0.7, cur.roas),
      cpa: lerpF(priorCpa * 1.3, cur.cpa),
      clicks: lerp(priorClicks * 0.7, cur.clicks),
    };
  });
}

function isImportedGoogleAdsShape(rawMetrics: MetricsRow) {
  const rawST = asArray<any>(rawMetrics.top_search_terms);
  const topKeywords = rawST.length > 0 ? rawST : asArray<any>(rawMetrics.top_keywords);
  const topProducts = asArray<any>(rawMetrics.top_products);
  const topCampaigns = asArray<any>(rawMetrics.top_campaigns);
  // Detect real synced data: old shape ("text"/"title"/"cost") OR new shape ("source" field from sync, or campaigns with "spend")
  return (
    topKeywords.some((item) => "text" in item || "source" in item) ||
    topProducts.some((item) => "title" in item || "source" in item) ||
    topCampaigns.some((item) => ("cost" in item && !("spend" in item)) || "spend" in item)
  );
}

function buildLiveSummary(reportGoal: ReportGoalFamily, metrics: MetricsRow, topCampaigns: any[], t: ReportTranslations) {
  const bestCampaign = topCampaigns[0];
  const cam = bestCampaign?.name as string | undefined;
  if (reportGoal === "ecommerce") {
    return {
      body: t.liveSummaryEcom(fmtMoney(metrics.cost), fmtMoney(metrics.conversion_value), metrics.roas.toFixed(2), cam),
      takeaways: [
        t.liveTakeaway1Ecom(metrics.roas.toFixed(2), fmtMoney(metrics.cost)),
        t.liveTakeaway2Ecom(fmtNum(metrics.conversions), fmtMoney(metrics.conversion_value)),
        t.liveTakeaway3Ecom(cam),
      ],
    };
  }
  if (reportGoal === "lead_gen") {
    return {
      body: t.liveSummaryLeadGen(fmtMoney(metrics.cost), fmtNum(metrics.conversions), fmtMoney(metrics.cpa), cam),
      takeaways: [
        t.liveTakeaway1LeadGen(fmtNum(metrics.conversions)),
        t.liveTakeaway2LeadGen(fmtMoney(metrics.cpa), fmtMoney(metrics.cost)),
        t.liveTakeaway3LeadGen(cam),
      ],
    };
  }
  return {
    body: t.liveSummaryGrowth(fmtNum(metrics.clicks), fmtPct(metrics.ctr), fmtMoneyPrecise(metrics.cpc), cam),
    takeaways: [
      t.liveTakeaway1Growth(fmtNum(metrics.clicks), fmtPct(metrics.ctr)),
      t.liveTakeaway2Growth(fmtMoneyPrecise(metrics.cpc), fmtMoney(metrics.cost)),
      t.liveTakeaway3Growth(cam),
    ],
  };
}

function buildLiveWhatChanged(reportGoal: ReportGoalFamily, metrics: MetricsRow, t: ReportTranslations) {
  const costDelta = delta(metrics.cost, metrics.prior?.cost || 0);
  const cpcDelta = delta(metrics.cpc, metrics.prior?.cpc || 0);
  const convRateDelta = delta(metrics.conversion_rate, metrics.prior?.conversion_rate || 0);
  const roasDelta = delta(metrics.roas, metrics.prior?.roas || 0);
  const leadDelta = delta(metrics.conversions, metrics.prior?.conversions || 0);
  const cpaDelta = delta(metrics.cpa, metrics.prior?.cpa || 0);
  const clicksDelta = delta(metrics.clicks, metrics.prior?.clicks || 0);

  const costDir = costDelta.dir === "down" ? t.costPulledBack : costDelta.dir === "up" ? t.costScaledUp : t.costFlat;
  const roasDir = roasDelta.dir === "up" ? t.roasImproved : roasDelta.dir === "down" ? t.roasSoftened : t.roasFlat;
  const leadDir = leadDelta.dir === "up" ? t.leadImproved : t.leadSoftened;
  const cpaDir = cpaDelta.dir === "down" ? t.cpaEfficient : t.cpaPressure;
  const trafficDir = clicksDelta.dir === "up" ? t.trafficExpanded : t.trafficContracted;
  const cpcDir = cpcDelta.dir === "down" ? t.cpcEased : cpcDelta.dir === "up" ? t.cpcRose : t.cpcHeldFlat;
  const convDir = convRateDelta.dir === "up" ? t.convRateImproved : convRateDelta.dir === "down" ? t.convRateSoftened : t.convRateFlat;

  const primaryDriverDetail = reportGoal === "ecommerce"
    ? `${t.metricCost} ${costDir}, ${t.metricRoas} ${roasDir}`
    : reportGoal === "lead_gen"
      ? `${t.metricConversions} ${leadDir}, ${t.metricCpa} ${cpaDir}`
      : `${t.metricClicks} ${trafficDir}, ${t.metricCpc} ${cpcDir}`;

  return {
    body: `${t.metricCost} ${costDir}. ${t.driverDetailCpc(fmtMoneyPrecise(metrics.prior?.cpc || 0), fmtMoneyPrecise(metrics.cpc))} ${t.metricCtr} / ${t.metricConversions} ${convDir}.`,
    drivers: [
      { label: t.driverPrimary, detail: primaryDriverDetail, tone: roasDelta.dir === "up" || cpcDelta.dir === "down" ? "good" : "medium" },
      { label: t.driverCpc, detail: t.driverDetailCpc(fmtMoneyPrecise(metrics.prior?.cpc || 0), fmtMoneyPrecise(metrics.cpc)), tone: cpcDelta.dir === "down" ? "good" : cpcDelta.dir === "up" ? "medium" : "info" },
      { label: t.driverConvEfficiency, detail: t.driverDetailConvRate(fmtPct(metrics.prior?.conversion_rate || 0), fmtPct(metrics.conversion_rate)), tone: convRateDelta.dir === "up" ? "good" : convRateDelta.dir === "down" ? "medium" : "info" },
    ],
  };
}

function buildLiveOpportunities(reportGoal: ReportGoalFamily, topCampaigns: any[], topKeywords: any[], t: ReportTranslations) {
  const weakCampaign = [...topCampaigns].reverse().find((item) => (item.spend || 0) > 0);
  const strongestKeyword = topKeywords[0];
  if (reportGoal === "ecommerce") {
    return t.liveOpportunitiesEcom(strongestKeyword?.term);
  }
  if (reportGoal === "lead_gen") {
    return t.liveOpportunitiesLeadGen(weakCampaign?.name);
  }
  return t.liveOpportunitiesGrowth(weakCampaign?.name);
}

function buildLiveRecommendations(reportGoal: ReportGoalFamily, topCampaigns: any[], topKeywords: any[], topProducts: any[], t: ReportTranslations) {
  const sortedCampaigns = [...topCampaigns].sort((a, b) => (reportGoal === "ecommerce" ? (b.roas || 0) - (a.roas || 0) : (b.conversions || 0) - (a.conversions || 0)));
  const bestCampaign = sortedCampaigns[0];
  const weakestCampaign = [...sortedCampaigns].reverse().find((item) => (item.spend || 0) > 0) || sortedCampaigns[sortedCampaigns.length - 1];
  const bestKeyword = topKeywords[0];
  const bestProduct = topProducts[0];

  return [
    {
      id: "live-rec-1",
      position: 1,
      title: t.liveRec1Title(bestCampaign?.name),
      why: t.liveRec1Why(bestCampaign?.name),
      expected_impact: reportGoal === "ecommerce" ? t.liveRec1ImpactEcom : t.liveRec1ImpactOther,
      urgency: "medium",
    },
    {
      id: "live-rec-2",
      position: 2,
      title: t.liveRec2Title(weakestCampaign?.name),
      why: t.liveRec2Why(weakestCampaign?.name),
      expected_impact: t.liveRec2Impact,
      urgency: "medium",
    },
    {
      id: "live-rec-3",
      position: 3,
      title: reportGoal === "ecommerce"
        ? t.liveRec3TitleEcom(bestProduct?.name || bestKeyword?.term)
        : t.liveRec3TitleOther(bestKeyword?.term),
      why: reportGoal === "ecommerce" ? t.liveRec3WhyEcom : t.liveRec3WhyOther,
      expected_impact: t.liveRec3Impact,
      urgency: "good",
    },
  ];
}

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
  const [resyncing, setResyncing] = useState(false);
  const [editingRecs, setEditingRecs] = useState<Record<string, { title: string; why: string; expected_impact: string; urgency: string }>>({});
  const [regeneratingRecs, setRegeneratingRecs] = useState(false);
  const [historicalTimeline, setHistoricalTimeline] = useState<any[]>([]);
  const [clientNotes, setClientNotes] = useState<any[]>([]);
  // Tracks whether the user has explicitly saved/regenerated recs in this session.
  // Used to override stale English recs in Supabase for non-English clients.
  const [recsExplicitlySaved, setRecsExplicitlySaved] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const exportPdf = async () => {
    if (!reportRef.current) return;
    setExporting(true);
    try {
      // Clear any browser text selections — stale Range objects crash html2canvas
      window.getSelection()?.removeAllRanges();
      // Close any open edit states so no inputs appear in the PDF
      setEditingRecs({});
      setEditing({});
      // Set on both body and reportRef so the sticky nav (outside reportRef) is also hidden
      document.body.setAttribute("data-exporting-pdf", "true");
      reportRef.current.setAttribute("data-exporting-pdf", "true");
      // Give the DOM two frames to settle after hiding editing UI + orb animations
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidthMm = 210;
      const pageHeightMm = 297;
      const marginMm = 10;
      const contentWidthMm = pageWidthMm - marginMm * 2;
      const contentHeightMm = pageHeightMm - marginMm * 2;
      const bg = reportPalette.surface; // dark-grey card tone, not near-black

      const paintPageBg = () => {
        pdf.setFillColor(27, 31, 36); // #1B1F24 — matches card surface colour
        pdf.rect(0, 0, pageWidthMm, pageHeightMm, "F");
      };

      const blocks = Array.from(reportRef.current.querySelectorAll<HTMLElement>(".print-page"));
      if (blocks.length === 0) blocks.push(reportRef.current);

      paintPageBg();
      let cursorY = marginMm;
      let isFirstPage = true;

      const ignoreEl = (el: Element) =>
        el.classList.contains("no-print") || el.classList.contains("pdf-export-hidden");

      // Fix for html2canvas ß crash:
      // CSS text-transform:uppercase maps ß→SS (1 char → 2 chars) so the measured
      // text length is 1 longer than the DOM text node length. html2canvas calls
      // Range.setEnd(node, measuredLength) which throws on the shorter node.
      // Solution: in the clone, disable text-transform and manually uppercase the
      // text nodes ourselves so DOM length == measured length.
      const onclone = (clonedDoc: Document, element: HTMLElement) => {
        const upperEls = element.querySelectorAll<HTMLElement>(
          '.lynck-section-label, .uppercase, [class*="uppercase"]'
        );
        upperEls.forEach((el) => {
          el.style.textTransform = "none";
          const walker = clonedDoc.createTreeWalker(el, NodeFilter.SHOW_TEXT);
          let node: Node | null;
          while ((node = walker.nextNode())) {
            if (node.textContent) {
              node.textContent = node.textContent.toUpperCase();
            }
          }
        });
      };

      const SECTION_GAP_MM = 2; // small gap between sections

      for (const block of blocks) {
        const canvas = await html2canvas(block, {
          scale: 2,
          useCORS: true,
          backgroundColor: bg,
          logging: false,
          ignoreElements: ignoreEl,
          onclone,
        });
        const imgData = canvas.toDataURL("image/png");
        const blockHeightMm = (canvas.height * contentWidthMm) / canvas.width;

        const remainingSpace = pageHeightMm - marginMm - cursorY;

        // If block won't fit on current page and we're not at the top, start new page
        if (blockHeightMm > remainingSpace && cursorY > marginMm) {
          pdf.addPage();
          paintPageBg();
          cursorY = marginMm;
        }
        isFirstPage = false;

        if (blockHeightMm <= contentHeightMm) {
          // Block fits on a single page
          pdf.addImage(imgData, "PNG", marginMm, cursorY, contentWidthMm, blockHeightMm);
          cursorY += blockHeightMm + SECTION_GAP_MM;
        } else {
          // Block is taller than a page — slice it
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
            cursorY += sliceHeightMm + SECTION_GAP_MM;
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
      document.body.removeAttribute("data-exporting-pdf");
      reportRef.current?.removeAttribute("data-exporting-pdf");
      setExporting(false);
    }
  };

  const resyncSearchTerms = async () => {
    if (!report?.ad_account_id) {
      toast.error("No ad account linked to this report.");
      return;
    }
    setResyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("sync-google-ads", {
        body: {
          ad_account_id: report.ad_account_id,
          period_month: report.period_month,
        },
      });
      if (error) throw error;
      toast.success(`Search terms re-synced${data?.synced_search_terms ? ` · ${data.synced_search_terms} terms` : ""}`);
      await load();
    } catch (e: any) {
      toast.error("Re-sync failed: " + (e?.message || "unknown"));
    } finally {
      setResyncing(false);
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

    if (r?.client_id) {
      const { data: cn } = await supabase
        .from("client_notes")
        .select("tab_label, content")
        .eq("client_id", r.client_id)
        .order("position");
      setClientNotes((cn || []).filter((n: any) => n.content?.trim()));
    }

    if (r?.client_id && r?.period_month && m) {
      const baseDate = new Date(r.period_month);
      const startDate = new Date(baseDate);
      startDate.setMonth(startDate.getMonth() - 5);
      const startStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, "0")}-01`;

      const { data: pastReports } = await supabase
        .from("reports")
        .select("id, period_month")
        .eq("client_id", r.client_id)
        .gte("period_month", startStr)
        .lte("period_month", r.period_month)
        .order("period_month", { ascending: true })
        .limit(6);

      if (pastReports?.length) {
        const ids = pastReports.map((pr: any) => pr.id);
        const { data: pastMetrics } = await supabase
          .from("report_metrics")
          .select("report_id, cost, conversions, roas, cpa, clicks")
          .in("report_id", ids);

        if (pastMetrics?.length) {
          const points = pastReports.map((pr: any) => {
            const pm = (pastMetrics as any[]).find((x) => x.report_id === pr.id);
            return {
              cost: pm?.cost || 0,
              conversions: pm?.conversions || 0,
              roas: pm?.roas || 0,
              cpa: pm?.cpa || 0,
              clicks: pm?.clicks || 0,
            };
          });
          setHistoricalTimeline(points);
        }
      }
    }
  };
  useEffect(() => { load(); }, [id]);

  const saveSection = async (s: SectionRow) => {
    const newBody = editing[s.id] ?? s.body;
    const { error } = await supabase.from("report_sections").update({
      body: newBody,
      data: {
        ...(s.data || {}),
        manual_override: true,
      },
    }).eq("id", s.id);
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
            language: getClientLanguage(client.brand_notes),
          },
          period_month: report.period_month,
          metrics: normalizeMetricsForDisplay(metrics),
          notes: clientNotes.length
            ? clientNotes.map((n: any) => `${n.tab_label}:\n${n.content}`).join("\n\n")
            : null,
        },
      });
      if (error) throw error;
      const newBody = data?.body;
      if (!newBody) throw new Error("No content returned");
      await supabase.from("report_sections").update({
        body: newBody,
        data: {
          ...(s.data || {}),
          manual_override: true,
        },
      }).eq("id", s.id);
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

  const saveRec = async (rec: RecRow & { id: string }) => {
    const edits = editingRecs[rec.id];
    if (!edits) return;
    const isTemp = rec.id.startsWith("live-rec-");
    if (isTemp) {
      const { error } = await supabase.from("report_recommendations").insert([{
        report_id: id,
        position: rec.position,
        title: edits.title,
        why: edits.why,
        expected_impact: edits.expected_impact,
        urgency: edits.urgency,
      }] as any);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("report_recommendations").update({
        title: edits.title,
        why: edits.why,
        expected_impact: edits.expected_impact,
        urgency: edits.urgency as "good" | "info" | "medium" | "urgent",
      }).eq("id", rec.id);
      if (error) return toast.error(error.message);
    }
    setEditingRecs((prev) => { const n = { ...prev }; delete n[rec.id]; return n; });
    setRecsExplicitlySaved(true);
    toast.success("Saved");
    load();
  };

  const deleteRec = async (rec: RecRow & { id: string }) => {
    if (rec.id.startsWith("live-rec-")) { toast.error("Save this action first before deleting."); return; }
    const { error } = await supabase.from("report_recommendations").delete().eq("id", rec.id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    load();
  };

  const addRec = async () => {
    const maxPos = recs.length > 0 ? Math.max(...recs.map((r) => r.position)) : 0;
    const { error } = await supabase.from("report_recommendations").insert([{
      report_id: id,
      position: maxPos + 1,
      title: "New action",
      why: "",
      expected_impact: "",
      urgency: "medium",
    }] as any);
    if (error) return toast.error(error.message);
    load();
  };

  const regenerateRecs = async () => {
    if (!metrics || !client) return;
    setRegeneratingRecs(true);
    try {
      const { data, error } = await supabase.functions.invoke("regenerate-section", {
        body: {
          section_kind: "recommendations",
          client: {
            name: client.name,
            business_type: client.business_type,
            brand_notes: getVisibleBrandNotes(client.brand_notes),
            report_goal: getClientReportGoal(client.brand_notes, client.business_type),
            language: getClientLanguage(client.brand_notes),
          },
          period_month: report.period_month,
          metrics: normalizeMetricsForDisplay(metrics),
          notes: clientNotes.length
            ? clientNotes.map((n: any) => `${n.tab_label}:\n${n.content}`).join("\n\n")
            : null,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      // Newer edge function returns { recommendations: [...] }.
      // Older deployed versions fall through to { body: "<raw JSON text>" } — parse that as fallback.
      let parsed: Array<{ title: string; why: string; expected_impact: string; urgency: string }> | null =
        Array.isArray(data?.recommendations) ? data.recommendations : null;
      if (!parsed && data?.body) {
        try {
          const raw: string = data.body;
          const start = raw.indexOf("[");
          const end = raw.lastIndexOf("]");
          if (start !== -1 && end > start) {
            const candidate = JSON.parse(raw.slice(start, end + 1));
            if (Array.isArray(candidate)) parsed = candidate;
          }
        } catch { /* ignore parse failure, will throw below */ }
      }
      if (!parsed || parsed.length === 0) throw new Error("No recommendations returned");
      await supabase.from("report_recommendations").delete().eq("report_id", id);
      await supabase.from("report_recommendations").insert(
        parsed.map((r, i) => ({ report_id: id, position: i + 1, title: r.title, why: r.why, expected_impact: r.expected_impact, urgency: (r.urgency || "medium") as "good" | "info" | "medium" | "urgent" }))
      );
      setRecsExplicitlySaved(true);
      toast.success("Recommendations regenerated");
      load();
    } catch (e: any) {
      const msg = String(e?.message || "");
      if (msg.includes("429")) toast.error("Rate limit reached, try again in a minute.");
      else if (msg.includes("402")) toast.error("AI credits depleted.");
      else toast.error("Could not regenerate: " + msg);
    } finally {
      setRegeneratingRecs(false);
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

  const reportGoal = getClientReportGoal(client?.brand_notes, client?.business_type);
  const goalFamily = getReportGoalFamily(reportGoal);
  const language = getClientLanguage(client?.brand_notes);
  const t = getReportT(language);
  const locale = getLocale(language);
  const displayMetrics = normalizeMetricsForDisplay(metrics);
  const summaryData = summary?.data || {};
  const useLiveDerivedContent = isImportedGoogleAdsShape(metrics);
  const topCampaigns = normalizeCampaigns(asArray<any>(displayMetrics.top_campaigns), goalFamily);
  const spendCampaigns = topCampaigns
    .filter((campaign) => Number(campaign.spend || 0) > 0)
    .sort((a, b) => {
      if (goalFamily === "ecommerce") return (b.roas || 0) - (a.roas || 0);
      if (goalFamily === "lead_gen") return (b.conversions || 0) - (a.conversions || 0);
      return (b.clicks || 0) - (a.clicks || 0);
    });
  const rawSearchTerms = asArray<any>(displayMetrics.top_search_terms);
  const topKeywords = aggregateKeywords(normalizeKeywords(rawSearchTerms.length > 0 ? rawSearchTerms : asArray<any>(displayMetrics.top_keywords)))
    .filter((keyword) => Number(keyword.clicks || 0) > 0)
    .sort((a, b) => (b.clicks || 0) - (a.clicks || 0) || (b.conversions || 0) - (a.conversions || 0));
  const topProducts = aggregateProducts(normalizeProducts(asArray<any>(displayMetrics.top_products)))
    .sort((a, b) => (b.clicks || 0) - (a.clicks || 0) || (b.conversions || 0) - (a.conversions || 0));
  const deviceSplit = buildDeviceSplit(displayMetrics);
  const liveSummary = useLiveDerivedContent ? buildLiveSummary(goalFamily, displayMetrics, spendCampaigns, t) : null;
  const liveWhatChanged = buildLiveWhatChanged(goalFamily, displayMetrics, t);
  const liveOpportunities = useLiveDerivedContent ? buildLiveOpportunities(goalFamily, spendCampaigns, topKeywords, t) : null;
  const liveRecommendations = useLiveDerivedContent ? buildLiveRecommendations(goalFamily, spendCampaigns, topKeywords, topProducts, t) : [];
  const summaryBody = useLiveDerivedContent ? liveSummary?.body || summary?.body || "" : summary?.body || "";
  const takeaways: string[] = useLiveDerivedContent
    ? asArray<string>(liveSummary?.takeaways)
    : asArray<string>(summaryData.takeaways);
  const timeline = buildTimeline(
    report.period_month,
    displayMetrics,
    historicalTimeline.length >= 2
      ? historicalTimeline
      : !useLiveDerivedContent
        ? asArray<any>(summaryData.timeline)
        : [],
    locale,
  );
  const conversionSplit = asArray<any>(summaryData.conversionSplit);
  const leadActions = asArray<any>(summaryData.leadActions);
  // Always use translated live drivers unless we have no live data AND the language is English.
  // This ensures the driver cards are always in the client's language.
  const driverCards = (useLiveDerivedContent || language !== "en")
    ? asArray<any>(liveWhatChanged?.drivers)
    : asArray<any>(whatChanged?.data?.drivers);
  const opportunitiesBody = useLiveDerivedContent ? liveOpportunities || opportunities?.body || "" : opportunities?.body || "";
  const decisionBody = useLiveDerivedContent
    ? t.decisionBodyLive
    : decision?.body || t.decisionBodyLive;
  // For non-English clients, old supabase recs may be stale English content saved
  // before the language feature existed. Show live translated recs by default
  // unless the user has explicitly saved/regenerated recs in this session.
  const recsAreStale = language !== "en" && !recsExplicitlySaved;
  const recommendationItems = recsAreStale
    ? liveRecommendations
    : (recs.length > 0 ? recs : liveRecommendations);
  const heroMetrics = getHeroMetrics(goalFamily, displayMetrics, conversionSplit, t);
  const winners = getCampaignWinners(spendCampaigns, goalFamily);

  return (
    <div className="report-theme min-h-screen overflow-x-hidden bg-background">
      <div className="no-print sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex flex-wrap items-center justify-between gap-4 px-5 py-[14px] sm:px-8 md:px-[60px]" style={{ maxWidth: 1060 }}>
          <Link to="/reports" className="inline-flex items-center gap-2 text-sm lynck-muted hover:text-foreground">
            <ArrowLeft className="size-4" /> {t.allReports}
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge variant="report" value={report.status} />
            {report.status !== "approved" && report.status !== "exported" && (
              <Button size="sm" variant="outline" onClick={() => setStatus("in_review")}>{t.markInReview}</Button>
            )}
            {report.status !== "approved" && (
              <Button size="sm" variant="outline" onClick={() => setStatus("approved")}>
                <CheckCircle2 className="size-4 mr-1.5" /> {t.approve}
              </Button>
            )}
            <Button size="sm" variant="outline" disabled={resyncing} onClick={resyncSearchTerms}>
              <RefreshCw className={`size-4 mr-1.5 ${resyncing ? "animate-spin" : ""}`} /> {resyncing ? t.syncing : t.resyncSearchTerms}
            </Button>
            <Button size="sm" variant="outline" onClick={() => window.print()}>
              <Printer className="size-4 mr-1.5" /> {t.print}
            </Button>
            <Button size="sm" disabled={exporting} onClick={exportPdf}>
              <FileDown className="size-4 mr-1.5" /> {exporting ? t.exporting : t.exportPdf}
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
              <p className="lynck-section-label mb-1">{t.generated}</p>
              <p className="lynck-muted">{fmtDate(new Date())}</p>
            </div>
          </div>
          <div className="relative flex flex-wrap items-center gap-3">
            <p className="lynck-section-label">{t.monthlyPerformanceReport}</p>
            <span className="rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.15em]" style={{ borderColor: reportPalette.border, background: reportPalette.surfaceAlt, color: reportPalette.data }}>
              {t.goal} {getReportGoalLabel(reportGoal)}
            </span>
          </div>
          <h1 className="lynck-hero-title relative mb-6 mt-5 max-w-4xl break-words text-[clamp(2.8rem,9vw,4.75rem)] leading-[0.96]">
            {client?.name}
            <em className="not-italic text-primary"> — {fmtMonth(report.period_month, locale)}.</em>
          </h1>
          {summaryBody && (
            <p className="relative max-w-3xl whitespace-pre-wrap leading-relaxed text-card-body lynck-muted">
              {summaryBody}
            </p>
          )}
        </header>

        <section className="mb-14 print-page">
          <div className="mb-8">
            <p className="lynck-section-label mb-3">{t.performanceSnapshot}</p>
            <h2 className="font-display text-3xl md:text-4xl font-bold">
              {t.metricsTitle} <em className="not-italic text-primary">{t.metricsEm}</em>
            </h2>
          </div>

          {takeaways.length > 0 && (
            <div className="mb-6 grid gap-3 sm:grid-cols-3">
              {takeaways.map((tw, i) => (
                <div key={i} className="lynck-card p-4">
                  <p className="mb-1.5 text-[11px] uppercase tracking-[0.15em] text-primary">{t.takeaway(i + 1)}</p>
                  <p className="text-card-body">{tw}</p>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {heroMetrics.map((item) => (
              <Metric key={item.label} label={item.label} value={item.value} now={item.now} prior={item.prior} invert={item.invert} neutral={item.neutral} footnote={item.footnote} />
            ))}
          </div>

          <div className="mt-6">
            <ChartCard
              label={t.sixMonthTrend}
              title={goalFamily === "ecommerce" ? t.spendVsReturn : t.spendVsCpa}
              body={t.trendNote}
            >
              <MiniTrendChart data={timeline} goal={goalFamily} t={t} />
            </ChartCard>
          </div>
        </section>

        <section className="mb-14 print-page">
          <div className="mb-8">
            <p className="lynck-section-label mb-3">{t.campaignComparison}</p>
            <h2 className="font-display text-3xl md:text-4xl font-bold">
              {t.campaignCompTitle} <em className="not-italic text-primary">{t.campaignCompEm}</em>
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-[1.55fr_1fr]">
            <ChartCard label={t.performanceComparison} title={t.campaignLadder}>
              <CampaignPerformanceChart campaigns={spendCampaigns} goal={goalFamily} t={t} />
            </ChartCard>
            <ChartCard label={t.budgetAllocation} title={t.spendShare}>
              <SpendShareChart campaigns={spendCampaigns} totalSpend={displayMetrics.cost} t={t} />
            </ChartCard>
          </div>
          <div className={`mt-4 grid gap-4 ${deviceSplit.length > 0 ? "md:grid-cols-[1.15fr_0.85fr]" : "md:grid-cols-1"}`}>
            <WinnerCard title={t.topWinner} campaign={winners.best} goal={goalFamily} t={t} />
            {deviceSplit.length > 0 && (
              <ChartCard label={t.audienceSplit} title={t.deviceSplit}>
                <DeviceSplitCard split={deviceSplit} t={t} />
              </ChartCard>
            )}
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
            overrideBody={useLiveDerivedContent && !whatChanged?.data?.manual_override ? liveWhatChanged?.body : undefined}
            t={t}
          />

          <div className="mt-10 grid gap-4 md:grid-cols-[0.78fr_1.22fr]">
            <ChartCard label={t.movementDetail} title={t.mainMovements}>
              <DriverGrid drivers={driverCards} stacked />
            </ChartCard>
            <ChartCard label={t.searchInsight} title={t.topSearchTerms}>
              <TopItemsList
                items={topKeywords.slice(0, 10).map((keyword) => ({
                  name: keyword.term,
                  clicks: keyword.clicks,
                  conversions: keyword.conversions,
                  avgCpc: keyword.clicks > 0 ? keyword.cost / keyword.clicks : 0,
                }))}
                emptyLabel={t.noSearchTermData}
                nameColumnRatio={2.2}
                t={t}
              />
            </ChartCard>
          </div>

          {goalFamily === "ecommerce" ? (
            <div className="mt-4">
              <ChartCard label={t.productInsight} title={t.topProducts}>
                <TopItemsList
                  items={topProducts.slice(0, 10).map((product) => ({
                    name: product.name,
                    clicks: product.clicks,
                    conversions: product.conversions,
                    avgCpc: product.avgCpc ?? (product.clicks > 0 ? product.cost / product.clicks : 0),
                  }))}
                  emptyLabel={t.noProductData}
                  nameColumnRatio={4.1}
                  t={t}
                />
              </ChartCard>
            </div>
          ) : goalFamily === "lead_gen" ? (
            <div className="mt-4">
              <ChartCard label={t.leadInsight} title={t.hardVsSoftConversions}>
                <LeadInsightPanel split={conversionSplit} actions={leadActions} t={t} />
              </ChartCard>
            </div>
          ) : (
            <div className="mt-4">
              <ChartCard label={t.growthInsight} title={t.momentumSignals}>
                <GrowthInsightPanel metrics={displayMetrics} keywords={topKeywords} t={t} />
              </ChartCard>
            </div>
          )}

          {opportunitiesBody && (
            <div className="mt-4">
              <InsightNote label={t.optimizationLens} body={opportunitiesBody} />
            </div>
          )}
        </section>

        <SectionWrap label={t.decisionPageLabel} title={t.decisionPageTitle} emphasize={t.decisionPageEm}>
          <p className="mb-6 max-w-2xl text-card-body lynck-muted">{decisionBody}</p>
          <div className="no-print pdf-export-hidden flex flex-wrap items-center gap-2 mb-5">
            <Button size="sm" variant="outline" onClick={addRec}>+ {t.addRecommendation}</Button>
            <Button size="sm" variant="outline" disabled={regeneratingRecs} onClick={regenerateRecs}>
              <Sparkles className="size-3.5 mr-1.5" />
              {regeneratingRecs ? t.regeneratingRecs : t.regenerateRecommendations}
            </Button>
          </div>
          <div className="space-y-4">
            {recommendationItems.length === 0 && (
              <p className="lynck-muted text-card-body">{t.noRecs}</p>
            )}
            {recommendationItems.map((r, i) => {
              const isEdit = editingRecs[r.id] !== undefined;
              const edits = editingRecs[r.id];
              return (
                <div key={r.id} className="lynck-card p-6">
                  <div className="mb-3 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className="lynck-section-label mt-1.5 shrink-0">{String(i + 1).padStart(2, "0")}</div>
                      {isEdit ? (
                        <input
                          className="flex-1 bg-transparent border-b border-primary text-xl font-bold font-display outline-none"
                          value={edits.title}
                          onChange={(e) => setEditingRecs((prev) => ({ ...prev, [r.id]: { ...prev[r.id], title: e.target.value } }))}
                        />
                      ) : (
                        <h3 className="font-display text-xl font-bold">{r.title}</h3>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0 no-print pdf-export-hidden">
                      {isEdit ? (
                        <>
                          <Button size="sm" variant="ghost" onClick={() => setEditingRecs((prev) => { const n = { ...prev }; delete n[r.id]; return n; })}>{t.cancel}</Button>
                          <Button size="sm" onClick={() => saveRec(r as any)}><Save className="size-3.5 mr-1.5" />{t.save}</Button>
                        </>
                      ) : (
                        <>
                          <Button size="sm" variant="ghost" onClick={() => setEditingRecs((prev) => ({ ...prev, [r.id]: { title: r.title, why: r.why, expected_impact: r.expected_impact, urgency: r.urgency } }))}>{t.edit}</Button>
                          <Button size="sm" variant="ghost" className="text-status-urgent hover:text-status-urgent" onClick={() => deleteRec(r as any)}>{t.deleteRec}</Button>
                        </>
                      )}
                      <StatusBadge variant="urgency" value={isEdit ? edits.urgency : r.urgency} />
                    </div>
                  </div>
                  <div className="grid gap-5 md:grid-cols-2 pl-12">
                    <div>
                      <p className="lynck-section-label mb-1.5">{t.whyItMatters}</p>
                      {isEdit ? (
                        <textarea
                          rows={3}
                          className="w-full bg-transparent border border-border rounded-lg p-2 text-card-body outline-none resize-none focus:border-primary"
                          value={edits.why}
                          onChange={(e) => setEditingRecs((prev) => ({ ...prev, [r.id]: { ...prev[r.id], why: e.target.value } }))}
                        />
                      ) : (
                        <p className="text-card-body">{r.why}</p>
                      )}
                    </div>
                    <div>
                      <p className="lynck-section-label mb-1.5">{t.expectedImpact}</p>
                      {isEdit ? (
                        <textarea
                          rows={3}
                          className="w-full bg-transparent border border-border rounded-lg p-2 text-card-body outline-none resize-none focus:border-primary"
                          value={edits.expected_impact}
                          onChange={(e) => setEditingRecs((prev) => ({ ...prev, [r.id]: { ...prev[r.id], expected_impact: e.target.value } }))}
                        />
                      ) : (
                        <p className="text-card-body">{r.expected_impact}</p>
                      )}
                    </div>
                  </div>
                  {isEdit && (
                    <div className="mt-4 pl-12 flex gap-2">
                      {["good", "medium", "urgent"].map((u) => (
                        <button
                          key={u}
                          type="button"
                          onClick={() => setEditingRecs((prev) => ({ ...prev, [r.id]: { ...prev[r.id], urgency: u } }))}
                          className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-widest border transition-colors ${edits.urgency === u ? "border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}
                        >
                          {u}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </SectionWrap>

        <footer className="mt-16 flex items-center justify-between border-t border-border pt-8 text-xs lynck-muted">
          <Wordmark size="sm" />
          <span>{t.footerTagline}</span>
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
  overrideBody,
  t,
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
  overrideBody?: string;
  t: ReportTranslations;
}) {
  if (!section) return null;
  const titleMap: Record<string, { label: string; title: string; em: string }> = {
    executive_summary: { label: t.execSummaryLabel, title: t.execSummaryTitle, em: t.execSummaryEm },
    what_changed: { label: t.whatChangedLabel, title: t.whatChangedTitle, em: t.whatChangedEm },
    opportunities: { label: t.opportunitiesLabel, title: t.opportunitiesTitle, em: t.opportunitiesEm },
    appendix: { label: t.appendixLabel, title: t.appendixTitle, em: t.appendixEm },
  };
  const tm = titleMap[kind] || { label: section.title, title: section.title, em: "" };
  const displayBody = overrideBody ?? section.body;
  const isEditing = editing[section.id] !== undefined;

  return (
    <section className={`${printPage ? "print-page" : ""} mb-14`}>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="lynck-section-label mb-3">{tm.label}</p>
          <h2 className="font-display text-3xl font-bold md:text-4xl">
            {tm.title}
            <em className="not-italic text-primary"> {tm.em}</em>
          </h2>
        </div>
        <div className="no-print pdf-export-hidden flex gap-2">
          {!isEditing && <Button size="sm" variant="ghost" onClick={() => setEditing({ ...editing, [section.id]: displayBody })}>{t.edit}</Button>}
          {isEditing && (
            <>
              <Button size="sm" variant="ghost" onClick={() => { const n = { ...editing }; delete n[section.id]; setEditing(n); }}>{t.cancel}</Button>
              <Button size="sm" onClick={() => onSave(section)}><Save className="size-3.5 mr-1.5" />{t.save}</Button>
            </>
          )}
          <Button size="sm" variant="outline" disabled={regenerating === section.id} onClick={() => onRegenerate(section)}>
            <Sparkles className="size-3.5 mr-1.5" />
            {regenerating === section.id ? t.regenerating : t.regenerate}
          </Button>
        </div>
      </div>
      <div className="lynck-card p-6">
        {isEditing ? (
          <Textarea rows={6} value={editing[section.id]} onChange={(e) => setEditing({ ...editing, [section.id]: e.target.value })} className="text-card-body" />
        ) : (
          <p className="whitespace-pre-wrap leading-relaxed text-card-body">{displayBody}</p>
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
      {/* MoM is internationally understood; kept as-is */}
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

function MiniTrendChart({ data, goal, t }: { data: any[]; goal: ReportGoalFamily; t: ReportTranslations }) {
  const secondaryKey = goal === "ecommerce" ? "roas" : "cpa";
  const secondaryLabel = goal === "ecommerce" ? t.metricRoas : t.metricCpa;

  return (
    <div>
      {/* Legend — rendered as static HTML so it is always visible in PDF */}
      <div className="flex items-center gap-6 mb-4 px-1">
        <div className="flex items-center gap-2 text-xs">
          <span className="inline-block w-6 rounded-full" style={{ height: 3, background: reportPalette.accent }} />
          <span style={{ color: reportPalette.muted }}>{t.legendCost}</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="inline-block w-6 rounded-full" style={{ height: 3, background: reportPalette.data }} />
          <span style={{ color: reportPalette.muted }}>{secondaryLabel}</span>
        </div>
      </div>
      <div className="h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ left: 0, right: 44, top: 12, bottom: 0 }}>
            <CartesianGrid stroke={reportPalette.grid} strokeDasharray="4 4" vertical />
            <XAxis dataKey="label" tick={{ fill: reportPalette.muted, fontSize: 12 }} axisLine={false} tickLine={false} tickMargin={10} />
            <YAxis
              yAxisId="left"
              tick={{ fill: reportPalette.muted, fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `€${Number(v).toLocaleString()}`}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fill: reportPalette.muted, fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => goal === "ecommerce" ? `${Number(v).toFixed(1)}x` : `€${Number(v).toFixed(0)}`}
            />
            <Tooltip
              contentStyle={{ background: reportPalette.surfaceAlt, border: `1px solid ${reportPalette.border}`, borderRadius: 12, color: reportPalette.text }}
              formatter={(value: any, name: string) => [
                name === t.legendCost ? fmtMoney(Number(value))
                  : name === t.metricRoas ? `${Number(value).toFixed(2)}x`
                  : fmtMoneyPrecise(Number(value)),
                name,
              ]}
            />
            <Line yAxisId="left" type="monotone" dataKey="cost" name={t.legendCost} stroke={reportPalette.accent} strokeWidth={2.5} dot={{ r: 3.5, fill: reportPalette.accent }} activeDot={{ r: 5 }} />
            <Line yAxisId="right" type="monotone" dataKey={secondaryKey} name={secondaryLabel} stroke={reportPalette.data} strokeWidth={2.5} dot={{ r: 3.5, fill: reportPalette.data }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function CampaignPerformanceChart({ campaigns, goal, t }: { campaigns: any[]; goal: ReportGoalFamily; t: ReportTranslations }) {
  if (!campaigns.length) {
    return <p className="text-sm lynck-muted">{t.noSpendRecorded}</p>;
  }
  const metricLabel = goal === "ecommerce" ? t.metricRoas : goal === "lead_gen" ? t.metricCpa : t.metricClicks;
  const data = campaigns.map((campaign) => ({
    name: campaign.name.replace(/\s*-\s*/g, " ").replace(/\|/g, " | "),
    spend: Number(campaign.spend || 0),
    metric: goal === "ecommerce" ? Number(campaign.roas || 0) : goal === "lead_gen" ? Number(campaign.cpa || 0) : Number(campaign.clicks || 0),
  }));

  return (
    <div className="h-[390px]">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ left: 0, right: 10, top: 18, bottom: 70 }}>
          <CartesianGrid stroke={reportPalette.grid} strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="name"
            interval={0}
            angle={-24}
            textAnchor="end"
            height={96}
            tickMargin={10}
            tick={{ fill: reportPalette.muted, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis yAxisId="left" tick={{ fill: reportPalette.muted, fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis yAxisId="right" orientation="right" tick={{ fill: reportPalette.muted, fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ background: reportPalette.surfaceAlt, border: `1px solid ${reportPalette.border}`, borderRadius: 12, color: reportPalette.text }}
            formatter={(value: any, name: string) => {
              if (name === t.spend) return [fmtMoney(Number(value)), t.spend];
              if (goal === "ecommerce") return [`${Number(value).toFixed(2)}x`, metricLabel];
              if (goal === "lead_gen") return [fmtMoneyPrecise(Number(value)), metricLabel];
              return [fmtNum(Number(value), 0), metricLabel];
            }}
          />
          <Bar yAxisId="left" dataKey="spend" name={t.spend} radius={[8, 8, 0, 0]} barSize={34}>
            {data.map((_, index) => <Cell key={index} fill={chartPalette[index % chartPalette.length]} />)}
          </Bar>
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="metric"
            name={metricLabel}
            stroke={reportPalette.dataStone}
            strokeWidth={2.5}
            dot={{ r: 4, fill: reportPalette.dataStone }}
            activeDot={{ r: 5 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

function SpendShareChart({ campaigns, totalSpend, t }: { campaigns: any[]; totalSpend: number; t: ReportTranslations }) {
  if (!campaigns.length) {
    return <p className="text-sm lynck-muted">{t.noSpendShareBreakdown}</p>;
  }
  const data = (campaigns || []).map((campaign: any) => ({ name: campaign.name, value: campaign.spendShare || 0 }));
  return (
    <div className="flex min-h-[360px] flex-col items-center justify-start">
      <ResponsiveContainer width="100%" height={210}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={58} outerRadius={86} paddingAngle={3}>
            {data.map((_: any, index: number) => <Cell key={index} fill={chartPalette[index % chartPalette.length]} />)}
          </Pie>
          <Tooltip
            contentStyle={{ background: reportPalette.surfaceAlt, border: `1px solid ${reportPalette.border}`, borderRadius: 12, color: reportPalette.text }}
            formatter={(value: any) => [`${Number(value).toFixed(1)}%`, t.tooltipSpendShare]}
          />
        </PieChart>
      </ResponsiveContainer>
      <p className="text-sm lynck-muted">{t.trackedSpend} <span className="text-foreground">{fmtMoney(totalSpend)}</span></p>
      <div className="mt-4 grid w-full gap-2">
        {data.map((item, index) => (
          <div key={item.name} className="flex items-center justify-between gap-3 text-sm">
            <div className="flex min-w-0 items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: chartPalette[index % chartPalette.length] }} />
              <span className="truncate">{item.name}</span>
            </div>
            <span className="shrink-0" style={{ color: reportPalette.data }}>{item.value.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function WinnerCard({ title, campaign, goal, inverse = false, t }: { title: string; campaign?: any; goal: ReportGoalFamily; inverse?: boolean; t: ReportTranslations }) {
  if (!campaign) return null;
  return (
    <div className="lynck-card p-5">
      <p className="lynck-section-label mb-2">{title}</p>
      <h3 className="font-display text-2xl font-bold">{campaign.name}</h3>
      <div className="mt-4 grid grid-cols-3 gap-3">
        <MiniStat label={t.miniStatSpend} value={fmtMoney(campaign.spend)} />
        <MiniStat label={t.miniStatRoas} value={goal === "ecommerce" ? `${Number(campaign.roas).toFixed(2)}x` : fmtNum(campaign.conversions)} />
        <MiniStat label={t.metricConversions} value={fmtNum(campaign.conversions)} tone={inverse ? "warn" : "good"} />
      </div>
    </div>
  );
}

function DeviceSplitCard({ split, t }: { split: { label: string; value: number }[]; t: ReportTranslations }) {
  if (!split.length) {
    return (
      <div className="flex min-h-[240px] items-center justify-center rounded-[12px] border border-dashed px-6 text-center text-sm lynck-muted" style={{ borderColor: reportPalette.border, background: reportPalette.surfaceAlt }}>
        {t.deviceSplitEmpty}
      </div>
    );
  }

  const total = split.reduce((sum, item) => sum + item.value, 0) || 1;

  return (
    <div className="flex min-h-[240px] items-center gap-6">
      <div className="h-[190px] flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={split} dataKey="value" nameKey="label" innerRadius={0} outerRadius={72} paddingAngle={1}>
              {split.map((_: any, index: number) => <Cell key={index} fill={chartPalette[index % chartPalette.length]} />)}
            </Pie>
            <Tooltip
              contentStyle={{ background: reportPalette.surfaceAlt, border: `1px solid ${reportPalette.border}`, borderRadius: 12, color: reportPalette.text }}
              formatter={(value: any) => [`${((Number(value) / total) * 100).toFixed(1)}%`, t.tooltipShare]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="min-w-[120px] space-y-3">
        {split.map((item, index) => (
          <div key={item.label} className="flex items-center justify-between gap-3 text-sm">
            <div className="flex min-w-0 items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: chartPalette[index % chartPalette.length] }} />
              <span className="truncate">{item.label}</span>
            </div>
            <span className="shrink-0" style={{ color: reportPalette.data }}>{((item.value / total) * 100).toFixed(1)}%</span>
          </div>
        ))}
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

function DriverGrid({ drivers, stacked = false }: { drivers: any[]; stacked?: boolean }) {
  return (
    <div className={`mt-4 grid gap-3 ${stacked ? "grid-cols-1" : "md:grid-cols-3"}`}>
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

function TopItemsList({
  items,
  emptyLabel,
  nameColumnRatio = 1.55,
  t,
}: {
  items: { name: string; clicks: number; conversions: number; avgCpc: number }[];
  emptyLabel: string;
  nameColumnRatio?: number;
  t: ReportTranslations;
}) {
  if (!items.length) {
    return <p className="text-sm lynck-muted">{emptyLabel}</p>;
  }

  return (
    <div className="overflow-hidden rounded-[12px] border" style={{ borderColor: reportPalette.border, background: reportPalette.surfaceAlt }}>
      <div className="grid gap-2 border-b px-3 py-2 text-[11px] uppercase tracking-[0.15em] lynck-muted" style={{ borderColor: reportPalette.border, gridTemplateColumns: `minmax(0,${nameColumnRatio}fr) 48px 52px 72px` }}>
        <span>{t.tableItem}</span>
        <span className="text-right">{t.tableClicks}</span>
        <span className="text-right">{t.tableConversions}</span>
        <span className="text-right">{t.tableAvgCpc}</span>
      </div>
      {items.map((item, index) => (
        <div
          key={`${item.name}-${index}`}
          className="grid items-center gap-2 px-3 py-2 text-sm"
          style={{ borderTop: index === 0 ? "none" : `1px solid ${reportPalette.border}`, gridTemplateColumns: `26px minmax(0,${nameColumnRatio}fr) 48px 52px 72px` }}
        >
          <div className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-medium" style={{ background: "rgba(236, 138, 29, 0.12)", color: reportPalette.accent }}>
            {index + 1}
          </div>
          <p className="pr-2 leading-snug text-foreground" title={item.name}>{item.name}</p>
          <p className="text-right text-sm text-foreground">{fmtNum(item.clicks, 0)}</p>
          <p className="text-right text-sm text-foreground">{fmtNum(item.conversions, 0)}</p>
          <p className="text-right text-sm" style={{ color: reportPalette.data }}>{fmtMoneyPrecise(item.avgCpc)}</p>
        </div>
      ))}
    </div>
  );
}

function LeadInsightPanel({ split, actions, t }: { split: any[]; actions: any[]; t: ReportTranslations }) {
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
            formatter={(value: any) => [fmtNum(Number(value)), t.tooltipConversions]}
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

function GrowthInsightPanel({ metrics, keywords, t }: { metrics: MetricsRow; keywords: any[]; t: ReportTranslations }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <MiniStat label={t.growthInsightImpressionsLabel} value={fmtNum(metrics.impressions)} />
        <MiniStat label={t.metricClicks} value={fmtNum(metrics.clicks)} />
        <MiniStat label={t.metricCtr} value={fmtPct(metrics.ctr)} />
      </div>
      <div className="rounded-[12px] border p-4" style={{ borderColor: reportPalette.border, background: reportPalette.surfaceAlt }}>
        <p className="lynck-section-label mb-2">{t.growthReadTitle}</p>
        <p className="text-card-body lynck-muted">
          {t.growthReadBody}
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

function getHeroMetrics(reportGoal: ReportGoalFamily, metrics: MetricsRow, split: any[], t: ReportTranslations) {
  if (reportGoal === "ecommerce") {
    return [
      { label: t.metricCost, value: fmtMoney(metrics.cost), now: metrics.cost, prior: metrics.prior?.cost, neutral: true },
      { label: t.metricConversions, value: fmtNum(metrics.conversions), now: metrics.conversions, prior: metrics.prior?.conversions },
      { label: t.metricConversionValue, value: fmtMoney(metrics.conversion_value), now: metrics.conversion_value, prior: metrics.prior?.conversion_value },
      { label: t.metricRoas, value: `${metrics.roas.toFixed(2)}x`, now: metrics.roas, prior: metrics.prior?.roas, footnote: t.primaryGoalNote },
    ];
  }
  if (reportGoal === "lead_gen") {
    return [
      { label: t.metricCost, value: fmtMoney(metrics.cost), now: metrics.cost, prior: metrics.prior?.cost, neutral: true },
      { label: t.metricHardConversions, value: fmtNum(split.find((item) => item.label === "Hard conversions")?.value || metrics.conversions), now: split.find((item) => item.label === "Hard conversions")?.value || metrics.conversions, prior: Math.round((metrics.prior?.conversions || 0) * 0.38) },
      { label: t.metricSoftConversions, value: fmtNum(split.find((item) => item.label === "Soft conversions")?.value || 0), now: split.find((item) => item.label === "Soft conversions")?.value || 0, prior: Math.round((metrics.prior?.conversions || 0) * 0.62), neutral: true },
      { label: t.metricCpa, value: fmtMoney(metrics.cpa), now: metrics.cpa, prior: metrics.prior?.cpa, invert: true, footnote: t.cpaNote },
    ];
  }
  return [
    { label: t.metricCost, value: fmtMoney(metrics.cost), now: metrics.cost, prior: metrics.prior?.cost, neutral: true },
    { label: t.metricClicks, value: fmtNum(metrics.clicks), now: metrics.clicks, prior: metrics.prior?.clicks },
    { label: t.metricCtr, value: fmtPct(metrics.ctr), now: metrics.ctr, prior: metrics.prior?.ctr },
    { label: t.metricCpc, value: fmtMoneyPrecise(metrics.cpc), now: metrics.cpc, prior: metrics.prior?.cpc, invert: true, footnote: t.growthNote },
  ];
}

function getCampaignWinners(campaigns: any[], goal: ReportGoalFamily) {
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
