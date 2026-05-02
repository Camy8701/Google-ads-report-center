import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Wordmark } from "@/components/Wordmark";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { fmtMonth, fmtMonthShort, fmtNum, fmtMoney, fmtPct, fmtDate, delta } from "@/lib/format";
import { getClientReportGoal, getReportGoalLabel, getReportGoalFamily, getVisibleBrandNotes, type ReportGoal, type ReportGoalFamily } from "@/lib/reportGoal";
import { ArrowLeft, Save, Sparkles, Printer, CheckCircle2, FileDown, ArrowUp, ArrowDown, Minus } from "lucide-react";
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
      if (goalFamily === "ecommerce") status = campaign.roas >= 2.5 ? "winner" : campaign.roas > 0 ? "watch" : "weak";
      else if (goalFamily === "lead_gen") status = campaign.conversions > 0 && campaign.cpa > 0 && campaign.cpa <= 60 ? "winner" : campaign.conversions > 0 ? "watch" : "weak";
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

function buildTimeline(reportMonth: string, metrics: MetricsRow, rawTimeline: any[]) {
  const timeline = asArray<any>(rawTimeline);
  if (timeline.length) {
    return timeline.map((point, index) => {
      const d = new Date(reportMonth);
      d.setMonth(d.getMonth() - (timeline.length - 1 - index));
      return {
        ...point,
        label: fmtMonthShort(d),
      };
    });
  }

  const previousMonth = new Date(reportMonth);
  previousMonth.setMonth(previousMonth.getMonth() - 1);

  return [
    {
      label: fmtMonthShort(previousMonth),
      cost: metrics.prior?.cost || 0,
      conversions: metrics.prior?.conversions || 0,
      roas: metrics.prior?.roas || 0,
      cpa: metrics.prior?.cpa || 0,
      clicks: metrics.prior?.clicks || 0,
    },
    {
      label: fmtMonthShort(new Date(reportMonth)),
      cost: metrics.cost,
      conversions: metrics.conversions,
      roas: metrics.roas,
      cpa: metrics.cpa,
      clicks: metrics.clicks,
    },
  ];
}

function isImportedGoogleAdsShape(rawMetrics: MetricsRow) {
  const topKeywords = asArray<any>(rawMetrics.top_search_terms ?? rawMetrics.top_keywords);
  const topProducts = asArray<any>(rawMetrics.top_products);
  const topCampaigns = asArray<any>(rawMetrics.top_campaigns);
  return topKeywords.some((item) => "text" in item) || topProducts.some((item) => "title" in item) || topCampaigns.some((item) => "cost" in item && !("spend" in item));
}

function buildLiveSummary(reportGoal: ReportGoalFamily, metrics: MetricsRow, topCampaigns: any[]) {
  const bestCampaign = topCampaigns[0];
  if (goalFamily === "ecommerce") {
    return {
      body: `I have prepared the monthly readout using the actual account data for this period. Spend landed at ${fmtMoney(metrics.cost)} and produced ${fmtMoney(metrics.conversion_value)} in tracked value, keeping ROAS at ${metrics.roas.toFixed(2)}x. ${bestCampaign ? `${bestCampaign.name} was the strongest efficiency driver in the account.` : "This month should be read through return, not just volume."}`,
      takeaways: [
        `ROAS at ${metrics.roas.toFixed(2)}x on ${fmtMoney(metrics.cost)} spend`,
        `${fmtNum(metrics.conversions)} tracked conversions worth ${fmtMoney(metrics.conversion_value)}`,
        `${bestCampaign ? `${bestCampaign.name} led the account on return` : "Efficiency was concentrated in a small part of the account"}`,
      ],
    };
  }
  if (goalFamily === "lead_gen") {
    return {
      body: `I have prepared the monthly readout using the actual account data for this period. Spend landed at ${fmtMoney(metrics.cost)} and drove ${fmtNum(metrics.conversions)} tracked conversions at ${fmtMoney(metrics.cpa)} CPA. ${bestCampaign ? `${bestCampaign.name} was the strongest lead source in the account.` : "The account should be judged on hard output first."}`,
      takeaways: [
        `${fmtNum(metrics.conversions)} tracked conversions`,
        `CPA at ${fmtMoney(metrics.cpa)} on ${fmtMoney(metrics.cost)} spend`,
        `${bestCampaign ? `${bestCampaign.name} created the best lead efficiency` : "Lead quality should stay ahead of raw volume"}`,
      ],
    };
  }
  return {
    body: `I have prepared the monthly readout using the actual account data for this period. The account delivered ${fmtNum(metrics.clicks)} clicks at a ${fmtPct(metrics.ctr)} CTR while holding CPC at ${fmtMoneyPrecise(metrics.cpc)}. ${bestCampaign ? `${bestCampaign.name} carried the strongest momentum.` : "This month should be judged by traffic quality and efficient reach."}`,
    takeaways: [
      `${fmtNum(metrics.clicks)} clicks at ${fmtPct(metrics.ctr)} CTR`,
      `CPC at ${fmtMoneyPrecise(metrics.cpc)} on ${fmtMoney(metrics.cost)} spend`,
      `${bestCampaign ? `${bestCampaign.name} carried the strongest momentum` : "Momentum was uneven across the account"}`,
    ],
  };
}

function buildLiveWhatChanged(reportGoal: ReportGoalFamily, metrics: MetricsRow) {
  const costDelta = delta(metrics.cost, metrics.prior?.cost || 0);
  const cpcDelta = delta(metrics.cpc, metrics.prior?.cpc || 0);
  const convRateDelta = delta(metrics.conversion_rate, metrics.prior?.conversion_rate || 0);
  const roasDelta = delta(metrics.roas, metrics.prior?.roas || 0);

  const primaryDriver = goalFamily === "ecommerce"
    ? `spend ${costDelta.dir === "down" ? "pulled back" : costDelta.dir === "up" ? "scaled up" : "held broadly flat"} while return efficiency ${roasDelta.dir === "up" ? "improved" : roasDelta.dir === "down" ? "softened" : "held roughly flat"}`
    : goalFamily === "lead_gen"
      ? `lead volume ${delta(metrics.conversions, metrics.prior?.conversions || 0).dir === "up" ? "improved" : "softened"} while CPA ${delta(metrics.cpa, metrics.prior?.cpa || 0).dir === "down" ? "became more efficient" : "came under pressure"}`
      : `traffic volume ${delta(metrics.clicks, metrics.prior?.clicks || 0).dir === "up" ? "expanded" : "contracted"} while CPC ${cpcDelta.dir === "down" ? "eased" : cpcDelta.dir === "up" ? "rose" : "held flat"}`;

  return {
    body: `The main movement this month is that ${primaryDriver}. CPC moved from ${fmtMoneyPrecise(metrics.prior?.cpc || 0)} to ${fmtMoneyPrecise(metrics.cpc)}, while conversion rate ${convRateDelta.dir === "up" ? "improved" : convRateDelta.dir === "down" ? "softened" : "held roughly flat"} at ${fmtPct(metrics.conversion_rate)}. This reads more like an efficiency shift in live account performance than a generic seasonal narrative.`,
    drivers: [
      { label: "Primary driver", detail: primaryDriver, tone: roasDelta.dir === "up" || cpcDelta.dir === "down" ? "good" : "medium" },
      { label: "CPC shift", detail: `Average CPC moved from ${fmtMoneyPrecise(metrics.prior?.cpc || 0)} to ${fmtMoneyPrecise(metrics.cpc)}.`, tone: cpcDelta.dir === "down" ? "good" : cpcDelta.dir === "up" ? "medium" : "info" },
      { label: "Conversion efficiency", detail: `Conversion rate moved from ${fmtPct(metrics.prior?.conversion_rate || 0)} to ${fmtPct(metrics.conversion_rate)}.`, tone: convRateDelta.dir === "up" ? "good" : convRateDelta.dir === "down" ? "medium" : "info" },
    ],
  };
}

function buildLiveOpportunities(reportGoal: ReportGoalFamily, topCampaigns: any[], topKeywords: any[]) {
  const weakCampaign = [...topCampaigns].reverse().find((item) => (item.spend || 0) > 0);
  const strongestKeyword = topKeywords[0];
  if (goalFamily === "ecommerce") {
    return `The clearest upside is to shift more weight toward the campaigns and search themes already converting, while reducing exposure in campaigns still spending without return. ${strongestKeyword ? `${strongestKeyword.term} is one of the strongest proven demand signals in the account.` : ""}`.trim();
  }
  if (goalFamily === "lead_gen") {
    return `The clearest upside is to weight budget toward the campaigns already producing conversions efficiently, while trimming broader coverage that consumes spend without enough hard output. ${weakCampaign ? `${weakCampaign.name} is the first area to review.` : ""}`.trim();
  }
  return `The clearest upside is to keep the strongest demand themes live while cutting placements and campaign pockets that add spend without enough downstream response. ${weakCampaign ? `${weakCampaign.name} is the first area to review.` : ""}`.trim();
}

function buildLiveRecommendations(reportGoal: ReportGoalFamily, topCampaigns: any[], topKeywords: any[], topProducts: any[]) {
  const sortedCampaigns = [...topCampaigns].sort((a, b) => (goalFamily === "ecommerce" ? (b.roas || 0) - (a.roas || 0) : (b.conversions || 0) - (a.conversions || 0)));
  const bestCampaign = sortedCampaigns[0];
  const weakestCampaign = [...sortedCampaigns].reverse().find((item) => (item.spend || 0) > 0) || sortedCampaigns[sortedCampaigns.length - 1];
  const bestKeyword = topKeywords[0];
  const bestProduct = topProducts[0];

  return [
    {
      id: "live-rec-1",
      position: 1,
      title: bestCampaign ? `Weight more spend toward ${bestCampaign.name}` : "Weight more spend toward the strongest campaign",
      why: bestCampaign ? `${bestCampaign.name} is currently doing the best efficiency work in the account.` : "A small part of the account is carrying most of the performance.",
      expected_impact: goalFamily === "ecommerce" ? "Protect return while scaling qualified revenue." : "Improve output without raising blended cost too quickly.",
      urgency: "medium",
    },
    {
      id: "live-rec-2",
      position: 2,
      title: weakestCampaign ? `Review or trim ${weakestCampaign.name}` : "Review weaker spend pockets",
      why: weakestCampaign ? `${weakestCampaign.name} is absorbing spend with lower contribution than the rest of the account.` : "Lower-quality spend pockets should not keep the same budget priority.",
      expected_impact: "Reduce waste and make the next month easier to read and optimize.",
      urgency: "medium",
    },
    {
      id: "live-rec-3",
      position: 3,
      title: goalFamily === "ecommerce"
        ? `Expand around ${bestProduct?.name || bestKeyword?.term || "the strongest product/query set"}`
        : `Expand around ${bestKeyword?.term || "the strongest search themes"}`,
      why: goalFamily === "ecommerce"
        ? "The strongest product and search demand pockets are already proving where intent sits."
        : "The best converting search themes are the cleanest expansion path.",
      expected_impact: "Improve concentration around proven demand instead of scaling broadly.",
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
  const reportRef = useRef<HTMLDivElement>(null);

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
          },
          period_month: report.period_month,
          metrics: normalizeMetricsForDisplay(metrics),
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
  const topKeywords = aggregateKeywords(normalizeKeywords(asArray<any>(displayMetrics.top_search_terms ?? displayMetrics.top_keywords)))
    .filter((keyword) => Number(keyword.clicks || 0) > 0)
    .sort((a, b) => (b.clicks || 0) - (a.clicks || 0) || (b.conversions || 0) - (a.conversions || 0));
  const topProducts = aggregateProducts(normalizeProducts(asArray<any>(displayMetrics.top_products)))
    .sort((a, b) => (b.clicks || 0) - (a.clicks || 0) || (b.conversions || 0) - (a.conversions || 0));
  const deviceSplit = buildDeviceSplit(displayMetrics);
  const liveSummary = useLiveDerivedContent ? buildLiveSummary(goalFamily, displayMetrics, spendCampaigns) : null;
  const liveWhatChanged = useLiveDerivedContent ? buildLiveWhatChanged(goalFamily, displayMetrics) : null;
  const liveOpportunities = useLiveDerivedContent ? buildLiveOpportunities(goalFamily, spendCampaigns, topKeywords) : null;
  const liveRecommendations = useLiveDerivedContent ? buildLiveRecommendations(goalFamily, spendCampaigns, topKeywords, topProducts) : [];
  const summaryBody = useLiveDerivedContent ? liveSummary?.body || summary?.body || "" : summary?.body || "";
  const takeaways: string[] = useLiveDerivedContent
    ? asArray<string>(liveSummary?.takeaways)
    : asArray<string>(summaryData.takeaways);
  const timeline = buildTimeline(report.period_month, displayMetrics, !useLiveDerivedContent ? asArray<any>(summaryData.timeline) : []);
  const conversionSplit = asArray<any>(summaryData.conversionSplit);
  const leadActions = asArray<any>(summaryData.leadActions);
  const driverCards = useLiveDerivedContent && !whatChanged?.data?.manual_override
    ? asArray<any>(liveWhatChanged?.drivers)
    : asArray<any>(whatChanged?.data?.drivers);
  const opportunitiesBody = useLiveDerivedContent ? liveOpportunities || opportunities?.body || "" : opportunities?.body || "";
  const decisionBody = useLiveDerivedContent
    ? "Three priorities for next month, ordered by expected impact and grounded in the actual account data."
    : decision?.body || "Three priorities for next month, ordered by expected impact.";
  const recommendationItems = useLiveDerivedContent ? liveRecommendations : recs;
  const heroMetrics = getHeroMetrics(goalFamily, displayMetrics, conversionSplit);
  const winners = getCampaignWinners(spendCampaigns, goalFamily);

  return (
    <div className="report-theme min-h-screen overflow-x-hidden bg-background">
      <div className="no-print sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex flex-wrap items-center justify-between gap-4 px-5 py-[14px] sm:px-8 md:px-[60px]" style={{ maxWidth: 1060 }}>
          <Link to="/reports" className="inline-flex items-center gap-2 text-sm lynck-muted hover:text-foreground">
            <ArrowLeft className="size-4" /> All reports
          </Link>
          <div className="flex flex-wrap items-center gap-2">
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
          {summaryBody && (
            <p className="relative max-w-3xl whitespace-pre-wrap leading-relaxed text-card-body lynck-muted">
              {summaryBody}
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

          <div className="mt-6">
            <ChartCard
              label="Six-month trend"
              title={goalFamily === "ecommerce" ? "Spend vs return" : goalFamily === "lead_gen" ? "Spend vs hard output" : "Spend vs demand"}
              body="A quick read on direction matters more than a paragraph of explanation here."
            >
              <MiniTrendChart data={timeline} goal={goalFamily} />
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
          <div className="grid gap-4 md:grid-cols-[1.55fr_1fr]">
            <ChartCard label="Performance comparison" title="Campaign ladder">
              <CampaignPerformanceChart campaigns={spendCampaigns} goal={goalFamily} />
            </ChartCard>
            <ChartCard label="Budget allocation" title="Spend share">
              <SpendShareChart campaigns={spendCampaigns} totalSpend={displayMetrics.cost} />
            </ChartCard>
          </div>
          <div className={`mt-4 grid gap-4 ${deviceSplit.length > 0 ? "md:grid-cols-[1.15fr_0.85fr]" : "md:grid-cols-1"}`}>
            <WinnerCard title="Top winner" campaign={winners.best} goal={goalFamily} />
            {deviceSplit.length > 0 && (
              <ChartCard label="Audience split" title="Device split">
                <DeviceSplitCard split={deviceSplit} />
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
          />

          <div className="mt-10 grid gap-4 md:grid-cols-[0.78fr_1.22fr]">
            <ChartCard label="Movement detail" title="Main movements">
              <DriverGrid drivers={driverCards} stacked />
            </ChartCard>
            <ChartCard label="Search insight" title="Top 10 search terms">
              <TopItemsList
                items={topKeywords.slice(0, 10).map((keyword) => ({
                  name: keyword.term,
                  clicks: keyword.clicks,
                  conversions: keyword.conversions,
                  avgCpc: keyword.clicks > 0 ? keyword.cost / keyword.clicks : 0,
                }))}
                emptyLabel="No search term data available yet."
                nameColumnRatio={2.2}
              />
            </ChartCard>
          </div>

          {goalFamily === "ecommerce" ? (
            <div className="mt-4">
              <ChartCard label="Product insight" title="Top 10 products">
                <TopItemsList
                  items={topProducts.slice(0, 10).map((product) => ({
                    name: product.name,
                    clicks: product.clicks,
                    conversions: product.conversions,
                    avgCpc: product.avgCpc ?? (product.clicks > 0 ? product.cost / product.clicks : 0),
                  }))}
                  emptyLabel="No product-level performance available yet."
                  nameColumnRatio={4.1}
                />
              </ChartCard>
            </div>
          ) : goalFamily === "lead_gen" ? (
            <div className="mt-4">
              <ChartCard label="Lead insight" title="Hard vs soft conversions">
                <LeadInsightPanel split={conversionSplit} actions={leadActions} />
              </ChartCard>
            </div>
          ) : (
            <div className="mt-4">
              <ChartCard label="Growth insight" title="Momentum signals">
                <GrowthInsightPanel metrics={displayMetrics} keywords={topKeywords} />
              </ChartCard>
            </div>
          )}

          {opportunitiesBody && (
            <div className="mt-4">
              <InsightNote label="Optimization lens" body={opportunitiesBody} />
            </div>
          )}
        </section>

        <SectionWrap label="Decision page" title="Recommended" emphasize="actions">
          <p className="mb-6 max-w-2xl text-card-body lynck-muted">{decisionBody}</p>
          <div className="space-y-4">
            {recommendationItems.map((r, i) => (
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
  overrideBody,
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
}) {
  if (!section) return null;
  const titleMap: Record<string, { label: string; title: string; em: string }> = {
    executive_summary: { label: "Executive summary", title: "The month at", em: "a glance" },
    what_changed: { label: "What changed", title: "Why the numbers", em: "moved" },
    opportunities: { label: "Opportunities", title: "Where to lean", em: "in next" },
    appendix: { label: "Appendix", title: "Supporting", em: "detail" },
  };
  const t = titleMap[kind] || { label: section.title, title: section.title, em: "" };
  const displayBody = overrideBody ?? section.body;
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
          {!isEditing && <Button size="sm" variant="ghost" onClick={() => setEditing({ ...editing, [section.id]: displayBody })}>Edit</Button>}
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

function MiniTrendChart({ data, goal }: { data: any[]; goal: ReportGoalFamily }) {
  const secondaryKey = goal === "ecommerce" ? "roas" : goal === "lead_gen" ? "conversions" : "clicks";
  const secondaryLabel = goal === "ecommerce" ? "ROAS" : goal === "lead_gen" ? "Conversions" : "Clicks";
  return (
    <div className="h-[250px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ left: 0, right: 8, top: 12, bottom: 0 }}>
          <CartesianGrid stroke={reportPalette.grid} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: reportPalette.muted, fontSize: 12 }} axisLine={false} tickLine={false} tickMargin={10} />
          <YAxis yAxisId="left" tick={{ fill: reportPalette.muted, fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis yAxisId="right" orientation="right" tick={{ fill: reportPalette.muted, fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ background: reportPalette.surfaceAlt, border: `1px solid ${reportPalette.border}`, borderRadius: 12, color: reportPalette.text }}
            formatter={(value: any, name: string) => [name === "Cost" ? fmtMoney(Number(value)) : name === "ROAS" ? `${Number(value).toFixed(2)}x` : name === "CPA" ? fmtMoneyPrecise(Number(value)) : fmtNum(Number(value)), name]}
          />
          <Line yAxisId="left" type="monotone" dataKey="cost" name="Cost" stroke={reportPalette.accent} strokeWidth={3} dot={{ r: 4, fill: reportPalette.accent }} activeDot={{ r: 5 }} />
          <Line yAxisId="right" type="monotone" dataKey={secondaryKey} name={secondaryLabel} stroke={reportPalette.data} strokeWidth={2.5} dot={{ r: 4, fill: reportPalette.data }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function CampaignPerformanceChart({ campaigns, goal }: { campaigns: any[]; goal: ReportGoalFamily }) {
  if (!campaigns.length) {
    return <p className="text-sm lynck-muted">No spend was recorded across campaigns for this period.</p>;
  }
  const metricLabel = goal === "ecommerce" ? "ROAS" : goal === "lead_gen" ? "CPA" : "Clicks";
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
              if (name === "Spend") return [fmtMoney(Number(value)), "Spend"];
              if (goal === "ecommerce") return [`${Number(value).toFixed(2)}x`, metricLabel];
              if (goal === "lead_gen") return [fmtMoneyPrecise(Number(value)), metricLabel];
              return [fmtNum(Number(value), 0), metricLabel];
            }}
          />
          <Bar yAxisId="left" dataKey="spend" name="Spend" radius={[8, 8, 0, 0]} barSize={34}>
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

function SpendShareChart({ campaigns, totalSpend }: { campaigns: any[]; totalSpend: number }) {
  if (!campaigns.length) {
    return <p className="text-sm lynck-muted">No spend-share breakdown is available for this period.</p>;
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
            formatter={(value: any) => [`${Number(value).toFixed(1)}%`, "Spend share"]}
          />
        </PieChart>
      </ResponsiveContainer>
      <p className="text-sm lynck-muted">Tracked spend: <span className="text-foreground">{fmtMoney(totalSpend)}</span></p>
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

function WinnerCard({ title, campaign, goal, inverse = false }: { title: string; campaign?: any; goal: ReportGoalFamily; inverse?: boolean }) {
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

function DeviceSplitCard({ split }: { split: { label: string; value: number }[] }) {
  if (!split.length) {
    return (
      <div className="flex min-h-[240px] items-center justify-center rounded-[12px] border border-dashed px-6 text-center text-sm lynck-muted" style={{ borderColor: reportPalette.border, background: reportPalette.surfaceAlt }}>
        Device segmentation is not stored in the report data yet. Once the Google Ads sync writes device-level metrics, this chart can render the real split here.
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
              formatter={(value: any) => [`${((Number(value) / total) * 100).toFixed(1)}%`, "Share"]}
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
}: {
  items: { name: string; clicks: number; conversions: number; avgCpc: number }[];
  emptyLabel: string;
  nameColumnRatio?: number;
}) {
  if (!items.length) {
    return <p className="text-sm lynck-muted">{emptyLabel}</p>;
  }

  return (
    <div className="overflow-hidden rounded-[12px] border" style={{ borderColor: reportPalette.border, background: reportPalette.surfaceAlt }}>
      <div className="grid gap-2 border-b px-3 py-2 text-[11px] uppercase tracking-[0.15em] lynck-muted" style={{ borderColor: reportPalette.border, gridTemplateColumns: `minmax(0,${nameColumnRatio}fr) 48px 52px 72px` }}>
        <span>Item</span>
        <span className="text-right">Clicks</span>
        <span className="text-right">Conv.</span>
        <span className="text-right">Avg. CPC</span>
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

function getHeroMetrics(reportGoal: ReportGoalFamily, metrics: MetricsRow, split: any[]) {
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
    { label: "CPC", value: fmtMoneyPrecise(metrics.cpc), now: metrics.cpc, prior: metrics.prior?.cpc, invert: true, footnote: "Growth lens" },
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
