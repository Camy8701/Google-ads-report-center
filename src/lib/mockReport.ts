import type { ReportGoal } from "./reportGoal";

type BusinessType = "ecommerce" | "lead_gen" | string;

interface GenerateMockReportInput {
  businessType: BusinessType;
  reportGoal: ReportGoal;
  periodMonth: string;
}

const monthLabels = (periodMonth: string) => {
  const base = new Date(periodMonth);
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(base);
    d.setMonth(base.getMonth() - (5 - i));
    return d.toLocaleDateString(undefined, { month: "short" });
  });
};

export function generateMockReport({ businessType, reportGoal, periodMonth }: GenerateMockReportInput) {
  const isEcom = reportGoal === "ecommerce" || businessType === "ecommerce";
  const isLeadGen = reportGoal === "lead_gen";
  const isGrowth = reportGoal === "growth";

  const r = (min: number, max: number) => Math.round(min + Math.random() * (max - min));
  const rf = (min: number, max: number, d = 2) => Number((min + Math.random() * (max - min)).toFixed(d));
  const around = (n: number, variance = 0.18) => Number((n * (1 - variance + Math.random() * variance * 2)).toFixed(2));

  const impressions = r(isGrowth ? 260000 : 180000, isGrowth ? 780000 : 580000);
  const ctr = rf(isGrowth ? 3.8 : 2.8, isGrowth ? 6.2 : 4.7);
  const clicks = Math.round((impressions * ctr) / 100);
  const cpc = rf(isEcom ? 0.85 : isLeadGen ? 3.2 : 1.2, isEcom ? 1.7 : isLeadGen ? 7.2 : 2.4);
  const cost = Number((clicks * cpc).toFixed(2));
  const convRate = rf(isEcom ? 1.8 : isLeadGen ? 2.1 : 1.2, isEcom ? 3.1 : isLeadGen ? 4.2 : 2.0);
  const conversions = Math.round((clicks * convRate) / 100);
  const cpa = conversions ? Number((cost / conversions).toFixed(2)) : 0;
  const conversionValue = isEcom ? Number((conversions * r(180, 320)).toFixed(2)) : Number((conversions * r(65, 140)).toFixed(2));
  const roas = cost ? Number((conversionValue / cost).toFixed(2)) : 0;

  const hardConversions = isLeadGen ? Math.max(8, Math.round(conversions * 0.38)) : isGrowth ? Math.max(10, Math.round(conversions * 0.6)) : conversions;
  const softConversions = isLeadGen ? Math.max(12, conversions - hardConversions) : Math.max(0, Math.round(conversions * 0.2));

  const prior = {
    impressions: Math.round(around(impressions)),
    clicks: Math.round(around(clicks)),
    ctr: Number(around(ctr).toFixed(2)),
    cpc: Number(around(cpc).toFixed(2)),
    cost: around(cost),
    conversions: Math.round(around(conversions)),
    conversion_rate: Number(around(convRate).toFixed(2)),
    cpa: around(cpa),
    conversion_value: around(conversionValue),
    roas: Number(around(roas).toFixed(2)),
  };

  const labels = monthLabels(periodMonth);
  const trend = labels.map((label, index) => {
    const weight = 0.76 + index * 0.06;
    const seasonality = isGrowth ? 1 + index * 0.03 : 1 + Math.sin(index / 2) * 0.06;
    const monthCost = Math.round(cost * weight * seasonality);
    const monthConversions = Math.max(1, Math.round(conversions * weight * (isLeadGen ? 1.02 : 0.98 + index * 0.02)));
    const monthRevenue = Math.round(conversionValue * weight * (isEcom ? 1.04 : 0.92 + index * 0.02));
    return {
      label,
      cost: monthCost,
      conversions: monthConversions,
      roas: monthCost ? Number((monthRevenue / monthCost).toFixed(2)) : 0,
      cpa: monthConversions ? Number((monthCost / monthConversions).toFixed(2)) : 0,
      clicks: Math.round(clicks * weight),
    };
  });

  const topCampaigns = isEcom
    ? [
        { name: "Shopping - Core", spend: Math.round(cost * 0.33), conversions: Math.round(conversions * 0.36), roas: rf(3.8, 5.6), cpa: rf(12, 22), delta: 14, status: "winner" },
        { name: "Brand Search", spend: Math.round(cost * 0.12), conversions: Math.round(conversions * 0.24), roas: rf(7.2, 9.4), cpa: rf(6, 12), delta: 18, status: "winner" },
        { name: "PMax - Prospecting", spend: Math.round(cost * 0.29), conversions: Math.round(conversions * 0.19), roas: rf(2.2, 3.4), cpa: rf(24, 36), delta: -11, status: "watch" },
        { name: "Generic Search", spend: Math.round(cost * 0.16), conversions: Math.round(conversions * 0.13), roas: rf(2.0, 2.8), cpa: rf(22, 34), delta: -8, status: "watch" },
        { name: "Remarketing", spend: Math.round(cost * 0.1), conversions: Math.round(conversions * 0.08), roas: rf(4.6, 6.1), cpa: rf(10, 18), delta: 7, status: "winner" },
      ]
    : isLeadGen
      ? [
          { name: "Search - Core", spend: Math.round(cost * 0.37), conversions: Math.round(conversions * 0.34), cpa: rf(48, 82), roas: 0, delta: 16, status: "winner" },
          { name: "Brand", spend: Math.round(cost * 0.08), conversions: Math.round(conversions * 0.16), cpa: rf(18, 35), roas: 0, delta: 12, status: "winner" },
          { name: "PMax - Leads", spend: Math.round(cost * 0.23), conversions: Math.round(conversions * 0.18), cpa: rf(72, 118), roas: 0, delta: -9, status: "watch" },
          { name: "DSA Expansion", spend: Math.round(cost * 0.19), conversions: Math.round(conversions * 0.14), cpa: rf(68, 110), roas: 0, delta: -5, status: "watch" },
          { name: "Competitor Search", spend: Math.round(cost * 0.13), conversions: Math.round(conversions * 0.08), cpa: rf(84, 128), roas: 0, delta: -14, status: "weak" },
        ]
      : [
          { name: "Demand Capture", spend: Math.round(cost * 0.24), conversions: Math.round(conversions * 0.18), cpa: rf(28, 44), roas: 0, delta: 11, status: "winner" },
          { name: "Non-brand Search", spend: Math.round(cost * 0.21), conversions: Math.round(conversions * 0.16), cpa: rf(34, 52), roas: 0, delta: 9, status: "winner" },
          { name: "PMax - Reach", spend: Math.round(cost * 0.28), conversions: Math.round(conversions * 0.14), cpa: rf(48, 66), roas: 0, delta: -3, status: "watch" },
          { name: "YouTube Assist", spend: Math.round(cost * 0.15), conversions: Math.round(conversions * 0.07), cpa: rf(55, 74), roas: 0, delta: -6, status: "watch" },
          { name: "Display Prospecting", spend: Math.round(cost * 0.12), conversions: Math.round(conversions * 0.05), cpa: rf(70, 96), roas: 0, delta: -12, status: "weak" },
        ];

  const totalCampaignSpend = topCampaigns.reduce((sum, item) => sum + item.spend, 0) || 1;
  const campaignData = topCampaigns.map((item) => ({
    ...item,
    spendShare: Number(((item.spend / totalCampaignSpend) * 100).toFixed(1)),
  }));

  const topKeywords = isLeadGen
    ? [
        { term: "[service] near me", clicks: r(600, 1300), conversions: r(16, 42), ctr: rf(5.2, 8.6), cpa: rf(28, 54) },
        { term: "best [service] [city]", clicks: r(380, 760), conversions: r(10, 26), ctr: rf(4.8, 7.4), cpa: rf(34, 58) },
        { term: "[brand]", clicks: r(260, 520), conversions: r(14, 34), ctr: rf(10.8, 18.4), cpa: rf(14, 28) },
        { term: "emergency [service]", clicks: r(120, 320), conversions: r(6, 18), ctr: rf(6.1, 9.3), cpa: rf(42, 66) },
      ]
    : isGrowth
      ? [
          { term: "[brand] reviews", clicks: r(320, 760), conversions: r(8, 18), ctr: rf(8.2, 12.2), cpa: rf(26, 44) },
          { term: "[category] solutions", clicks: r(420, 980), conversions: r(10, 20), ctr: rf(4.4, 6.8), cpa: rf(34, 58) },
          { term: "[category] for teams", clicks: r(220, 640), conversions: r(6, 14), ctr: rf(5.8, 8.1), cpa: rf(40, 62) },
          { term: "[brand]", clicks: r(260, 540), conversions: r(7, 16), ctr: rf(11.8, 18.6), cpa: rf(16, 32) },
        ]
      : [
          { term: "best [product] online", clicks: r(800, 1800), conversions: r(18, 60), ctr: rf(4.2, 7.4), cpa: rf(12, 22) },
          { term: "[brand]", clicks: r(400, 1200), conversions: r(32, 92), ctr: rf(12.4, 21.8), cpa: rf(6, 14) },
          { term: "buy [product]", clicks: r(580, 1400), conversions: r(14, 48), ctr: rf(4.5, 7.6), cpa: rf(16, 28) },
          { term: "[product] sale", clicks: r(280, 860), conversions: r(10, 34), ctr: rf(5.0, 8.8), cpa: rf(18, 30) },
        ];

  const topProducts = isEcom
    ? [
        { name: "Hero Product A", sales: r(60, 130), revenue: r(15000, 40000), margin: rf(22, 38), trend: 15 },
        { name: "Hero Product B", sales: r(40, 90), revenue: r(12000, 30000), margin: rf(18, 32), trend: 9 },
        { name: "Hero Product C", sales: r(35, 80), revenue: r(8000, 18000), margin: rf(16, 28), trend: -4 },
        { name: "Hero Product D", sales: r(18, 45), revenue: r(4000, 12000), margin: rf(14, 24), trend: -11 },
      ]
    : [];

  const conversionSplit = [
    { label: "Hard conversions", value: hardConversions, color: "#EC8A1D" },
    { label: "Soft conversions", value: softConversions, color: "#8FA9C7" },
  ];
  const leadActions = isLeadGen
    ? [
        { label: "Form submits", value: Math.round(hardConversions * 0.56) },
        { label: "Phone clicks", value: Math.round(hardConversions * 0.27) },
        { label: "Email clicks", value: Math.max(1, hardConversions - Math.round(hardConversions * 0.56) - Math.round(hardConversions * 0.27)) },
      ]
    : [];

  const overallStatus = isEcom ? (roas >= 4 ? "good" : roas >= 3 ? "medium" : "urgent") : cpa <= (isLeadGen ? 65 : 40) ? "good" : cpa <= (isLeadGen ? 90 : 55) ? "medium" : "urgent";
  const headline = isEcom
    ? `Revenue efficiency held at ${roas.toFixed(2)}x while spend ${cost > prior.cost ? "scaled" : "eased"}`
    : isLeadGen
      ? `${hardConversions} hard conversions delivered at ${Math.round(cpa)} CPA`
      : `Traffic and demand capture grew while CPC held at ${cpc.toFixed(2)}`;

  const primaryDriver = isEcom
    ? "seasonal demand expanded into higher-intent product searches"
    : isLeadGen
      ? "higher-intent search demand improved lead flow after search coverage tightened"
      : "broader reach campaigns pushed more qualified traffic into search and site visits";

  const externalDriver = isEcom
    ? "auction pressure increased in shopping after competitors raised visibility"
    : isLeadGen
      ? "lead volume tracked local demand swings more than any structural tracking change"
      : "external demand and seasonality accounted for a meaningful share of the lift";

  const sections = [
    {
      kind: "executive_summary",
      position: 1,
      title: "Executive Summary",
      body: `I have prepared the monthly readout with the metrics that matter most for this account. ${isEcom ? `Spend landed at ${Math.round(cost).toLocaleString()} and produced ${Math.round(conversionValue).toLocaleString()} in tracked value, keeping ROAS at ${roas.toFixed(2)}x.` : isLeadGen ? `${hardConversions} hard conversions and ${softConversions} soft conversions came through on ${Math.round(cost).toLocaleString()} of spend.` : `The account expanded traffic efficiently, with ${clicks.toLocaleString()} clicks at a ${ctr.toFixed(2)}% CTR and ${conversions} tracked conversions.`} The main story this month is that ${primaryDriver}.`,
      data: {
        goal: reportGoal,
        takeaways: [
          `${isEcom ? `ROAS at ${roas.toFixed(2)}x` : isLeadGen ? `${hardConversions} hard conversions` : `${clicks.toLocaleString()} clicks at ${ctr.toFixed(2)}% CTR`}`,
          `Cost ${cost > prior.cost ? "rose" : "eased"} to ${Math.round(cost).toLocaleString()} (${Math.abs(((cost - prior.cost) / Math.max(prior.cost, 1)) * 100).toFixed(0)}% MoM)`,
          `${isEcom ? "Brand and Shopping" : isLeadGen ? "Core Search and Brand" : "Demand Capture and Non-brand"} carried most of the gain`,
        ],
        timeline,
        conversionSplit,
        leadActions,
      },
    },
    {
      kind: "what_changed",
      position: 2,
      title: "What Changed and Why",
      body: `The biggest movement this month was that ${primaryDriver}. CPC moved from ${prior.cpc.toFixed(2)} to ${cpc.toFixed(2)}, while conversion rate ${convRate > prior.conversion_rate ? "improved" : "softened"} to ${convRate.toFixed(2)}%. Part of the movement also appears to be external: ${externalDriver}.`,
      data: {
        drivers: [
          { label: "Primary driver", detail: primaryDriver, tone: "good" },
          { label: "Efficiency shift", detail: `${convRate > prior.conversion_rate ? "Conversion rate improved" : "Conversion rate softened"} while CPC ${cpc > prior.cpc ? "rose" : "eased"}.`, tone: cpc > prior.cpc ? "medium" : "good" },
          { label: "External context", detail: externalDriver, tone: "info" },
        ],
      },
    },
    {
      kind: "opportunities",
      position: 3,
      title: "Opportunities",
      body: isEcom
        ? "The clearest upside is to keep shifting spend toward the campaigns and products with the strongest blended margin. The weaker generic segments are still useful for scale, but they should not receive the same priority as brand-adjacent demand."
        : isLeadGen
          ? "The clearest upside is to keep protecting efficient search coverage while reducing exposure to broad themes that inflate soft conversions. Soft conversion volume is still useful, but hard-conversion efficiency should stay in the lead."
          : "The clearest upside is to keep pushing the campaigns that build demand cheaply while trimming placements that raise cost without improving downstream engagement. This report should stay focused on momentum rather than explaining every fluctuation.",
      data: {},
    },
    {
      kind: "decision_page",
      position: 4,
      title: "Recommended Actions",
      body: "These are the three moves with the best balance of impact, speed, and confidence for next month.",
      data: {},
    },
    {
      kind: "appendix",
      position: 5,
      title: "Appendix",
      body: "Additional campaign, search term, and account detail can be layered in if the client wants a deeper operating view.",
      data: {},
    },
  ];

  const recommendations = isEcom
    ? [
        { position: 1, title: "Shift more budget into Brand Search and Shopping Core", why: "Those two campaigns are creating the best mix of volume and efficiency.", expected_impact: "Protect ROAS while scaling conversion value another 8-12%.", urgency: "medium" },
        { position: 2, title: "Pull back generic search terms with weak margin", why: "They add volume, but the blended return is lower than the rest of the account.", expected_impact: "Reduce wasted spend and stabilize blended ROAS.", urgency: "medium" },
        { position: 3, title: "Promote the strongest product set more aggressively", why: "A small set of SKUs is doing most of the revenue work right now.", expected_impact: "Improve product mix and raise total tracked value.", urgency: "good" },
      ]
    : isLeadGen
      ? [
          { position: 1, title: "Weight more spend toward Search Core", why: "It is producing the best hard-conversion efficiency in the account.", expected_impact: "Lift hard conversions without materially raising CPA.", urgency: "urgent" },
          { position: 2, title: "Separate soft-conversion traffic from core lead budgets", why: "Soft conversions are useful signals, but they should not dictate the main budget mix.", expected_impact: "Make lead efficiency easier to read and optimize.", urgency: "medium" },
          { position: 3, title: "Trim weak competitor and DSA coverage", why: "Those campaigns are absorbing spend with lower conversion quality.", expected_impact: "Reduce CPA pressure next month.", urgency: "medium" },
        ]
      : [
          { position: 1, title: "Keep scaling the best traffic-building campaigns", why: "Demand Capture and Non-brand are lifting volume at an acceptable efficiency.", expected_impact: "Sustain traffic growth without a large CPC jump.", urgency: "medium" },
          { position: 2, title: "Reduce weak display-style reach placements", why: "They support awareness, but they are not carrying the same contribution to conversions.", expected_impact: "Tighten spend and improve blended account efficiency.", urgency: "medium" },
          { position: 3, title: "Use stronger query coverage around the winning themes", why: "The top search themes are already proving there is room to expand demand.", expected_impact: "Lift click volume and keep CTR stable.", urgency: "good" },
        ];

  return {
    headline,
    overall_status: overallStatus,
    metrics: {
      impressions,
      clicks,
      ctr,
      cpc,
      cost,
      conversions,
      conversion_rate: convRate,
      cpa,
      conversion_value: conversionValue,
      roas,
      prior,
      top_campaigns: campaignData,
      top_keywords: topKeywords,
      top_products: topProducts,
    },
    sections,
    recommendations,
  };
}
