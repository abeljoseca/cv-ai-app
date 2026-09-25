-- Adds per-CV visual settings (accent color today; density and photo size later).
-- Kept separate from contenido_json on purpose: contenido_json is rewritten by the
-- AI review step (/api/review-cv), which must never be able to touch visual settings.
--
-- Idempotent: safe to run more than once.

alter table public.cvs
  add column if not exists visual_config jsonb not null default '{}'::jsonb;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'cvs_visual_config_is_object'
  ) then
    alter table public.cvs
      add constraint cvs_visual_config_is_object
      check (jsonb_typeof(visual_config) = 'object');
  end if;
end $$;
