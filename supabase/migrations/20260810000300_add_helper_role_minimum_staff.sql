-- TVH Helferboard: fachliche Mindestbesetzung je Helferrolle.
-- Freie Slots bleiben unabhängig davon weiterhin vollständig sichtbar.

begin;

alter table public.helper_roles
  add column if not exists minimum_staff integer;

-- Bestehende und künftig erneut migrierte Rollen erhalten zunächst den
-- sicheren Standard: Mindestbesetzung entspricht der vollständigen Belegung.
update public.helper_roles
set minimum_staff = slots;

-- Ausschließlich die beiden bestätigten Aktive-Sonderfälle sind bereits mit
-- drei von vier Helfern durchführbar. IDs werden bewusst nicht verwendet.
update public.helper_roles
set minimum_staff = 3
where category = 'Aktive'
  and name in ('Verkauf', 'Ordner')
  and slots = 4;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.helper_roles'::regclass
      and conname = 'helper_roles_minimum_staff_valid'
  ) then
    alter table public.helper_roles
      add constraint helper_roles_minimum_staff_valid
      check (minimum_staff > 0 and minimum_staff <= slots);
  end if;
end;
$$;

alter table public.helper_roles
  alter column minimum_staff set not null;

commit;
