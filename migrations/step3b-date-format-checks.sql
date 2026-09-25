-- ============================================================
-- Paso 3 · Fase B — Formato canónico obligatorio de fechas de perfil
-- Ejecutar en Supabase SQL Editor DESPUÉS de desplegar el código del paso 3
-- (selector de mes/año en el perfil + normalización en las importaciones).
-- Antes de eso, el perfil todavía acepta texto libre y este CHECK rompería el guardado.
--
-- Formato: 'AAAA' (solo año, cuando el mes no se conoce) o 'AAAA-MM'. Nunca se inventa el mes.
-- Idempotente. Falla si queda alguna fecha fuera de formato (ver verificación de la Fase A).
-- ============================================================

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'experiencia_fechas_formato') then
    alter table public.experiencia add constraint experiencia_fechas_formato check (
      (fecha_inicio is null or fecha_inicio ~ '^\d{4}(-(0[1-9]|1[0-2]))?$') and
      (fecha_fin    is null or fecha_fin    ~ '^\d{4}(-(0[1-9]|1[0-2]))?$')
    );
  end if;
  if not exists (select 1 from pg_constraint where conname = 'educacion_fechas_formato') then
    alter table public.educacion add constraint educacion_fechas_formato check (
      (fecha_inicio is null or fecha_inicio ~ '^\d{4}(-(0[1-9]|1[0-2]))?$') and
      (fecha_fin    is null or fecha_fin    ~ '^\d{4}(-(0[1-9]|1[0-2]))?$')
    );
  end if;
end $$;
