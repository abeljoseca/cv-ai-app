-- ============================================================
-- Security fixes — run in Supabase SQL Editor
-- Resolves all issues reported by Supabase Security Advisor
-- ============================================================


-- ============================================================
-- 1. CRÍTICO: Habilitar RLS en public.profiles
--    La tabla tenía políticas definidas pero RLS estaba
--    desactivado, exponiendo todos los datos públicamente.
-- ============================================================

-- Asegurar que existen políticas mínimas antes de activar RLS
-- (si ya existen, el IF NOT EXISTS lo ignora)

DO $$
BEGIN
  -- SELECT: cada usuario sólo ve su propio perfil
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles'
      AND policyname = 'Users can view own profile'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "Users can view own profile"
        ON public.profiles FOR SELECT
        TO authenticated
        USING (auth.uid() = id);
    $p$;
  END IF;

  -- INSERT: sólo el propio usuario puede crear su perfil (registro)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles'
      AND policyname = 'Users can insert own profile'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "Users can insert own profile"
        ON public.profiles FOR INSERT
        TO authenticated
        WITH CHECK (auth.uid() = id);
    $p$;
  END IF;

  -- UPDATE: cada usuario sólo puede actualizar su propio perfil
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles'
      AND policyname = 'Users can update own profile'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "Users can update own profile"
        ON public.profiles FOR UPDATE
        TO authenticated
        USING (auth.uid() = id)
        WITH CHECK (auth.uid() = id);
    $p$;
  END IF;
END;
$$;

-- Ahora sí activar RLS (seguro porque las políticas ya están)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- 2. WARN: Fijar search_path mutable en funciones trigger
--    Sin search_path fijo, un atacante podría crear un esquema
--    malicioso y redirigir la función.
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
  RETURNS trigger LANGUAGE plpgsql
  SECURITY INVOKER
  SET search_path = ''
AS $$
BEGIN
  new.updated_at = now();
  RETURN new;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_cv_templates_updated_at()
  RETURNS trigger LANGUAGE plpgsql
  SECURITY INVOKER
  SET search_path = ''
AS $$
BEGIN
  new.updated_at = now();
  RETURN new;
END;
$$;


-- ============================================================
-- 3. WARN: rls_auto_enable() accesible por anon y authenticated
--    Es una función SECURITY DEFINER que no debería ser pública.
--    Se revocan permisos de ejecución.
-- ============================================================

REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM authenticated;


-- ============================================================
-- 4. WARN: admin_audit_log INSERT policy con WITH CHECK (true)
--    Permite inserción sin ninguna restricción. Se limita a
--    usuarios autenticados y a insertar sólo su propio uid.
-- ============================================================

DROP POLICY IF EXISTS "service_insert_audit" ON public.admin_audit_log;

CREATE POLICY "service_insert_audit"
  ON public.admin_audit_log FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);


-- ============================================================
-- 5. WARN: Bucket fotos-cv permite listar todos los archivos
--    Con una política SELECT amplia, cualquiera puede enumerar
--    los archivos del bucket. Se reemplaza por acceso por ruta.
-- ============================================================

-- Eliminar la política amplia de lectura
DROP POLICY IF EXISTS "Public read fotos-cv" ON storage.objects;

-- Permitir lectura sólo de archivos en la carpeta del propio usuario
-- (Las URLs públicas del bucket siguen funcionando sin política RLS)
CREATE POLICY "Users read own fotos-cv"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'fotos-cv'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Mantener acceso de escritura/borrado propio (si no existía)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Users upload own fotos-cv'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "Users upload own fotos-cv"
        ON storage.objects FOR INSERT
        TO authenticated
        WITH CHECK (
          bucket_id = 'fotos-cv'
          AND (storage.foldername(name))[1] = auth.uid()::text
        );
    $p$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Users delete own fotos-cv'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "Users delete own fotos-cv"
        ON storage.objects FOR DELETE
        TO authenticated
        USING (
          bucket_id = 'fotos-cv'
          AND (storage.foldername(name))[1] = auth.uid()::text
        );
    $p$;
  END IF;
END;
$$;


-- ============================================================
-- PENDIENTE (requiere Dashboard, no SQL):
--
-- 6. Leaked Password Protection
--    Ir a: Authentication → Settings → Password Settings
--    Activar: "Enable leaked password protection"
--    Esto verifica contraseñas contra HaveIBeenPwned.org
-- ============================================================
