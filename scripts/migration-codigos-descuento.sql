-- Sistema de códigos de descuento para embajadores
-- Ejecutar en Supabase SQL Editor

-- ─── 1. Módulo de códigos por embajador ──────────────────────────────────────
ALTER TABLE public.embajador_perfil
  ADD COLUMN IF NOT EXISTS modulo_codigos_activo boolean NOT NULL DEFAULT false;

-- ─── 2. Soft-delete en codigos_descuento ─────────────────────────────────────
-- Un código con usos > 0 nunca se borra realmente; solo se marca eliminado.
ALTER TABLE public.codigos_descuento
  ADD COLUMN IF NOT EXISTS eliminado boolean NOT NULL DEFAULT false;

-- ─── 3. Índice para historial ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_codigos_eliminado ON public.codigos_descuento(eliminado);

-- ─── 4. Grants para las columnas nuevas (mismos roles que antes) ──────────────
-- Las tablas ya tienen sus grants; las columnas nuevas los heredan automáticamente.
-- No se requiere acción adicional.