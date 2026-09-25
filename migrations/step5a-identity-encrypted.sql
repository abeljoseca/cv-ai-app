-- ============================================================
-- Step 5a: identity data encrypted, out of `profiles` (Europass spec change 26, 2026-09-25)
-- Ejecutar en Supabase SQL Editor. Idempotente.
--
-- Birth date, address and nationality are stored ONLY as application-encrypted text in
-- public.identidad_cifrada (AES-256-GCM; the key lives only in the server environment).
-- End users cannot read or write the table directly (no RLS policies + no privileges for
-- anon/authenticated): only the server, with the service role, after checking the session.
--
-- The plaintext columns added in step 3a are dropped. They were empty when this was
-- written; the DO block refuses to drop them if any value appeared since.
-- ============================================================

create table if not exists public.identidad_cifrada (
  user_id     uuid primary key references public.profiles(id) on delete cascade,
  datos       text not null,
  actualizado timestamptz not null default now()
);

alter table public.identidad_cifrada enable row level security;
revoke all on public.identidad_cifrada from anon, authenticated;
grant all on public.identidad_cifrada to service_role;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'fecha_nacimiento'
  ) then
    if exists (
      select 1 from public.profiles
      where fecha_nacimiento is not null
         or nullif(trim(coalesce(nacionalidad, '')), '') is not null
         or nullif(trim(coalesce(direccion, '')), '') is not null
    ) then
      raise exception 'profiles has identity values in plaintext: stop and tell the engineer before dropping';
    end if;
    alter table public.profiles drop column fecha_nacimiento;
    alter table public.profiles drop column nacionalidad;
    alter table public.profiles drop column direccion;
  end if;
end $$;

-- Structural guarantee: a Europass CV can never store identity values in plaintext
-- (contenido_json keeps only the on/off switches; values are injected when rendering).
alter table public.cvs drop constraint if exists cvs_europass_sin_identidad_en_claro;
alter table public.cvs add constraint cvs_europass_sin_identidad_en_claro check (
  coalesce(contenido_json->>'schema', '') <> 'europass@2'
  or (
        contenido_json #>> '{informacion_personal,fecha_nacimiento,valor}' is null
    and contenido_json #>> '{informacion_personal,nacionalidad,valor}' is null
    and contenido_json #>> '{informacion_personal,direccion,valor}' is null
  )
);

-- Verification (expected: true, false, false, 0).
select
  has_table_privilege('service_role', 'public.identidad_cifrada', 'INSERT') as service_role_puede_escribir,
  has_table_privilege('authenticated', 'public.identidad_cifrada', 'SELECT') as usuarios_pueden_leer,
  has_table_privilege('anon', 'public.identidad_cifrada', 'SELECT') as anonimos_pueden_leer,
  (select count(*) from information_schema.columns
     where table_schema = 'public' and table_name = 'profiles'
       and column_name in ('fecha_nacimiento', 'nacionalidad', 'direccion')) as columnas_texto_plano_restantes;
