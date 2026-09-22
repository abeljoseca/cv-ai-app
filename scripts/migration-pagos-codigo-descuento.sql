-- Conectar códigos de descuento al checkout: guarda qué código (si alguno)
-- se usó en un pago, y el precio antes del descuento para auditoría.
-- Ejecutar en Supabase SQL Editor

ALTER TABLE public.pagos
  ADD COLUMN IF NOT EXISTS codigo_descuento_id uuid REFERENCES public.codigos_descuento(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS monto_original decimal(10,2);

CREATE INDEX IF NOT EXISTS idx_pagos_codigo_descuento ON public.pagos(codigo_descuento_id);
