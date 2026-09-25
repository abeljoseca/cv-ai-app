-- ============================================================
-- Paso 3 · Fase A — Campos del perfil para estilos estandarizados (Europass v2)
-- Ejecutar en Supabase SQL Editor ANTES de desplegar el código del paso 3.
-- Compatible con el código actual: solo agrega columnas y limpia datos. Idempotente.
-- Fase B (step3b-date-format-checks.sql) se ejecuta DESPUÉS del despliegue.
-- ============================================================

-- ── 1. Perfil: datos personales y secciones adicionales ──────────────────────
alter table public.profiles
  add column if not exists fecha_nacimiento  date,
  add column if not exists nacionalidad      text,
  add column if not exists direccion         text,
  add column if not exists orcid_url         text,
  add column if not exists researchgate_url  text,
  add column if not exists permiso_conducir  text[] not null default '{}',
  add column if not exists digcomp           jsonb,
  add column if not exists publicaciones     text[] not null default '{}',
  add column if not exists ponencias         text[] not null default '{}',
  add column if not exists voluntariado      text[] not null default '{}',
  add column if not exists premios_becas     text[] not null default '{}',
  add column if not exists afiliaciones      text[] not null default '{}',
  add column if not exists anexos            text[] not null default '{}';

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_permiso_conducir_valido') then
    alter table public.profiles add constraint profiles_permiso_conducir_valido
      check (permiso_conducir <@ array['AM','A1','A2','A','B','BE','C1','C1E','C','CE','D1','D1E','D','DE']::text[]);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'profiles_digcomp_objeto') then
    alter table public.profiles add constraint profiles_digcomp_objeto
      check (digcomp is null or jsonb_typeof(digcomp) = 'object');
  end if;
end $$;

-- ── 2. Experiencia y educación: lugar, sector, nivel ISCED, materias ────────
alter table public.experiencia
  add column if not exists ciudad      text,
  add column if not exists pais        text,
  add column if not exists sector_nace text;

alter table public.educacion
  add column if not exists ciudad      text,
  add column if not exists pais        text,
  add column if not exists nivel_isced smallint,
  add column if not exists materias    text;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'educacion_nivel_isced_rango') then
    alter table public.educacion add constraint educacion_nivel_isced_rango
      check (nivel_isced is null or nivel_isced between 0 and 8);
  end if;
end $$;

-- ── 3. Idiomas: escala MCER (A1–C2 / Nativo), desglose y certificación ──────
-- `nivel` (texto libre heredado) se conserva. `nivel_cefr` es la fuente para los CVs.
alter table public.idiomas
  add column if not exists nivel_cefr    text,
  add column if not exists niveles_cefr  jsonb,
  add column if not exists certificacion text;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'idiomas_nivel_cefr_valido') then
    alter table public.idiomas add constraint idiomas_nivel_cefr_valido
      check (nivel_cefr is null or nivel_cefr in ('A1','A2','B1','B2','C1','C2','Nativo'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'idiomas_niveles_cefr_objeto') then
    alter table public.idiomas add constraint idiomas_niveles_cefr_objeto
      check (niveles_cefr is null or jsonb_typeof(niveles_cefr) = 'object');
  end if;
end $$;

-- Backfill: solo lo que YA está expresado en la escala MCER o como nativo.
-- "Básico/Intermedio/Avanzado" NO se convierten: su dueño los confirma en el perfil.
update public.idiomas
set nivel_cefr = case
  when upper(trim(nivel)) in ('A1','A2','B1','B2','C1','C2') then upper(trim(nivel))
  when lower(trim(nivel)) in ('nativo','nativa','lengua materna') then 'Nativo'
end
where nivel_cefr is null
  and (upper(trim(nivel)) in ('A1','A2','B1','B2','C1','C2')
       or lower(trim(nivel)) in ('nativo','nativa','lengua materna'));

-- ── 4. Logros: vínculo opcional con el empleo donde se lograron ─────────────
alter table public.logros
  add column if not exists experiencia_id uuid references public.experiencia(id) on delete set null;

create index if not exists logros_experiencia_id_idx on public.logros(experiencia_id);

-- ── 5. Fechas: cadenas vacías → NULL (formato canónico: 'AAAA' o 'AAAA-MM') ──
update public.experiencia set fecha_inicio = null where trim(fecha_inicio) = '';
update public.experiencia set fecha_fin    = null where trim(fecha_fin)    = '';
update public.educacion   set fecha_inicio = null where trim(fecha_inicio) = '';
update public.educacion   set fecha_fin    = null where trim(fecha_fin)    = '';

-- ── Verificación ─────────────────────────────────────────────────────────────
-- (a) Fechas que NO cumplen el formato canónico (deben corregirse antes de la Fase B):
select 'experiencia' as tabla, id, fecha_inicio, fecha_fin from public.experiencia
where (fecha_inicio is not null and fecha_inicio !~ '^\d{4}(-(0[1-9]|1[0-2]))?$')
   or (fecha_fin    is not null and fecha_fin    !~ '^\d{4}(-(0[1-9]|1[0-2]))?$')
union all
select 'educacion', id, fecha_inicio, fecha_fin from public.educacion
where (fecha_inicio is not null and fecha_inicio !~ '^\d{4}(-(0[1-9]|1[0-2]))?$')
   or (fecha_fin    is not null and fecha_fin    !~ '^\d{4}(-(0[1-9]|1[0-2]))?$');
