-- Migration: create cvs_inspiracion table for CV Inspiración feature
-- Run this in Supabase SQL Editor

create table if not exists public.cvs_inspiracion (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  template_id   text not null,
  canvas_state  jsonb not null default '{}',
  thumbnail_url text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Index for fast user lookups
create index if not exists cvs_inspiracion_user_id_idx on public.cvs_inspiracion(user_id);

-- RLS: users can only access their own CVs
alter table public.cvs_inspiracion enable row level security;

create policy "Usuarios ven sus propios CVs inspiración"
  on public.cvs_inspiracion for select
  using (auth.uid() = user_id);

create policy "Usuarios crean sus propios CVs inspiración"
  on public.cvs_inspiracion for insert
  with check (auth.uid() = user_id);

create policy "Usuarios actualizan sus propios CVs inspiración"
  on public.cvs_inspiracion for update
  using (auth.uid() = user_id);

create policy "Usuarios eliminan sus propios CVs inspiración"
  on public.cvs_inspiracion for delete
  using (auth.uid() = user_id);

-- Auto-update updated_at
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger cvs_inspiracion_updated_at
  before update on public.cvs_inspiracion
  for each row execute procedure public.handle_updated_at();