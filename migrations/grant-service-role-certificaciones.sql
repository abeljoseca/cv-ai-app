-- ============================================================
-- Fix: service_role had no privileges on public.certificaciones (2026-09-25)
-- Ejecutar en Supabase SQL Editor. Idempotente.
--
-- migration-certificaciones-rls.sql granted the table to `authenticated` only.
-- RLS bypass does not replace table privileges, so every server-side write with the
-- service role failed with 42501 "permission denied" — and /api/profile/hydrate (LinkedIn
-- import) inserts certifications that way, silently: no imported certification was ever
-- saved. Found while probing every table with the service role; the only other table
-- without service_role access (admin_audit_log) is written with the user client and is
-- tracked in the pre-launch security review.
-- ============================================================

GRANT ALL ON public.certificaciones TO service_role;

-- Verification: must return true.
select has_table_privilege('service_role', 'public.certificaciones', 'INSERT') as service_role_puede_insertar;
