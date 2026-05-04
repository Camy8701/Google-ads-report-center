import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GOOGLE_ADS_API_VERSION = "v22";
const SEARCH_TERM_LIMIT = 100;

type Json = Record<string, unknown>;

type ServiceAccountJson = {
  client_email: string;
  private_key: string;
  token_uri?: string;
};

type SearchTermMetric = {
  term: string;
  clicks: number;
  impressions: number;
  conversions: number;
  cost: number;
  conversion_value: number;
  avg_cpc: number;
  source: "search_term_view" | "campaign_search_term_view";
};

type DeviceMetric = {
  label: string;
  clicks: number;
  impressions: number;
  conversions: number;
  cost: number;
  conversion_value: number;
};

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  { auth: { persistSession: false } },
);

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { ad_account_id, period_month } = await req.json();
    if (!ad_account_id || !period_month) {
      throw new Error("ad_account_id and period_month are required");
    }

    const { data: adAccount, error: adAccountError } = await supabaseAdmin
      .from("ad_accounts")
      .select("id, client_id, label, google_ads_customer_id, google_ads_manager_id")
      .eq("id", ad_account_id)
      .single();
    if (adAccountError || !adAccount) throw new Error(adAccountError?.message || "Ad account not found");

    const [{ data: client, error: clientError }, { data: settings, error: settingsError }] = await Promise.all([
      supabaseAdmin.from("clients").select("id, name").eq("id", adAccount.client_id).single(),
      supabaseAdmin.from("app_settings").select("agency_name, google_ads_developer_token, google_ads_login_customer_id").eq("key", "global").single(),
    ]);
    if (clientError || !client) throw new Error(clientError?.message || "Client not found");
    if (settingsError || !settings) throw new Error(settingsError?.message || "Global app settings not found");

    const developerToken = sanitizeToken(settings.google_ads_developer_token) || sanitizeToken(Deno.env.get("GOOGLE_ADS_DEVELOPER_TOKEN"));
    const loginCustomerId = sanitizeId(adAccount.google_ads_manager_id || settings.google_ads_login_customer_id || Deno.env.get("GOOGLE_ADS_LOGIN_CUSTOMER_ID"));
    const customerId = sanitizeId(adAccount.google_ads_customer_id);

    if (!developerToken) throw new Error("google_ads_developer_token is missing in app settings");
    if (!customerId) throw new Error("google_ads_customer_id is missing on the selected ad account");

    const serviceAccount = parseServiceAccountJson(Deno.env.get("GOOGLE_ADS_SERVICE_ACCOUNT_JSON"));
    if (!serviceAccount) {
      throw new Error("GOOGLE_ADS_SERVICE_ACCOUNT_JSON secret is not configured");
    }

    await setAccountSyncStatus(ad_account_id, "syncing");

    const accessToken = await createServiceAccountAccessToken(serviceAccount);
    const { startDate, endDate } = getMonthRange(period_month);

    const [searchRows, pmaxRows, deviceRows] = await Promise.all([
      googleAdsSearchStream({
        accessToken,
        developerToken,
        loginCustomerId,
        customerId,
        query: buildSearchShoppingSearchTermQuery(startDate, endDate),
      }),
      googleAdsSearchStream({
        accessToken,
        developerToken,
        loginCustomerId,
        customerId,
        query: buildPerformanceMaxSearchTermQuery(startDate, endDate),
      }),
      googleAdsSearchStream({
        accessToken,
        developerToken,
        loginCustomerId,
        customerId,
        query: buildDeviceSplitQuery(startDate, endDate),
      }),
    ]);

    const topSearchTerms = mergeSearchTerms([
      ...normalizeSearchTermRows(searchRows, "search_term_view"),
      ...normalizeSearchTermRows(pmaxRows, "campaign_search_term_view"),
    ]).slice(0, 25);
    const deviceSplit = mergeDeviceRows(normalizeDeviceRows(deviceRows)).slice(0, 10);

    const report = await ensureReport({
      adAccountId: adAccount.id,
      clientId: client.id,
      clientName: client.name,
      periodMonth: period_month,
    });

    const { error: metricsError } = await supabaseAdmin.from("report_metrics").upsert({
      report_id: report.id,
      device_split: deviceSplit,
      top_search_terms: topSearchTerms,
      top_keywords: topSearchTerms,
    }, { onConflict: "report_id" });
    if (metricsError) throw new Error(metricsError.message);

    await setAccountSyncStatus(ad_account_id, "connected");

    return jsonResponse({
      status: "ok",
      report_id: report.id,
      ad_account_id,
      period_month,
      synced_search_terms: topSearchTerms.length,
      device_split: deviceSplit,
      top_search_terms: topSearchTerms.slice(0, 10),
      note: "Unified search terms were pulled from search_term_view (Search/Shopping) and campaign_search_term_view (Performance Max), then merged at account level.",
    });
  } catch (e) {
    console.error(e);
    const message = e instanceof Error ? e.message : "Unknown";
    try {
      const body = await req.clone().json();
      if (body?.ad_account_id) {
        await setAccountSyncStatus(body.ad_account_id, "error");
      }
    } catch {
      // ignore
    }
    return jsonResponse({ error: message }, 500);
  }
});

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function ensureReport({
  adAccountId,
  clientId,
  clientName,
  periodMonth,
}: {
  adAccountId: string;
  clientId: string;
  clientName: string;
  periodMonth: string;
}) {
  const { data: existing, error: existingError } = await supabaseAdmin
    .from("reports")
    .select("id")
    .eq("client_id", clientId)
    .eq("period_month", periodMonth)
    .maybeSingle();
  if (existingError) throw new Error(existingError.message);
  if (existing) return existing;

  const title = `${clientName} — ${new Date(periodMonth).toLocaleDateString("en-US", { month: "long", year: "numeric" })}`;
  const { data: created, error: createError } = await supabaseAdmin
    .from("reports")
    .insert({
      client_id: clientId,
      ad_account_id: adAccountId,
      title,
      period_month: periodMonth,
      status: "draft",
      headline: "Live Google Ads search-term sync imported.",
      overall_status: "info",
    })
    .select("id")
    .single();
  if (createError || !created) throw new Error(createError?.message || "Could not create report");
  return created;
}

async function setAccountSyncStatus(adAccountId: string, status: "syncing" | "connected" | "error") {
  await supabaseAdmin
    .from("ad_accounts")
    .update({
      data_source_status: status,
      last_sync_at: status === "connected" ? new Date().toISOString() : undefined,
    })
    .eq("id", adAccountId);
}

function buildSearchShoppingSearchTermQuery(startDate: string, endDate: string) {
  return `
    SELECT
      search_term_view.search_term,
      metrics.impressions,
      metrics.clicks,
      metrics.conversions,
      metrics.conversions_value,
      metrics.cost_micros
    FROM search_term_view
    WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
      AND campaign.advertising_channel_type IN ('SEARCH', 'SHOPPING')
      AND metrics.impressions > 0
    ORDER BY metrics.clicks DESC
    LIMIT ${SEARCH_TERM_LIMIT}
  `.trim();
}

function buildPerformanceMaxSearchTermQuery(startDate: string, endDate: string) {
  return `
    SELECT
      campaign_search_term_view.search_term,
      metrics.impressions,
      metrics.clicks,
      metrics.conversions,
      metrics.conversions_value,
      metrics.cost_micros
    FROM campaign_search_term_view
    WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
      AND campaign.advertising_channel_type = 'PERFORMANCE_MAX'
      AND metrics.impressions > 0
    ORDER BY metrics.clicks DESC
    LIMIT ${SEARCH_TERM_LIMIT}
  `.trim();
}

function buildDeviceSplitQuery(startDate: string, endDate: string) {
  return `
    SELECT
      segments.device,
      metrics.impressions,
      metrics.clicks,
      metrics.conversions,
      metrics.conversions_value,
      metrics.cost_micros
    FROM campaign
    WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
      AND metrics.impressions > 0
    ORDER BY metrics.clicks DESC
  `.trim();
}

async function googleAdsSearchStream({
  accessToken,
  developerToken,
  loginCustomerId,
  customerId,
  query,
}: {
  accessToken: string;
  developerToken: string;
  loginCustomerId?: string | null;
  customerId: string;
  query: string;
}) {
  const res = await fetch(`https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}/customers/${customerId}/googleAds:searchStream`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "developer-token": developerToken,
      ...(loginCustomerId ? { "login-customer-id": loginCustomerId } : {}),
    },
    body: JSON.stringify({ query }),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Google Ads query failed: ${res.status} ${text}`);
  }

  const payload = JSON.parse(text) as Array<{ results?: Json[] }>;
  return payload.flatMap((chunk) => chunk.results || []);
}

function normalizeSearchTermRows(rows: Json[], source: SearchTermMetric["source"]): SearchTermMetric[] {
  return rows.map((row) => {
    const searchTerm =
      source === "campaign_search_term_view"
        ? getString(row, ["campaignSearchTermView", "searchTerm"])
        : getString(row, ["searchTermView", "searchTerm"]);

    const clicks = getNumber(row, ["metrics", "clicks"]);
    const impressions = getNumber(row, ["metrics", "impressions"]);
    const conversions = getNumber(row, ["metrics", "conversions"]);
    const cost = getNumber(row, ["metrics", "costMicros"]) / 1_000_000;
    const conversionValue = getNumber(row, ["metrics", "conversionsValue"]);

    return {
      term: searchTerm,
      clicks,
      impressions,
      conversions,
      cost,
      conversion_value: conversionValue,
      avg_cpc: clicks > 0 ? cost / clicks : 0,
      source,
    };
  }).filter((row) => row.term && row.clicks > 0);
}

function mergeSearchTerms(rows: SearchTermMetric[]) {
  const grouped = new Map<string, SearchTermMetric>();

  for (const row of rows) {
    const key = row.term.trim().toLowerCase();
    if (!key) continue;

    const existing = grouped.get(key);
    if (!existing) {
      grouped.set(key, { ...row, term: row.term.trim() });
      continue;
    }

    existing.clicks += row.clicks;
    existing.impressions += row.impressions;
    existing.conversions += row.conversions;
    existing.cost += row.cost;
    existing.conversion_value += row.conversion_value;
    existing.avg_cpc = existing.clicks > 0 ? existing.cost / existing.clicks : 0;
  }

  return Array.from(grouped.values())
    .sort((a, b) => b.clicks - a.clicks || b.conversions - a.conversions || b.impressions - a.impressions);
}

function normalizeDeviceRows(rows: Json[]): DeviceMetric[] {
  return rows.map((row) => ({
    label: normalizeDeviceLabel(getString(row, ["segments", "device"])),
    clicks: getNumber(row, ["metrics", "clicks"]),
    impressions: getNumber(row, ["metrics", "impressions"]),
    conversions: getNumber(row, ["metrics", "conversions"]),
    cost: getNumber(row, ["metrics", "costMicros"]) / 1_000_000,
    conversion_value: getNumber(row, ["metrics", "conversionsValue"]),
  })).filter((row) => row.label && row.clicks > 0);
}

function mergeDeviceRows(rows: DeviceMetric[]) {
  const grouped = new Map<string, DeviceMetric>();

  for (const row of rows) {
    const key = row.label.toLowerCase();
    const existing = grouped.get(key);
    if (!existing) {
      grouped.set(key, { ...row });
      continue;
    }

    existing.clicks += row.clicks;
    existing.impressions += row.impressions;
    existing.conversions += row.conversions;
    existing.cost += row.cost;
    existing.conversion_value += row.conversion_value;
  }

  return Array.from(grouped.values()).sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions);
}

function getMonthRange(periodMonth: string) {
  const start = new Date(periodMonth);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);
  end.setDate(0);

  return {
    startDate: toIsoDate(start),
    endDate: toIsoDate(end),
  };
}

function toIsoDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function sanitizeId(value?: string | null) {
  return (value || "").replace(/\D/g, "");
}

function sanitizeToken(value?: string | null) {
  return (value || "").trim();
}

function normalizeDeviceLabel(value: string) {
  const raw = (value || "").trim().toUpperCase();
  if (!raw) return "";
  if (raw === "DESKTOP") return "Desktop";
  if (raw === "MOBILE") return "Mobile";
  if (raw === "TABLET") return "Tablet";
  if (raw === "CONNECTED_TV") return "Connected TV";
  if (raw === "OTHER") return "Other";
  return raw
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function parseServiceAccountJson(raw?: string | null): ServiceAccountJson | null {
  if (!raw) return null;
  const parsed = JSON.parse(raw) as ServiceAccountJson;
  if (!parsed.client_email || !parsed.private_key) return null;
  return parsed;
}

async function createServiceAccountAccessToken(serviceAccount: ServiceAccountJson) {
  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAt = issuedAt + 3600;

  const assertion = await createJwtAssertion(serviceAccount, {
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/adwords",
    aud: serviceAccount.token_uri || "https://oauth2.googleapis.com/token",
    exp: expiresAt,
    iat: issuedAt,
  });

  const res = await fetch(serviceAccount.token_uri || "https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  const json = await res.json();
  if (!res.ok || !json.access_token) {
    throw new Error(`Could not obtain Google access token: ${JSON.stringify(json)}`);
  }
  return json.access_token as string;
}

async function createJwtAssertion(serviceAccount: ServiceAccountJson, payload: Record<string, unknown>) {
  const header = { alg: "RS256", typ: "JWT" };
  const unsigned = `${base64UrlEncode(JSON.stringify(header))}.${base64UrlEncode(JSON.stringify(payload))}`;

  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(serviceAccount.private_key),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(unsigned),
  );

  return `${unsigned}.${base64UrlEncode(new Uint8Array(signature))}`;
}

function pemToArrayBuffer(pem: string) {
  const base64 = pem
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s/g, "");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

function base64UrlEncode(input: string | Uint8Array) {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : input;
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function getString(obj: Json, path: string[]) {
  const value = getNested(obj, path);
  return typeof value === "string" ? value : "";
}

function getNumber(obj: Json, path: string[]) {
  const value = getNested(obj, path);
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function getNested(obj: Json, path: string[]) {
  return path.reduce<unknown>((acc, key) => {
    if (!acc || typeof acc !== "object") return undefined;
    return (acc as Record<string, unknown>)[key];
  }, obj);
}
