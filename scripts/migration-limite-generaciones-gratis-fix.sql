-- ============================================================
-- Corrección: la política "own_cvs" (FOR ALL) seguía activa (2026-09-24)
-- Ejecutar en Supabase SQL Editor DESPUÉS de migration-limite-generaciones-gratis.sql
--
-- migration-limite-generaciones-gratis.sql buscó y reemplazó políticas de
-- DELETE en `cvs`, pero la política real que existía ahí ("own_cvs") era
-- FOR ALL (cubre SELECT/INSERT/UPDATE/DELETE a la vez), así que ese script
-- no la encontró ni la tocó. Las políticas permisivas de Postgres se
-- combinan con OR: "own_cvs" seguía permitiendo el DELETE sin ninguna
-- restricción en paralelo con la política nueva, anulándola por completo.
-- Verificado con una prueba real: el borrado NO se bloqueaba pese a que
-- la política nueva decía lo contrario.
--
-- Este script reemplaza "own_cvs" por políticas explícitas por comando,
-- preservando exactamente el mismo comportamiento de SELECT/UPDATE que
-- ya existía, y sin agregar una política de INSERT — no hay ningún
-- lugar del código que inserte en `cvs` desde el cliente (siempre pasa
-- por el servidor con service_role), así que no hace falta, y de paso
-- cierra una puerta que no debería haber estado abierta: sin política de
-- INSERT, ya no es posible insertar una fila de `cvs` falsa directo
-- desde el navegador saltándose la generación real por IA.
-- ============================================================

DROP POLICY IF EXISTS "own_cvs" ON public.cvs;
DROP POLICY IF EXISTS "cvs_delete_propio_salvo_limite_gratis_agotado" ON public.cvs;

CREATE POLICY "cvs_select_propio" ON public.cvs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "cvs_update_propio" ON public.cvs
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "cvs_delete_propio_salvo_limite_gratis_agotado" ON public.cvs
  FOR DELETE
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
