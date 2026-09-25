-- ============================================================
-- Límite gratis: bloquear solo el borrado del ÚLTIMO CV (2026-09-25)
-- Ejecutar en Supabase SQL Editor. Idempotente.
--
-- Regla de negocio (CEO): un usuario que agotó sus CVs gratis de por vida y nunca
-- pagó puede borrar CVs libremente MIENTRAS le quede al menos otro. Solo se bloquea
-- borrar el último, para que siempre tenga algo que pagar/descargar y no pueda
-- dejar la cuenta vacía para "engañar" al sistema.
--
-- Antes (migration-limite-generaciones-gratis*.sql) la política de DELETE bloqueaba
-- CUALQUIER CV sin pagar una vez agotado el límite — más estricto de lo acordado.
--
-- Por qué un trigger y no la política de RLS: una política se evalúa fila por fila
-- contra el estado previo a la sentencia. Un DELETE de varias filas a la vez
-- (posible llamando a la API directamente) vería "todavía quedan otros" en cada
-- fila y borraría todos. Un trigger BEFORE DELETE por fila sí ve las filas ya
-- borradas en la misma sentencia, así que detiene el último.
--
-- Cuenta CVs de las dos tablas (cvs + cvs_inspiracion): ambos se pueden pagar.
-- Solo aplica a usuarios finales (roles authenticated/anon). service_role y el
-- borrado en cascada al eliminar una cuenta no se ven afectados.
-- ============================================================

create or replace function public.guard_last_cv_delete()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user not in ('authenticated', 'anon') then
    return old;
  end if;

  if public.user_free_generations_exhausted(old.user_id)
     and (select count(*) from public.cvs where user_id = old.user_id)
       + (select count(*) from public.cvs_inspiracion where user_id = old.user_id) <= 1
  then
    -- The app matches this exact message to show the "límite gratis" notice.
    raise exception 'ULTIMO_CV_LIMITE_GRATIS' using errcode = 'P0001';
  end if;

  return old;
end;
$$;

drop trigger if exists guard_last_cv_delete on public.cvs;
create trigger guard_last_cv_delete
  before delete on public.cvs
  for each row execute function public.guard_last_cv_delete();

drop trigger if exists guard_last_cv_delete on public.cvs_inspiracion;
create trigger guard_last_cv_delete
  before delete on public.cvs_inspiracion
  for each row execute function public.guard_last_cv_delete();

-- The DELETE policies go back to ownership only; the trigger owns the business rule.
drop policy if exists "cvs_delete_propio_salvo_limite_gratis_agotado" on public.cvs;
drop policy if exists "cvs_delete_propio" on public.cvs;
create policy "cvs_delete_propio" on public.cvs
  for delete using (auth.uid() = user_id);

drop policy if exists "Usuarios eliminan sus propios CVs inspiración" on public.cvs_inspiracion;
drop policy if exists "cvs_inspiracion_delete_propio" on public.cvs_inspiracion;
create policy "cvs_inspiracion_delete_propio" on public.cvs_inspiracion
  for delete using (auth.uid() = user_id);

-- Verification: expect exactly one DELETE policy per table and no FOR ALL policy.
select tablename, policyname, cmd, qual
from pg_policies
where schemaname = 'public' and tablename in ('cvs', 'cvs_inspiracion')
order by tablename, cmd;
