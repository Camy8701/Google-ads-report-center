
-- Enums
CREATE TYPE public.business_type AS ENUM ('ecommerce', 'lead_gen');
CREATE TYPE public.report_status AS ENUM ('draft', 'in_review', 'approved', 'exported');
CREATE TYPE public.reporting_status AS ENUM ('on_track', 'due_soon', 'overdue', 'paused');
CREATE TYPE public.urgency_level AS ENUM ('urgent', 'medium', 'good', 'info');
CREATE TYPE public.data_source_status AS ENUM ('mock', 'connected', 'syncing', 'error', 'not_configured');
CREATE TYPE public.section_kind AS ENUM ('executive_summary', 'best_performing', 'what_changed', 'opportunities', 'decision_page', 'appendix');

-- Updated-at helper
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- clients
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  business_type public.business_type NOT NULL DEFAULT 'ecommerce',
  industry TEXT,
  website TEXT,
  brand_notes TEXT,
  reporting_status public.reporting_status NOT NULL DEFAULT 'on_track',
  next_report_due DATE,
  last_report_month DATE,
  archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_clients_updated BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- client_contacts
CREATE TABLE public.client_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT,
  is_main BOOLEAN NOT NULL DEFAULT false,
  is_report_recipient BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_client_contacts_client ON public.client_contacts(client_id);

-- ad_accounts
CREATE TABLE public.ad_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  label TEXT,
  google_ads_customer_id TEXT,
  google_ads_manager_id TEXT,
  currency TEXT NOT NULL DEFAULT 'USD',
  data_source_status public.data_source_status NOT NULL DEFAULT 'mock',
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_ad_accounts_client ON public.ad_accounts(client_id);

-- reports
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  ad_account_id UUID REFERENCES public.ad_accounts(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  period_month DATE NOT NULL, -- first day of month
  status public.report_status NOT NULL DEFAULT 'draft',
  headline TEXT,
  overall_status public.urgency_level NOT NULL DEFAULT 'good',
  approved_at TIMESTAMPTZ,
  exported_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (client_id, period_month)
);
CREATE INDEX idx_reports_client ON public.reports(client_id);
CREATE TRIGGER trg_reports_updated BEFORE UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- report_sections
CREATE TABLE public.report_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  kind public.section_kind NOT NULL,
  position INT NOT NULL DEFAULT 0,
  title TEXT,
  body TEXT, -- markdown / plain text, manually editable
  data JSONB NOT NULL DEFAULT '{}'::jsonb, -- structured payload (key takeaways list, etc.)
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_report_sections_report ON public.report_sections(report_id);
CREATE TRIGGER trg_report_sections_updated BEFORE UPDATE ON public.report_sections
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- report_metrics (current month + prior month comparison)
CREATE TABLE public.report_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE UNIQUE,
  impressions BIGINT NOT NULL DEFAULT 0,
  clicks BIGINT NOT NULL DEFAULT 0,
  ctr NUMERIC(8,4) NOT NULL DEFAULT 0,
  cpc NUMERIC(12,2) NOT NULL DEFAULT 0,
  cost NUMERIC(14,2) NOT NULL DEFAULT 0,
  conversions NUMERIC(12,2) NOT NULL DEFAULT 0,
  conversion_rate NUMERIC(8,4) NOT NULL DEFAULT 0,
  cpa NUMERIC(12,2) NOT NULL DEFAULT 0,
  conversion_value NUMERIC(14,2) NOT NULL DEFAULT 0,
  roas NUMERIC(10,2) NOT NULL DEFAULT 0,
  prior JSONB NOT NULL DEFAULT '{}'::jsonb, -- previous month snapshot for delta calc
  top_campaigns JSONB NOT NULL DEFAULT '[]'::jsonb,
  top_keywords JSONB NOT NULL DEFAULT '[]'::jsonb,
  top_products JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- report_recommendations (decision page)
CREATE TABLE public.report_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  position INT NOT NULL DEFAULT 0,
  title TEXT NOT NULL,
  why TEXT NOT NULL,
  expected_impact TEXT NOT NULL,
  urgency public.urgency_level NOT NULL DEFAULT 'medium',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_report_recs_report ON public.report_recommendations(report_id);

-- report_files (PDF archive)
CREATE TABLE public.report_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT NOT NULL DEFAULT 'application/pdf',
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_report_files_report ON public.report_files(report_id);

-- app_settings (singleton, key='global')
CREATE TABLE public.app_settings (
  key TEXT PRIMARY KEY,
  agency_name TEXT NOT NULL DEFAULT 'LYNCK Studio',
  agency_email TEXT,
  brand_accent TEXT NOT NULL DEFAULT '#FF6B1A',
  report_intro TEXT,
  report_signoff TEXT,
  google_ads_developer_token TEXT,
  google_ads_login_customer_id TEXT,
  google_ads_oauth_client_id TEXT,
  google_ads_status public.data_source_status NOT NULL DEFAULT 'not_configured',
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_app_settings_updated BEFORE UPDATE ON public.app_settings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Enable RLS on everything
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Open policies (no auth yet) - swap to auth.uid() based later
DO $$
DECLARE t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'clients','client_contacts','ad_accounts','reports','report_sections',
    'report_metrics','report_recommendations','report_files','app_settings'
  ]) LOOP
    EXECUTE format('CREATE POLICY "open_select_%I" ON public.%I FOR SELECT USING (true);', t, t);
    EXECUTE format('CREATE POLICY "open_insert_%I" ON public.%I FOR INSERT WITH CHECK (true);', t, t);
    EXECUTE format('CREATE POLICY "open_update_%I" ON public.%I FOR UPDATE USING (true) WITH CHECK (true);', t, t);
    EXECUTE format('CREATE POLICY "open_delete_%I" ON public.%I FOR DELETE USING (true);', t, t);
  END LOOP;
END $$;

-- Storage bucket for archived PDFs (private)
INSERT INTO storage.buckets (id, name, public) VALUES ('report-pdfs', 'report-pdfs', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "report_pdfs_select" ON storage.objects FOR SELECT USING (bucket_id = 'report-pdfs');
CREATE POLICY "report_pdfs_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'report-pdfs');
CREATE POLICY "report_pdfs_update" ON storage.objects FOR UPDATE USING (bucket_id = 'report-pdfs');
CREATE POLICY "report_pdfs_delete" ON storage.objects FOR DELETE USING (bucket_id = 'report-pdfs');

-- Singleton settings row
INSERT INTO public.app_settings (key, agency_name, agency_email, report_intro, report_signoff)
VALUES (
  'global',
  'LYNCK Studio',
  'hello@lynck.studio',
  'I have prepared this report to walk you through last month''s performance and the opportunities I see for the month ahead.',
  'Always optimizing — LYNCK Studio'
);
