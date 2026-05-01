// Sync Google Ads metrics for a single ad_account into report_metrics.
// Auth: service account JWT -> Google OAuth token -> Google Ads API REST search.
//
// Required env (Lovable Cloud secrets):
//   GOOGLE_ADS_DEVELOPER_TOKEN
//   GOOGLE_ADS_LOGIN_CUSTOMER_ID  (MCC, digits only)
//   GOOGLE_ADS_SERVICE_ACCOUNT_JSON (full JSON key)
//
// Body:
//   { ad_account_id: uuid, period_month: "YYYY-MM-01", report_id?: uuid }

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GOOGLE_ADS_API_VERSION = "v21";

function b64url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function strToBytes(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}

function pemToDer(pem: string): Uint8Array {
  const body = pem
    .replace(/-----BEGIN [^-]+-----/g, "")
    .replace(/-----END [^-]+-----/g, "")
    .replace(/\s+/g, "");
  const bin = atob(body);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function getAccessToken(serviceAccount: any): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claim = {
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/adwords",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };
  const headerB64 = b64url(strToBytes(JSON.stringify(header)));
  const claimB64 = b64url(strToBytes(JSON.stringify(claim)));
  const signingInput = `${headerB64}.${claimB64}`;

  const keyDer = pemToDer(serviceAccount.private_key);
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    keyDer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = new Uint8Array(
    await crypto.subtle.sign("RSASSA-PKCS1-v1_5", cryptoKey, strToBytes(signingInput)),
  );
  const jwt = `${signingInput}.${b64url(signature)}`;

  const tokRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  const tokJson = await tokRes.json();
  if (!tokRes.ok) {
    throw new Error(`OAuth token error [${tokRes.status}]: ${JSON.stringify(tokJson)}`);
  }
  return tokJson.access_token as string;
}

function periodRange(periodMonth: string): { start: string; end: string } {
  // periodMonth is "YYYY-MM-01"
  const d = new Date(periodMonth + "T00:00:00Z");
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth();
  const start = new Date(Date.UTC(y, m, 1));
  const end = new Date(Date.UTC(y, m + 1, 0)); // last day of month
  const fmt = (x: Date) => x.toISOString().slice(0, 10);
  return { start: fmt(start), end: fmt(end) };
}

async function searchAds(
  customerId: string,
  loginCustomerId: string,
  developerToken: string,
  accessToken: string,
  query: string,
): Promise<any[]> {
  const url = `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}/customers/${customerId}/googleAds:searchStream`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "developer-token": developerToken,
      "login-customer-id": loginCustomerId,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Google Ads API [${res.status}]: ${text.slice(0, 800)}`);
  }
  // searchStream returns an array of response chunks
  const chunks = JSON.parse(text);
  const results: any[] = [];
  for (const chunk of chunks) {
    if (Array.isArray(chunk.results)) results.push(...chunk.results);
  }
  return results;
}

const microsToUnits = (micros: string | number | undefined): number => {
  if (!micros) return 0;
  return Number(micros) / 1_000_000;
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const developerToken = Deno.env.get("GOOGLE_ADS_DEVELOPER_TOKEN");
    const loginCustomerId = Deno.env.get("GOOGLE_ADS_LOGIN_CUSTOMER_ID");
    const saJsonRaw = Deno.env.get("GOOGLE_ADS_SERVICE_ACCOUNT_JSON");
    if (!developerToken) throw new Error("GOOGLE_ADS_DEVELOPER_TOKEN is not configured");
    if (!loginCustomerId) throw new Error("GOOGLE_ADS_LOGIN_CUSTOMER_ID is not configured");
    if (!saJsonRaw) throw new Error("GOOGLE_ADS_SERVICE_ACCOUNT_JSON is not configured");

    let serviceAccount: any;
    try { serviceAccount = JSON.parse(saJsonRaw); }
    catch { throw new Error("GOOGLE_ADS_SERVICE_ACCOUNT_JSON is not valid JSON"); }

    const { ad_account_id, period_month, report_id } = await req.json();
    if (!ad_account_id || !period_month) {
      return new Response(JSON.stringify({ error: "ad_account_id and period_month are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: account, error: accErr } = await supabase
      .from("ad_accounts").select("*").eq("id", ad_account_id).single();
    if (accErr || !account) throw new Error("Ad account not found");
    const customerId = (account.google_ads_customer_id || "").replace(/\D/g, "");
    if (!customerId) throw new Error("This ad account has no google_ads_customer_id set");

    const { start, end } = periodRange(period_month);
    const dateClause = `segments.date BETWEEN '${start}' AND '${end}'`;

    const accessToken = await getAccessToken(serviceAccount);

    // 1) Account-level totals + currency
    const totalsRows = await searchAds(customerId, loginCustomerId, developerToken, accessToken, `
      SELECT customer.currency_code,
             metrics.impressions, metrics.clicks, metrics.cost_micros,
             metrics.conversions, metrics.conversions_value
      FROM customer
      WHERE ${dateClause}
    `);
    let impressions = 0, clicks = 0, cost = 0, conversions = 0, conv_value = 0;
    let currency = account.currency || "USD";
    for (const row of totalsRows) {
      currency = row.customer?.currencyCode || currency;
      impressions += Number(row.metrics?.impressions || 0);
      clicks += Number(row.metrics?.clicks || 0);
      cost += microsToUnits(row.metrics?.costMicros);
      conversions += Number(row.metrics?.conversions || 0);
      conv_value += Number(row.metrics?.conversionsValue || 0);
    }
    const ctr = impressions > 0 ? clicks / impressions : 0;
    const cpc = clicks > 0 ? cost / clicks : 0;
    const conv_rate = clicks > 0 ? conversions / clicks : 0;
    const cpa = conversions > 0 ? cost / conversions : 0;
    const roas = cost > 0 ? conv_value / cost : 0;

    // 2) Prior month totals for delta calculations
    const prevDate = new Date(period_month + "T00:00:00Z");
    prevDate.setUTCMonth(prevDate.getUTCMonth() - 1);
    const prevPeriod = prevDate.toISOString().slice(0, 10);
    const prev = periodRange(prevPeriod);
    const priorRows = await searchAds(customerId, loginCustomerId, developerToken, accessToken, `
      SELECT metrics.impressions, metrics.clicks, metrics.cost_micros,
             metrics.conversions, metrics.conversions_value
      FROM customer
      WHERE segments.date BETWEEN '${prev.start}' AND '${prev.end}'
    `);
    let pImp = 0, pClk = 0, pCost = 0, pConv = 0, pVal = 0;
    for (const row of priorRows) {
      pImp += Number(row.metrics?.impressions || 0);
      pClk += Number(row.metrics?.clicks || 0);
      pCost += microsToUnits(row.metrics?.costMicros);
      pConv += Number(row.metrics?.conversions || 0);
      pVal += Number(row.metrics?.conversionsValue || 0);
    }
    const prior = {
      impressions: pImp, clicks: pClk, cost: pCost,
      conversions: pConv, conversion_value: pVal,
      ctr: pImp > 0 ? pClk / pImp : 0,
      cpc: pClk > 0 ? pCost / pClk : 0,
      conversion_rate: pClk > 0 ? pConv / pClk : 0,
      cpa: pConv > 0 ? pCost / pConv : 0,
      roas: pCost > 0 ? pVal / pCost : 0,
    };

    // 3) Top campaigns
    const campaignRows = await searchAds(customerId, loginCustomerId, developerToken, accessToken, `
      SELECT campaign.id, campaign.name,
             metrics.impressions, metrics.clicks, metrics.cost_micros,
             metrics.conversions, metrics.conversions_value
      FROM campaign
      WHERE ${dateClause}
      ORDER BY metrics.cost_micros DESC
      LIMIT 10
    `);
    const top_campaigns = campaignRows.map((r) => {
      const c = microsToUnits(r.metrics?.costMicros);
      const conv = Number(r.metrics?.conversions || 0);
      const val = Number(r.metrics?.conversionsValue || 0);
      const clk = Number(r.metrics?.clicks || 0);
      const imp = Number(r.metrics?.impressions || 0);
      return {
        id: r.campaign?.id, name: r.campaign?.name,
        impressions: imp, clicks: clk, cost: c,
        conversions: conv, conversion_value: val,
        ctr: imp > 0 ? clk / imp : 0,
        cpc: clk > 0 ? c / clk : 0,
        cpa: conv > 0 ? c / conv : 0,
        roas: c > 0 ? val / c : 0,
      };
    });

    // 4) Top keywords
    const keywordRows = await searchAds(customerId, loginCustomerId, developerToken, accessToken, `
      SELECT ad_group_criterion.keyword.text,
             metrics.impressions, metrics.clicks, metrics.cost_micros,
             metrics.conversions, metrics.conversions_value
      FROM keyword_view
      WHERE ${dateClause}
      ORDER BY metrics.cost_micros DESC
      LIMIT 10
    `).catch(() => [] as any[]);
    const top_keywords = keywordRows.map((r) => ({
      text: r.adGroupCriterion?.keyword?.text,
      impressions: Number(r.metrics?.impressions || 0),
      clicks: Number(r.metrics?.clicks || 0),
      cost: microsToUnits(r.metrics?.costMicros),
      conversions: Number(r.metrics?.conversions || 0),
      conversion_value: Number(r.metrics?.conversionsValue || 0),
    }));

    // 5) Top products (only meaningful for shopping accounts; ignore errors)
    const productRows = await searchAds(customerId, loginCustomerId, developerToken, accessToken, `
      SELECT segments.product_title, segments.product_item_id,
             metrics.impressions, metrics.clicks, metrics.cost_micros,
             metrics.conversions, metrics.conversions_value
      FROM shopping_performance_view
      WHERE ${dateClause}
      ORDER BY metrics.conversions_value DESC
      LIMIT 10
    `).catch(() => [] as any[]);
    const top_products = productRows.map((r) => ({
      id: r.segments?.productItemId,
      title: r.segments?.productTitle,
      impressions: Number(r.metrics?.impressions || 0),
      clicks: Number(r.metrics?.clicks || 0),
      cost: microsToUnits(r.metrics?.costMicros),
      conversions: Number(r.metrics?.conversions || 0),
      conversion_value: Number(r.metrics?.conversionsValue || 0),
    }));

    // 6) Persist
    if (currency && currency !== account.currency) {
      await supabase.from("ad_accounts")
        .update({ currency, last_sync_at: new Date().toISOString(), data_source_status: "live" })
        .eq("id", ad_account_id);
    } else {
      await supabase.from("ad_accounts")
        .update({ last_sync_at: new Date().toISOString(), data_source_status: "live" })
        .eq("id", ad_account_id);
    }

    let reportIdToUse = report_id as string | undefined;
    if (reportIdToUse) {
      const metricsPayload = {
        report_id: reportIdToUse,
        impressions, clicks, ctr, cpc, cost,
        conversions, conversion_rate: conv_rate, cpa,
        conversion_value: conv_value, roas,
        prior, top_campaigns, top_keywords, top_products,
      };
      const { data: existing } = await supabase
        .from("report_metrics").select("id").eq("report_id", reportIdToUse).maybeSingle();
      if (existing?.id) {
        await supabase.from("report_metrics").update(metricsPayload).eq("id", existing.id);
      } else {
        await supabase.from("report_metrics").insert([metricsPayload]);
      }
    }

    return new Response(JSON.stringify({
      status: "ok",
      currency,
      totals: { impressions, clicks, cost, conversions, conversion_value: conv_value, ctr, cpc, conversion_rate: conv_rate, cpa, roas },
      counts: { campaigns: top_campaigns.length, keywords: top_keywords.length, products: top_products.length },
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("sync-google-ads error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
