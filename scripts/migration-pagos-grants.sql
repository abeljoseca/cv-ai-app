-- CRITICAL FIX: public.pagos and public.suscripciones were created (migration-payments.sql)
-- with RLS enabled but WITHOUT the table-level GRANTs that every other table in this schema
-- has (compare migration-embajadores.sql, migration-certificaciones-rls.sql). RLS policies and
-- BYPASSRLS (which service_role has) do NOT substitute for basic GRANT privileges — Postgres
-- checks both layers. Verified empirically: both `authenticated` and `service_role` currently
-- get "permission denied for table pagos" on a plain SELECT.
--
-- Real-world impact until this runs: /api/payments/create can't INSERT (no payment can ever be
-- created), /api/payments/webhook can't UPDATE (a payment could never be confirmed even if one
-- existed), and /account, /cvs, /create-cv/success can't SELECT a user's own payment history
-- (silently rendered as an empty list, indistinguishable from "no payments yet").
--
-- Ejecutar en Supabase SQL Editor

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pagos         TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.suscripciones TO authenticated;

GRANT ALL ON public.pagos         TO service_role;
GRANT ALL ON public.suscripciones TO service_role;
