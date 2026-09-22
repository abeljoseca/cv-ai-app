-- CRITICAL FIX: sweep of the same RLS-without-GRANT gap found in pagos
-- (migration-pagos-grants.sql). Found while running scripts/setup-paypal-plans.js
-- against `configuracion` — then audited every migration file for the same pattern.
--
-- Real-world impact until this runs:
--   - cvs_inspiracion: CV Studio (src/features/cv-inspiracion) uses the browser
--     client (authenticated role) to save/load/list/delete canvas state — with
--     zero GRANT on this table, NONE of that has ever worked in production.
--     This is the whole CV Studio feature, silently broken end to end.
--   - configuracion: getConfig() (lib/config.ts) silently falls back to hardcoded
--     DEFAULTS on any permission error — prices have always been the hardcoded
--     defaults, and PATCH /api/admin/config has never been able to persist a
--     real price change.
--   - linkedin_profiles_cache: reads/writes via the admin client fail silently
--     (Supabase client returns {error}, doesn't throw) — LinkedIn import still
--     mostly works end to end, but never actually caches, re-scraping (and
--     re-spending Apify credits) on every import.
--   - cv_templates: had a GRANT to `authenticated` but none to `service_role` —
--     admin-side template management via the admin client would fail.
--
-- Ejecutar en Supabase SQL Editor

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cvs_inspiracion         TO authenticated;
GRANT ALL    ON public.cvs_inspiracion                                  TO service_role;

GRANT SELECT ON public.configuracion                                    TO authenticated;
GRANT ALL    ON public.configuracion                                    TO service_role;
-- (write access for admins is already scoped by the "Admin write configuracion" RLS policy)

GRANT ALL    ON public.linkedin_profiles_cache                          TO service_role;
-- (no authenticated grant — this table is service-role-only by design)

GRANT ALL    ON public.cv_templates                                     TO service_role;
