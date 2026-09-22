-- ============================================================
-- MIGRATION: Sistema de Pagos Freemium - Resumika
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- 1. Nuevos campos en profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS cv_pendiente_pago_id uuid REFERENCES public.cvs(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS descarga_gratis_inspiracion_usada boolean NOT NULL DEFAULT false;

-- 2. Tabla de pagos
CREATE TABLE IF NOT EXISTS public.pagos (
  id                          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id                     uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  cv_id                       uuid        REFERENCES public.cvs(id) ON DELETE SET NULL,
  cv_inspiracion_id           uuid        REFERENCES public.cvs_inspiracion(id) ON DELETE SET NULL,
  tipo                        text        NOT NULL CHECK (tipo IN ('cv_unico', 'suscripcion_mensual', 'suscripcion_anual', 'inspiracion_descarga')),
  monto                       decimal(10,2) NOT NULL,
  moneda                      text        NOT NULL DEFAULT 'USDT',
  red                         text        CHECK (red IN ('TRON', 'BSC', 'MATIC')),
  estado                      text        NOT NULL DEFAULT 'pendiente'
                                          CHECK (estado IN ('pendiente', 'confirmado', 'expirado', 'fallido')),
  nowpayments_payment_id      text        UNIQUE,
  nowpayments_payment_status  text,
  direccion_wallet            text,
  monto_cripto                decimal(20,8),
  created_at                  timestamptz NOT NULL DEFAULT now(),
  confirmed_at                timestamptz
);

-- RLS en pagos
ALTER TABLE public.pagos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios ven sus propios pagos"
  ON public.pagos FOR SELECT
  USING (auth.uid() = user_id);

-- 3. Tabla de suscripciones (preparada para uso futuro con Stripe)
CREATE TABLE IF NOT EXISTS public.suscripciones (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tipo          text        NOT NULL CHECK (tipo IN ('mensual', 'anual')),
  estado        text        NOT NULL DEFAULT 'activa'
                            CHECK (estado IN ('activa', 'cancelada', 'expirada')),
  pago_id       uuid        REFERENCES public.pagos(id),
  fecha_inicio  timestamptz NOT NULL DEFAULT now(),
  fecha_fin     timestamptz NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.suscripciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios ven sus propias suscripciones"
  ON public.suscripciones FOR SELECT
  USING (auth.uid() = user_id);

-- 4. Índices para rendimiento
CREATE INDEX IF NOT EXISTS idx_pagos_user_id             ON public.pagos(user_id);
CREATE INDEX IF NOT EXISTS idx_pagos_cv_id               ON public.pagos(cv_id);
CREATE INDEX IF NOT EXISTS idx_pagos_cv_inspiracion_id   ON public.pagos(cv_inspiracion_id);
CREATE INDEX IF NOT EXISTS idx_pagos_nowpayments_id      ON public.pagos(nowpayments_payment_id);
CREATE INDEX IF NOT EXISTS idx_pagos_estado              ON public.pagos(estado);
CREATE INDEX IF NOT EXISTS idx_suscripciones_user_id     ON public.suscripciones(user_id);
CREATE INDEX IF NOT EXISTS idx_suscripciones_estado      ON public.suscripciones(estado);