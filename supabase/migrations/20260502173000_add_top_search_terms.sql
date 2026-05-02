ALTER TABLE public.report_metrics
ADD COLUMN IF NOT EXISTS top_search_terms JSONB NOT NULL DEFAULT '[]'::jsonb;

UPDATE public.report_metrics
SET top_search_terms = top_keywords
WHERE COALESCE(jsonb_array_length(top_search_terms), 0) = 0
  AND COALESCE(jsonb_array_length(top_keywords), 0) > 0;
