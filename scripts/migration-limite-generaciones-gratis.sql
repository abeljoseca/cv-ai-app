-- ============================================================
-- Límite de generaciones gratis de por vida (2026-09-24)
-- Ejecutar en Supabase SQL Editor
--
-- Problema que cierra: un usuario del Plan Inicio podía generar un
-- CV, borrarlo sin pagarlo, generar otro, borrarlo, y así
-- indefinidamente — nunca pagando nada. La regla de "un CV sin pagar
-- a la vez" (user_has_unpaid_cv, ver migration-unpaid-cv-check.sql)
-- no lo evitaba porque se deriva de las filas que existen HOY en
-- cvs/cvs_inspiracion: al borrar la fila, el chequeo vuelve a dar
-- "no tiene ningún CV sin pagar" y lo deja generar otro gratis.
--
-- Regla de negocio nueva: un usuario que NUNCA ha hecho un pago
-- confirmado solo puede generar un número limitado de CVs EN TOTAL,
-- de por vida (no por día/mes — no se reinicia nunca). El contador
-- vive en una tabla de solo-inserción separada, escrita por un
-- trigger de base de datos (no por código de la app), así que
-- borrar el CV no lo reduce y no se puede evadir saltándose una
-- llamada de API — ni siquiera insertando directo desde el cliente,
-- como hace CV Studio.
--
-- En el momento en que el usuario tiene CUALQUIER pago confirmado
-- (uno solo, no importa cuál), esta regla deja de aplicarle para
-- siempre y vuelve a la regla normal de user_has_unpaid_cv.
-- ============================================================

-- ── 1. Límite configurable (mismo patrón que los precios en `configuracion`) ──

INSERT INTO public.configuracion (clave, valor, descripcion) VALUES
  ('limite_generaciones_gratis', '2', 'Máximo de CVs que un usuario puede generar de por vida sin haber pagado nunca (no se reinicia)')
ON CONFLICT (clave) DO NOTHING;

-- ── 2. Tabla de solo-inserción: registro de cada generación ──

CREATE TABLE IF NOT EXISTS public.cv_generaciones_log (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL,
  origen     text NOT NULL CHECK (origen IN ('cvs', 'cvs_inspiracion')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cv_generaciones_log_user ON public.cv_generaciones_log(user_id);

ALTER TABLE public.cv_generaciones_log ENABLE ROW LEVEL SECURITY;

-- Nadie accede a esta tabla directo desde el cliente: solo el trigger
-- de abajo (SECURITY DEFINER) escribe, y user_free_generations_exhausted
-- (SECURITY DEFINER) lee. No hace falta ninguna política para
-- `authenticated` — sin una política que lo permita, RLS deniega por
-- defecto, que es exactamente lo que queremos.
GRANT ALL ON public.cv_generaciones_log TO service_role;

-- ── 3. Backfill: contar generaciones que ya existen hoy ──
-- No podemos recuperar el historial de CVs ya borrados antes de este
-- fix (se borraron de verdad, sin rastro) — pero si un usuario tiene
-- CVs existentes ahora mismo, cuentan, para no darle un contador en
-- cero a alguien que ya generó varios.

INSERT INTO public.cv_generaciones_log (user_id, origen, created_at)
SELECT user_id, 'cvs', created_at FROM public.cvs;

INSERT INTO public.cv_generaciones_log (user_id, origen, created_at)
SELECT user_id, 'cvs_inspiracion', created_at FROM public.cvs_inspiracion;

-- ── 4. Trigger: registra cada generación nueva, sin importar que luego se borre ──

CREATE OR REPLACE FUNCTION public.log_cv_generacion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.cv_generaciones_log (user_id, origen)
  VALUES (NEW.user_id, TG_TABLE_NAME);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_cv_generacion ON public.cvs;
CREATE TRIGGER trg_log_cv_generacion
  AFTER INSERT ON public.cvs
  FOR EACH ROW EXECUTE FUNCTION public.log_cv_generacion();

DROP TRIGGER IF EXISTS trg_log_cv_inspiracion_generacion ON public.cvs_inspiracion;
CREATE TRIGGER trg_log_cv_inspiracion_generacion
  AFTER INSERT ON public.cvs_inspiracion
  FOR EACH ROW EXECUTE FUNCTION public.log_cv_generacion();

-- ── 5. Función: ¿este usuario ya agotó su límite gratis de por vida? ──

CREATE OR REPLACE FUNCTION public.user_free_generations_exhausted(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    COALESCE((SELECT plan FROM public.profiles WHERE id = p_user_id), 'gratuito') <> 'pro'
    AND NOT EXISTS (
      SELECT 1 FROM public.pagos WHERE user_id = p_user_id AND estado = 'confirmado'
    )
    AND (
      SELECT COUNT(*) FROM public.cv_generaciones_log WHERE user_id = p_user_id
    ) >= COALESCE(
      (SELECT valor::int FROM public.configuracion WHERE clave = 'limite_generaciones_gratis'),
      2
    );
$$;

GRANT EXECUTE ON FUNCTION public.user_free_generations_exhausted(uuid) TO authenticated, service_role;

-- ── 6. Cierra el hueco de generación directa desde el cliente en CV Studio ──

DROP POLICY IF EXISTS "Usuarios crean sus propios CVs inspiración" ON public.cvs_inspiracion;

CREATE POLICY "Usuarios crean sus propios CVs inspiración"
  ON public.cvs_inspiracion FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND NOT public.user_has_unpaid_cv(user_id)
    AND NOT public.user_free_generations_exhausted(user_id)
  );

-- ── 7. Bloquea borrar el ÚLTIMO recurso una vez agotado el límite ──
-- Sin esto, alguien que agota su límite podría borrar el CV que le
-- queda y quedarse sin nada que pagar — un callejón sin salida. Con
-- esto, un CV sin pagar queda "atrapado" (no se puede borrar) una vez
-- agotado el límite gratis, garantizando que siempre tenga algo que
-- puede pagar y descargar para desbloquearse.

DROP POLICY IF EXISTS "Usuarios eliminan sus propios CVs inspiración" ON public.cvs_inspiracion;

CREATE POLICY "Usuarios eliminan sus propios CVs inspiración"
  ON public.cvs_inspiracion FOR DELETE
  USING (
    auth.uid() = user_id
    AND NOT (
      public.user_free_generations_exhausted(user_id)
      AND NOT EXISTS (
        SELECT 1 FROM public.pagos p
        WHERE p.cv_inspiracion_id = cvs_inspiracion.id AND p.estado = 'confirmado'
      )
    )
  );

-- ── 8. Mismo cierre en la tabla `cvs` (General/Vacante/Mirror) ──
-- La política de DELETE existente en `cvs` no está en ningún script
-- de este repo (se creó a mano en algún momento) y no sabemos su
-- nombre exacto — en vez de adivinarlo (si el nombre no coincide,
-- DROP POLICY IF EXISTS no hace nada y la política vieja permisiva
-- seguiría activa en paralelo con la nueva, anulando el cierre), la
-- buscamos dinámicamente por tabla+comando y la reemplazamos.

DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'cvs' AND cmd = 'DELETE'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.cvs', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "cvs_delete_propio_salvo_limite_gratis_agotado"
  ON public.cvs FOR DELETE
  USING (
    auth.uid() = user_id
    AND NOT (
      public.user_free_generations_exhausted(user_id)
      AND NOT EXISTS (
        SELECT 1 FROM public.pagos p
        WHERE p.cv_id = cvs.id AND p.estado = 'confirmado'
      )
    )
  );
