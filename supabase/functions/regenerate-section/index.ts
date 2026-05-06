import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SECTION_PROMPTS: Record<string, string> = {
  executive_summary: "Write a tight 3-4 sentence executive summary. Open with 'I have prepared'. Focus only on the primary performance outcome, the biggest driver, and the one thing the client should know. First-person, constructive, no filler.",
  what_changed: "Write a concise 3-4 sentence explanation of what changed and why. Reference only the most material metrics. If the most likely cause is seasonality or external market pressure, say that plainly instead of forcing a deeper explanation.",
  opportunities: "Write a compact 2-3 sentence optimization lens section. Focus on where attention should go next without sounding generic. First-person, solution-oriented.",
  decision_page: "Write a 1-2 sentence intro to the recommended actions. Confident and direct. First-person.",
  appendix: "Write a 1-2 sentence note describing what supporting detail is available on request.",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { section_kind, client, period_month, metrics, notes } = await req.json();
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const prompt = SECTION_PROMPTS[section_kind] || "Write a concise, brand-voice section.";
    const isEcom = client?.business_type === "ecommerce";
    const m = metrics || {};
    const p = m.prior || {};
    const reportGoal = client?.report_goal || (isEcom ? "ecommerce" : "lead_gen");

    const LANGUAGE_LABELS: Record<string, string> = {
      en: "English", de: "German", fr: "French", es: "Spanish",
      nl: "Dutch", it: "Italian", pt: "Portuguese",
    };
    const language = client?.language || "en";
    const languageLabel = LANGUAGE_LABELS[language] || "English";

    const dataSummary = `Client: ${client?.name} (${isEcom ? "ecommerce" : "lead gen"}).
Reporting goal: ${reportGoal}.
Report language: ${languageLabel}.
Brand notes: ${client?.brand_notes || "n/a"}.
Reporting month: ${period_month}.
Metrics this month vs prior:
- Impressions: ${m.impressions} (prior ${p.impressions})
- Clicks: ${m.clicks} (prior ${p.clicks})
- CTR: ${m.ctr}% (prior ${p.ctr}%)
- CPC: $${m.cpc} (prior $${p.cpc})
- Cost: $${m.cost} (prior $${p.cost})
- Conversions: ${m.conversions} (prior ${p.conversions})
- Conv. rate: ${m.conversion_rate}% (prior ${p.conversion_rate}%)
- CPA: $${m.cpa} (prior $${p.cpa})
${isEcom ? `- Conv. value: $${m.conversion_value} (prior $${p.conversion_value})\n- ROAS: ${m.roas}x (prior ${p.roas}x)` : ""}
Top campaigns: ${JSON.stringify(m.top_campaigns?.slice(0, 3) || [])}.
${notes ? `\nClient context notes (use these to explain changes — e.g. budget increases, paused campaigns, new targets):\n${notes}` : ""}
Avoid generic wrap-up language. Prefer a direct explanation, even if the answer is simply seasonality, auction pressure, or campaign mix.`;

    // Language instruction goes FIRST so the model processes it before any other context
    const system = `OUTPUT LANGUAGE: ${languageLabel.toUpperCase()}. You must write every word of your response in ${languageLabel}. Do not use any other language under any circumstance.

You are a senior performance marketing strategist writing the monthly Google Ads report for LYNCK Studio.
Voice: sharp, premium, first-person ("I" in ${languageLabel}), constructive, never accusatory. Frame issues as opportunities.
Keep copy tight — used in live calls. No headings, no bullet points, no markdown — only the section paragraph(s) requested.`;

    // Also prefix the user message to reinforce the language for models that weight recency
    const userMessage = language !== "en"
      ? `[Write in ${languageLabel} only]\n\n${prompt}\n\nDATA:\n${dataSummary}`
      : `${prompt}\n\nDATA:\n${dataSummary}`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: system },
          { role: "user", content: userMessage },
        ],
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) return new Response(JSON.stringify({ error: "429 rate limit" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (aiResp.status === 402) return new Response(JSON.stringify({ error: "402 payment required" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await aiResp.text();
      console.error("AI gateway error:", aiResp.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const json = await aiResp.json();
    const body = json?.choices?.[0]?.message?.content?.trim();
    return new Response(JSON.stringify({ body }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
