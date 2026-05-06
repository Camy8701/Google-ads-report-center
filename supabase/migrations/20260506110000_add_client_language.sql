-- Add language field to clients for report language selection
alter table public.clients
  add column if not exists language text not null default 'en';

comment on column public.clients.language is 'ISO 639-1 language code for AI-generated report content (en, de, fr, es, nl, it, pt)';
