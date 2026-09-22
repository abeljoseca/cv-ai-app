-- ============================================================
-- Bloqueo de generación sin pagar (handoff.md, pendiente #1)
-- Ejecutar en Supabase SQL Editor
--
-- Regla de negocio: un usuario sin Pro no puede tener más de un
-- CV sin pagar a la vez, en ningún tipo de CV (General, Vacante,
-- Mirror -> tabla cvs; CV Studio -> tabla cvs_inspiracion).
-- Generar el texto ya cuenta como "crear" el CV.
--
-- Esta función es la única fuente de verdad para esa regla: se
-- deriva en caliente de cvs / cvs_inspiracion / pagos, nunca de
-- un puntero cacheado (evita el bug que tenía cv_pendiente_pago_id,
-- que solo se escribía al iniciar un pago y nunca se comprobaba
-- en el servidor al generar).
-- ============================================================

CREATE OR REPLACE FUNCTION public.user_has_unpaid_cv(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    COALESCE((SELECT plan FROM public.profiles WHERE id = p_user_id), 'gratuito') <> 'pro'
    AND (
      EXISTS (
        SELECT 1 FROM public.cvs c
        WHERE c.user_id = p_user_id
          AND NOT EXISTS (
            SELECT 1 FROM public.pagos p
            WHERE p.cv_id = c.id AND p.estado = 'confirmado'
          )
      )
      OR EXISTS (
        SELECT 1 FROM public.cvs_inspiracion ci
        WHERE ci.user_id = p_user_id
          AND NOT EXISTS (
            SELECT 1 FROM public.pagos p
            WHERE p.cv_inspiracion_id = ci.id AND p.estado = 'confirmado'
          )
      )
    );
$$;

-- Llamada desde rutas de servidor (service_role) y desde políticas RLS
-- evaluadas como el usuario autenticado (authenticated).
GRANT EXECUTE ON FUNCTION public.user_has_unpaid_cv(uuid) TO authenticated, service_role;

-- ── Cierra el mismo hueco en CV Studio (cvs_inspiracion) ──────────────────
-- Esta tabla se inserta directo desde el cliente (Supabase browser client,
-- src/features/cv-inspiracion/lib/supabase-cv-service.ts) — no pasa por
-- ninguna API route de Next.js. La única forma de que la regla no se pueda
-- saltar aquí es aplicarla en la propia política RLS de INSERT.

DROP POLICY IF EXISTS "Usuarios crean sus propios CVs inspiración" ON public.cvs_inspiracion;

CREATE POLICY "Usuarios crean sus propios CVs inspiración"
  ON public.cvs_inspiracion FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND NOT public.user_has_unpaid_cv(user_id)
  );
