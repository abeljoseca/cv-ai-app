-- Tabla de configuración global del sistema
-- Ejecutar en Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.configuracion (
  clave       text PRIMARY KEY,
  valor       text NOT NULL,
  descripcion text,
  updated_at  timestamptz DEFAULT now()
);

ALTER TABLE public.configuracion ENABLE ROW LEVEL SECURITY;

-- Cualquier usuario autenticado puede leer (necesario para mostrar precios)
CREATE POLICY "Public read configuracion" ON public.configuracion
  FOR SELECT USING (true);

-- Solo admins pueden escribir
CREATE POLICY "Admin write configuracion" ON public.configuracion
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Valores iniciales
INSERT INTO public.configuracion (clave, valor, descripcion) VALUES
  ('precio_cv_unico',    '2.99', 'Precio unitario para descargar un CV (USD)'),
  ('precio_mensual',     '9.99', 'Precio de la suscripción mensual Pro (USD)'),
  ('precio_anual',       '79',   'Precio de la suscripción anual Pro (USD)'),
  ('precio_inspiracion', '2.99', 'Precio para descargar un CV Inspiración (USD)')
ON CONFLICT (clave) DO NOTHING;