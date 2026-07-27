-- TVH Helferboard: initiales, zum Anwendungscode kompatibles Schema.
-- Diese Migration ist als einmalig auszuführende Basismigration vorgesehen.
-- Sie wird als Transaktion ausgeführt und bei einem Fehler vollständig verworfen.

begin;

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint teams_name_valid check (
    name = btrim(name)
    and char_length(name) between 1 and 120
  ),
  constraint teams_category_valid check (
    category in ('Aktive', 'Jugend')
  ),
  constraint teams_name_category_unique unique (name, category)
);

create table public.games (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null,
  start_time timestamptz not null,
  opponent text not null,
  is_home boolean not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint games_team_id_fkey
    foreign key (team_id)
    references public.teams (id)
    on update cascade
    on delete restrict,
  constraint games_opponent_valid check (
    opponent = btrim(opponent)
    and char_length(opponent) between 1 and 120
  )
);

create table public.helper_roles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  slots integer not null,
  order_index integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint helper_roles_name_valid check (
    name = btrim(name)
    and char_length(name) between 1 and 80
  ),
  constraint helper_roles_category_valid check (
    category in ('Aktive', 'Jugend')
  ),
  constraint helper_roles_slots_positive check (slots > 0),
  constraint helper_roles_order_index_positive check (order_index > 0),
  constraint helper_roles_name_category_unique unique (name, category),
  constraint helper_roles_order_category_unique unique (
    category,
    order_index
  )
);

create table public.helper_assignments (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null,
  role_id uuid not null,
  helper_name text not null,
  created_at timestamptz not null default now(),
  constraint helper_assignments_game_id_fkey
    foreign key (game_id)
    references public.games (id)
    on update cascade
    on delete cascade,
  constraint helper_assignments_role_id_fkey
    foreign key (role_id)
    references public.helper_roles (id)
    on update cascade
    on delete restrict,
  constraint helper_assignments_helper_name_valid check (
    helper_name = btrim(helper_name)
    and char_length(helper_name) between 1 and 100
  )
);

create index games_start_time_idx
  on public.games (start_time);

create index games_team_id_idx
  on public.games (team_id);

create index teams_category_idx
  on public.teams (category);

create index helper_assignments_game_id_idx
  on public.helper_assignments (game_id);

create index helper_assignments_role_id_idx
  on public.helper_assignments (role_id);

-- Entspricht der bestehenden clientseitigen Prüfung: Derselbe Name darf
-- innerhalb derselben Rolle und desselben Spiels nicht erneut vorkommen,
-- unabhängig von Groß-/Kleinschreibung.
create unique index helper_assignments_game_role_helper_name_unique
  on public.helper_assignments (
    game_id,
    role_id,
    lower(helper_name)
  );

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.set_updated_at() from public;

create trigger teams_set_updated_at
before update on public.teams
for each row
execute function public.set_updated_at();

create trigger games_set_updated_at
before update on public.games
for each row
execute function public.set_updated_at();

create trigger helper_roles_set_updated_at
before update on public.helper_roles
for each row
execute function public.set_updated_at();

-- Verhindert Zuordnungen einer Rolle aus der falschen Teamkategorie.
create or replace function public.validate_helper_assignment_category()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.games as game
    join public.teams as team
      on team.id = game.team_id
    join public.helper_roles as role
      on role.id = new.role_id
     and role.category = team.category
    where game.id = new.game_id
  ) then
    raise exception
      using
        errcode = '23514',
        message = 'Helferrolle und Spiel müssen derselben Kategorie angehören.';
  end if;

  return new;
end;
$$;

revoke all
  on function public.validate_helper_assignment_category()
  from public;

create trigger helper_assignments_validate_category
before insert or update of game_id, role_id
on public.helper_assignments
for each row
execute function public.validate_helper_assignment_category();

alter table public.teams enable row level security;
alter table public.games enable row level security;
alter table public.helper_roles enable row level security;
alter table public.helper_assignments enable row level security;

-- Berechtigungen werden explizit auf den MVP-Umfang begrenzt.
revoke all on table public.teams from anon, authenticated;
revoke all on table public.games from anon, authenticated;
revoke all on table public.helper_roles from anon, authenticated;
revoke all on table public.helper_assignments from anon, authenticated;

grant usage on schema public to anon, authenticated;

grant select on table public.teams to anon, authenticated;
grant select on table public.games to anon, authenticated;
grant select on table public.helper_roles to anon, authenticated;
grant select on table public.helper_assignments to anon, authenticated;

grant insert (game_id, role_id, helper_name)
  on table public.helper_assignments
  to anon, authenticated;

grant delete
  on table public.helper_assignments
  to anon, authenticated;

create policy teams_public_read
on public.teams
for select
to anon, authenticated
using (true);

create policy games_public_read
on public.games
for select
to anon, authenticated
using (true);

create policy helper_roles_public_read
on public.helper_roles
for select
to anon, authenticated
using (true);

create policy helper_assignments_public_read
on public.helper_assignments
for select
to anon, authenticated
using (true);

create policy helper_assignments_public_insert
on public.helper_assignments
for insert
to anon, authenticated
with check (
  helper_name = btrim(helper_name)
  and char_length(helper_name) between 1 and 100
  and exists (
    select 1
    from public.games as game
    join public.teams as team
      on team.id = game.team_id
    join public.helper_roles as role
      on role.id = helper_assignments.role_id
     and role.category = team.category
    where game.id = helper_assignments.game_id
  )
);

-- Das aktuelle Frontend besitzt noch keinen Eigentumsnachweis. Deshalb kann
-- die ausdrücklich geforderte öffentliche Austragefunktion technisch nur
-- jede sichtbare Zuordnung anhand ihrer ID löschen. Dieses MVP-Risiko ist in
-- SUPABASE_SETUP.md und im DB-0-Report dokumentiert.
create policy helper_assignments_public_delete
on public.helper_assignments
for delete
to anon, authenticated
using (true);

-- Absichtlich keine anonymen INSERT-, UPDATE- oder DELETE-Policies und keine
-- entsprechenden Tabellenrechte für teams, games oder helper_roles.

commit;
