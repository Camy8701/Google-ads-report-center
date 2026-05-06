
CREATE TABLE public.client_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  tab_key TEXT NOT NULL,
  tab_label TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  position INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.client_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "open_select_client_notes" ON public.client_notes FOR SELECT USING (true);
CREATE POLICY "open_insert_client_notes" ON public.client_notes FOR INSERT WITH CHECK (true);
CREATE POLICY "open_update_client_notes" ON public.client_notes FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "open_delete_client_notes" ON public.client_notes FOR DELETE USING (true);
