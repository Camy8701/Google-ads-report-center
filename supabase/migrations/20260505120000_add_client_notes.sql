create table public.client_notes (
  id uuid not null default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  tab_key text not null,
  tab_label text not null,
  content text not null default '',
  position integer not null default 0,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  primary key (id),
  unique (client_id, tab_key)
);

alter table public.client_notes enable row level security;

create policy "authenticated_all" on public.client_notes
  for all to authenticated using (true) with check (true);
