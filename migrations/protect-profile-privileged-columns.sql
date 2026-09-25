-- SECURITY: stop users from granting themselves Pro, admin/editor/ambassador roles,
-- or resetting payment/free-download state on their own profile.
--
-- The RLS policy "Users can update own profile" allows updating ANY column of the
-- user's row, and "Users can insert own profile" allows inserting any values. So a
-- user could PATCH plan='pro' (free downloads) or is_admin=true (and then, through
-- "Admins can update any profile", modify every other user's profile).
--
-- Every legitimate write of these columns happens server-side with the service role
-- (PayPal/NOWPayments flows, admin API routes). End-user requests arrive through
-- PostgREST as the 'authenticated' (or 'anon') role, so only those are restricted.
-- Direct SQL (postgres) and the service role keep full control.
--
-- Idempotent: safe to run more than once.

create or replace function public.protect_profile_privileged_columns()
returns trigger
language plpgsql
as $$
begin
  if current_user not in ('authenticated', 'anon') then
    return new;
  end if;

  if tg_op = 'INSERT' then
    -- A user-created profile always starts with no privileges, whatever was sent.
    new.plan := 'gratuito';
    new.is_admin := false;
    new.is_editor := false;
    new.is_embajador := false;
    new.cv_pendiente_pago_id := null;
    new.descarga_gratis_inspiracion_usada := false;
    return new;
  end if;

  if new.plan is distinct from old.plan
     or new.is_admin is distinct from old.is_admin
     or new.is_editor is distinct from old.is_editor
     or new.is_embajador is distinct from old.is_embajador
     or new.cv_pendiente_pago_id is distinct from old.cv_pendiente_pago_id
     or new.descarga_gratis_inspiracion_usada is distinct from old.descarga_gratis_inspiracion_usada
  then
    raise exception 'No autorizado: columna protegida del perfil'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists protect_profile_privileged_columns on public.profiles;

create trigger protect_profile_privileged_columns
  before insert or update on public.profiles
  for each row
  execute function public.protect_profile_privileged_columns();

-- Audit: list profiles that currently hold privileges, to confirm none were self-granted.
select id, email_cv, plan, is_admin, is_editor, is_embajador, created_at
from public.profiles
where plan = 'pro' or is_admin or is_editor or is_embajador
order by created_at;
