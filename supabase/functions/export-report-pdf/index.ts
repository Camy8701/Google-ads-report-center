// Placeholder edge function for future server-side PDF rendering + storage upload.
// In v1, PDF export uses browser print-to-PDF. This scaffolds the future architecture:
// 1. Receive report_id
// 2. Fetch report + metrics + sections + recommendations from DB
// 3. Render branded HTML + convert to PDF (via headless renderer)
// 4. Upload to `report-pdfs` storage bucket
// 5. Insert into `report_files` with storage_path
// For now, it returns a stub response so the architecture is in place.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { report_id } = await req.json();
    // TODO: implement headless render + storage upload in a future iteration.
    return new Response(
      JSON.stringify({
        status: "not_implemented",
        report_id,
        message: "Server-side PDF rendering scaffold ready. Use browser Print/PDF export in v1.",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
