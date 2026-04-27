/**
 * Generates believable mock report data for a new monthly report.
 * Returns metrics, narrative sections, and recommendations.
 */
export function generateMockReport(businessType: "ecommerce" | "lead_gen" | string) {
  const isEcom = businessType === "ecommerce";

  // Random-ish but bounded numbers
  const r = (min: number, max: number) => Math.round(min + Math.random() * (max - min));
  const rf = (min: number, max: number, d = 2) => Number((min + Math.random() * (max - min)).toFixed(d));

  const impressions = r(180000, 600000);
  const ctr = rf(2.8, 4.5);
  const clicks = Math.round((impressions * ctr) / 100);
  const cpc = rf(isEcom ? 0.9 : 3.0, isEcom ? 1.6 : 6.5);
  const cost = Number((clicks * cpc).toFixed(2));
  const convRate = rf(isEcom ? 1.8 : 1.4, isEcom ? 3.0 : 2.2);
  const conversions = Math.round((clicks * convRate) / 100);
  const cpa = conversions ? Number((cost / conversions).toFixed(2)) : 0;
  const conversionValue = isEcom ? Number((conversions * r(180, 320)).toFixed(2)) : 0;
  const roas = isEcom && cost ? Number((conversionValue / cost).toFixed(2)) : 0;

  // Prior-month snapshot ~5-15% off
  const j = (n: number) => Number((n * (0.85 + Math.random() * 0.2)).toFixed(2));
  const prior = {
    impressions: Math.round(j(impressions)),
    clicks: Math.round(j(clicks)),
    ctr: Number(j(ctr).toFixed(2)),
    cpc: Number(j(cpc).toFixed(2)),
    cost: j(cost),
    conversions: Math.round(j(conversions)),
    conversion_rate: Number(j(convRate).toFixed(2)),
    cpa: j(cpa),
    conversion_value: j(conversionValue),
    roas: Number(j(roas).toFixed(2)),
  };

  const top_campaigns = isEcom
    ? [
        { name: "Shopping — Core", cost: Math.round(cost * 0.42), conversions: Math.round(conversions * 0.45), roas: rf(3.4, 5.2) },
        { name: "Brand Search", cost: Math.round(cost * 0.1), conversions: Math.round(conversions * 0.22), roas: rf(6.5, 8.5) },
        { name: "PMax — All", cost: Math.round(cost * 0.32), conversions: Math.round(conversions * 0.25), roas: rf(2.8, 3.8) },
      ]
    : [
        { name: "Search — Core", cost: Math.round(cost * 0.5), conversions: Math.round(conversions * 0.5), roas: 0 },
        { name: "Brand", cost: Math.round(cost * 0.1), conversions: Math.round(conversions * 0.25), roas: 0 },
        { name: "PMax — Lead", cost: Math.round(cost * 0.28), conversions: Math.round(conversions * 0.2), roas: 0 },
      ];
  const top_keywords = isEcom
    ? [{ term: "best [product] online", clicks: r(800, 2000), conversions: r(20, 80) },
       { term: "[brand]", clicks: r(400, 1500), conversions: r(40, 100) },
       { term: "buy [product]", clicks: r(600, 1500), conversions: r(15, 60) }]
    : [{ term: "[service] near me", clicks: r(600, 1500), conversions: r(20, 50) },
       { term: "[brand]", clicks: r(300, 600), conversions: r(20, 50) },
       { term: "best [service] [city]", clicks: r(400, 1000), conversions: r(10, 30) }];
  const top_products = isEcom
    ? [{ name: "Hero Product A", sales: r(60, 130), revenue: r(15000, 40000) },
       { name: "Hero Product B", sales: r(40, 90), revenue: r(12000, 30000) },
       { name: "Hero Product C", sales: r(40, 85), revenue: r(8000, 18000) }]
    : [];

  const overall_status = roas > 4 || (!isEcom && cpa < 200) ? "good" : "medium";
  const headline = isEcom
    ? `Spend ${prior.cost && cost > prior.cost ? "scaled" : "held"} with ROAS at ${roas.toFixed(2)}`
    : `Lead volume tracking with CPL at $${cpa.toFixed(0)}`;

  const sections = [
    {
      kind: "executive_summary", position: 1, title: "Executive Summary",
      body: `I have prepared this monthly recap. ${isEcom
        ? `Revenue came in at $${conversionValue.toLocaleString()} on $${Math.round(cost).toLocaleString()} of spend, for a ${roas.toFixed(2)}x ROAS.`
        : `${conversions} conversions came in at a $${cpa.toFixed(0)} CPA.`} The headline takeaway is that performance is ${overall_status === "good" ? "tracking on plan" : "facing pressure that we can address through targeted optimization"}.`,
      data: { takeaways: [
        `${isEcom ? `ROAS at ${roas.toFixed(2)}x` : `CPL at $${cpa.toFixed(0)}`}`,
        `Conversion volume: ${conversions} (${conversions > prior.conversions ? "+" : ""}${(((conversions - prior.conversions) / Math.max(prior.conversions, 1)) * 100).toFixed(0)}% MoM)`,
        `CPC ${cpc > prior.cpc ? "rose" : "eased"} to $${cpc.toFixed(2)}`,
      ] },
    },
    {
      kind: "what_changed", position: 2, title: "What Changed and Why",
      body: `The biggest movement this month was on ${cost > prior.cost ? "spend, which scaled" : "efficiency, with cost contracting"}. ${isEcom ? "Shopping" : "Search"} continued to do the heavy lifting. CPC moved from $${prior.cpc.toFixed(2)} to $${cpc.toFixed(2)}, and conversion rate ${convRate > prior.conversion_rate ? "improved" : "softened"} to ${convRate.toFixed(2)}%. The most likely driver is a combination of competitive auction dynamics and recent campaign mix changes.`,
      data: {},
    },
    {
      kind: "opportunities", position: 3, title: "Opportunities",
      body: `Two opportunities stand out. Brand search continues to deliver disproportionate efficiency and is undersaturated. ${isEcom ? "Reweighting Shopping toward the highest-margin SKUs would lift blended ROAS without new spend." : "Tightening geo and adding intent-rich negatives would improve lead quality."}`,
      data: {},
    },
    { kind: "decision_page", position: 4, title: "Recommended Actions", body: "Three priorities for next month, ordered by expected impact.", data: {} },
    { kind: "appendix", position: 5, title: "Appendix", body: "Detailed campaign and keyword data available on request.", data: {} },
  ];

  const recommendations = isEcom
    ? [
        { position: 1, title: "Expand brand-adjacent terms", why: "Brand search is the most efficient line item but undersaturated.", expected_impact: "+8–12% incremental brand revenue at similar ROAS.", urgency: "medium" },
        { position: 2, title: "A/B test top product landing pages", why: "Conversion rate has room to lift on the top SKUs.", expected_impact: "Lift CR by 30–50 bps account-wide.", urgency: "medium" },
        { position: 3, title: "Hold PMax feed refresh cadence", why: "Asset rotation is correlating with ROAS lifts.", expected_impact: "Maintain PMax efficiency through next month.", urgency: "good" },
      ]
    : [
        { position: 1, title: "Tighten broad-match coverage", why: "Broad themes are absorbing spend without producing qualified leads.", expected_impact: "Reduce CPL by ~10%.", urgency: "urgent" },
        { position: 2, title: "Reallocate budget to top-performing campaign", why: "The top campaign has lower CPL and is under-funded.", expected_impact: "Reduce blended CPL by $10–20.", urgency: "medium" },
        { position: 3, title: "Geo-tighten to top-performing ZIPs", why: "Lead-to-customer rate is materially higher in top geos.", expected_impact: "Improve downstream ROAS.", urgency: "medium" },
      ];

  return {
    headline, overall_status,
    metrics: {
      impressions, clicks, ctr, cpc, cost, conversions,
      conversion_rate: convRate, cpa, conversion_value: conversionValue, roas,
      prior, top_campaigns, top_keywords, top_products,
    },
    sections, recommendations,
  };
}
