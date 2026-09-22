-- PayPal Subscriptions para el Plan Pro
-- Ejecutar en Supabase SQL Editor

ALTER TABLE public.suscripciones
  ADD COLUMN IF NOT EXISTS paypal_subscription_id text UNIQUE,
  ADD COLUMN IF NOT EXISTS paypal_plan_id text;

CREATE INDEX IF NOT EXISTS idx_suscripciones_paypal_id ON public.suscripciones(paypal_subscription_id);

-- suscripciones ya hereda los GRANT de migration-payments.sql (pagos/suscripciones
-- fueron arregladas juntas en migration-pagos-grants.sql) — verificado, no repetir.
