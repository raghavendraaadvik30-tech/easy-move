-- Admit only approved active members and limit self-service profile updates.
-- Apply after 20261020010000_exam_security_hardening.sql.

revoke update on table public.profiles from authenticated;
grant update (preferred_medium) on table public.profiles to authenticated;

-- A person has one active school workspace at a time. Transfers suspend the old
-- membership before activating the new one, avoiding silent cross-school context.
create unique index if not exists one_active_institution_per_user
  on public.institution_memberships(user_id)
  where status = 'active';

create or replace function public.get_current_user_context()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  profile_row public.profiles;
  membership_row public.institution_memberships;
  institution_name text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select * into profile_row from public.profiles where id = auth.uid();
  if not found then
    raise exception 'Profile not provisioned' using errcode = '42501';
  end if;

  if profile_row.role = 'platform_admin' then
    return jsonb_build_object(
      'id', profile_row.id,
      'full_name', profile_row.full_name,
      'role', profile_row.role,
      'preferred_medium', profile_row.preferred_medium,
      'class_name', profile_row.class_name,
      'institution_name', 'VidyaSetu Platform'
    );
  end if;

  select * into membership_row
  from public.institution_memberships
  where user_id = auth.uid() and status = 'active'
  order by created_at asc
  limit 1;

  if not found then
    raise exception 'No approved active institution membership' using errcode = '42501';
  end if;

  select name into institution_name
  from public.institutions
  where id = membership_row.institution_id;

  return jsonb_build_object(
    'id', profile_row.id,
    'full_name', profile_row.full_name,
    'role', membership_row.role,
    'preferred_medium', profile_row.preferred_medium,
    'class_name', profile_row.class_name,
    'institution_name', institution_name
  );
end;
$$;

revoke all on function public.get_current_user_context() from public;
grant execute on function public.get_current_user_context() to authenticated;
