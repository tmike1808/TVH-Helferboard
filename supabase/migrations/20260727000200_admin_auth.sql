-- TVH Helferboard: feste Admin-Benutzer über Supabase Auth.
-- Die Auth-Konten werden manuell angelegt und über admin_users freigeschaltet.

begin;

create table public.admin_users (
  user_id uuid primary key,
  created_at timestamptz not null default now(),
  constraint admin_users_user_id_fkey
    foreign key (user_id)
    references auth.users (id)
    on delete cascade
);

alter table public.admin_users enable row level security;

revoke all
  on table public.admin_users
  from anon, authenticated;

-- SECURITY DEFINER vermeidet eine rekursive admin_users-RLS-Prüfung.
-- Der leere search_path und vollständig qualifizierte Namen verhindern,
-- dass Objekte aus einem manipulierbaren Schema aufgelöst werden.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = auth.uid()
  );
$$;

revoke all
  on function public.is_admin()
  from public, anon, authenticated;

grant execute
  on function public.is_admin()
  to authenticated;

-- Die Tabellenrechte allein erteilen noch keinen Zugriff. Jede Mutation
-- benötigt zusätzlich eine passende Admin-RLS-Policy.
grant insert, update, delete
  on table public.games
  to authenticated;

grant insert, update, delete
  on table public.teams
  to authenticated;

grant insert, update, delete
  on table public.helper_roles
  to authenticated;

create policy games_admin_insert
on public.games
for insert
to authenticated
with check ((select public.is_admin()));

create policy games_admin_update
on public.games
for update
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy games_admin_delete
on public.games
for delete
to authenticated
using ((select public.is_admin()));

create policy teams_admin_insert
on public.teams
for insert
to authenticated
with check ((select public.is_admin()));

create policy teams_admin_update
on public.teams
for update
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy teams_admin_delete
on public.teams
for delete
to authenticated
using ((select public.is_admin()));

create policy helper_roles_admin_insert
on public.helper_roles
for insert
to authenticated
with check ((select public.is_admin()));

create policy helper_roles_admin_update
on public.helper_roles
for update
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy helper_roles_admin_delete
on public.helper_roles
for delete
to authenticated
using ((select public.is_admin()));

commit;
