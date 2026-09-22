-- ============================================================
-- Fix: RLS faltante en public.certificaciones
-- Ejecutar en Supabase SQL Editor
--
-- Hallazgo: la tabla existe y se escribe correctamente desde
-- /api/profile/hydrate (usa el cliente admin, que bypassa RLS),
-- pero /profile lee y escribe con el cliente del usuario normal,
-- que sí respeta RLS. Sin políticas, cada lectura/escritura desde
-- /profile devuelve 403 — confirmado en prueba real del navegador.
-- ============================================================

ALTER TABLE public.certificaciones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuarios ven sus propias certificaciones" ON public.certificaciones;
CREATE POLICY "Usuarios ven sus propias certificaciones"
  ON public.certificaciones FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuarios crean sus propias certificaciones" ON public.certificaciones;
CREATE POLICY "Usuarios crean sus propias certificaciones"
  ON public.certificaciones FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuarios actualizan sus propias certificaciones" ON public.certificaciones;
CREATE POLICY "Usuarios actualizan sus propias certificaciones"
  ON public.certificaciones FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuarios eliminan sus propias certificaciones" ON public.certificaciones;
CREATE POLICY "Usuarios eliminan sus propias certificaciones"
  ON public.certificaciones FOR DELETE
  USING (auth.uid() = user_id);

-- El cliente admin (service_role) ya bypassa RLS por defecto, pero el rol
-- "authenticated" necesita el GRANT explícito además de las políticas
-- (Supabase lo aplica automáticamente al crear tablas desde el Table Editor,
-- pero lo forzamos aquí por si esta tabla se creó de otra forma).
GRANT SELECT, INSERT, UPDATE, DELETE ON public.certificaciones TO authenticated;
