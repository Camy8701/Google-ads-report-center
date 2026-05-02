
ALTER TABLE public.report_metrics
  ADD COLUMN IF NOT EXISTS device_split jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.report_metrics
  ADD COLUMN IF NOT EXISTS top_search_terms jsonb NOT NULL DEFAULT '[]'::jsonb;
