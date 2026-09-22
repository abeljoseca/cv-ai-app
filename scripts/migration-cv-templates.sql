-- Migration: create cv_templates table for CV template gallery
-- Run this in Supabase SQL Editor

create table if not exists public.cv_templates (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  description   text,
  thumbnail_url text,
  canvas_state  jsonb not null default '{}',
  is_published  boolean not null default false,
  created_by    uuid not null references auth.users(id) on delete cascade,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Index for gallery queries (published templates)
create index if not exists cv_templates_published_idx on public.cv_templates(is_published, created_at desc);

-- Grant access to authenticated users (required alongside RLS policies)
grant select, insert, update, delete on public.cv_templates to authenticated;

-- RLS
alter table public.cv_templates enable row level security;

-- Anyone authenticated can read all templates (gallery visible to all users)
create policy "Usuarios autenticados ven plantillas"
  on public.cv_templates for select
  to authenticated
  using (true);

-- Authenticated users can insert (admin-only access controlled at UI level)
create policy "Usuarios autenticados crean plantillas"
  on public.cv_templates for insert
  to authenticated
  with check (auth.uid() = created_by);

-- Only the creator can update
create policy "Creador actualiza su plantilla"
  on public.cv_templates for update
  to authenticated
  using (auth.uid() = created_by);

-- Only the creator can delete
create policy "Creador elimina su plantilla"
  on public.cv_templates for delete
  to authenticated
  using (auth.uid() = created_by);

-- Auto-update updated_at (reuse existing function if already exists)
create or replace function public.handle_cv_templates_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger cv_templates_updated_at
  before update on public.cv_templates
  for each row execute procedure public.handle_cv_templates_updated_at();