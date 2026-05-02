ALTER TABLE public.report_metrics
ADD COLUMN IF NOT EXISTS device_split JSONB NOT NULL DEFAULT '[]'::jsonb;
