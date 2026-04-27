// Placeholder for future Google Ads API sync. Architecture only — no live calls yet.
// Future flow:
// 1. Read app_settings for developer_token + login_customer_id
// 2. Use OAuth refresh token (per ad_account, stored as a secret) to obtain access token
// 3. Query Google Ads API for the requested period
// 4. Normalize into report_metrics shape and insert/update
// 5. Update ad_accounts.last_sync_at and data_source_status

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { ad_account_id, period_month } = await req.json();
    return new Response(
      JSON.stringify({
        status: "not_implemented",
        ad_account_id,
        period_month,
        message: "Google Ads sync scaffold ready. Wire live API + OAuth refresh token in a later iteration.",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
