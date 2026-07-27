-- TVH Helferboard: eindeutige Excel-Bezeichnung für das Mannschafts-Mapping.

begin;

alter table public.teams
add column import_name text;

alter table public.teams
add constraint teams_import_name_valid check (
  import_name is null
  or (
    import_name = btrim(import_name)
    and char_length(import_name) between 1 and 120
  )
);

-- Die Zuordnungen sind durch die echte Teamliste und Spiele.xlsx eindeutig
-- belegt. Nicht vorhandene Jugendteams werden bewusst nicht ergänzt.
update public.teams
set import_name = mapping.import_name
from (
  values
    ('TVH Herren 1', 'Aktive', 'Herren 1'),
    ('TVH Herren 2', 'Aktive', 'Herren 2'),
    ('TVH Männliche Jugend E', 'Jugend', 'mE'),
    ('TVH Weibliche Jugend D', 'Jugend', 'wD')
) as mapping(name, category, import_name)
where public.teams.name = mapping.name
  and public.teams.category = mapping.category
  and public.teams.import_name is null;

-- PostgreSQL erlaubt in einem partiellen Unique-Index weiterhin mehrere
-- NULL-Werte. lower() schützt zugleich die fallunabhängige Importzuordnung.
create unique index teams_import_name_unique_ci
on public.teams (lower(import_name))
where import_name is not null;

commit;
