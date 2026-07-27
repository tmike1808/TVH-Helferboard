-- TVH Helferboard: Teamstammdaten für den Excel-Spielimport vervollständigen.
-- Voraussetzung: 20260727000400_add_team_import_name.sql wurde angewendet.

begin;

-- Bestehende Teams erhalten ihre fachlich bestätigten Excel-Bezeichnungen.
update public.teams as team
set import_name = mapping.import_name
from (
  values
    ('TVH Herren 1', 'Aktive', 'Herren 1'),
    ('TVH Herren 2', 'Aktive', 'Herren 2'),
    ('TVH Männliche Jugend E', 'Jugend', 'mE'),
    ('TVH Weibliche Jugend D', 'Jugend', 'wD')
) as mapping(name, category, import_name)
where team.name = mapping.name
  and team.category = mapping.category
  and team.import_name is distinct from mapping.import_name;

-- Fehlende Jugendteams werden über den vorhandenen fachlichen
-- Eindeutigkeitsschlüssel (name, category) ergänzt. Es werden keine IDs
-- vorgegeben und keine vorhandenen Teamnamen verändert.
insert into public.teams (name, category, import_name)
values
  ('TVH Männliche Jugend D 1', 'Jugend', 'mD1'),
  ('TVH Männliche Jugend D 2', 'Jugend', 'mD2'),
  ('TVH Weibliche Jugend C', 'Jugend', 'wC'),
  ('TVH Weibliche Jugend E', 'Jugend', 'wE')
on conflict (name, category)
do update set
  import_name = excluded.import_name,
  updated_at = now();

commit;
