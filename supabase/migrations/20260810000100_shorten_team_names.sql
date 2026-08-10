-- TVH Helferboard: sichtbare Vereinsmannschaftsnamen kompakt darstellen.
-- Die eindeutigen Excel-Importnamen, Team-IDs und Spielzuordnungen bleiben
-- unverändert.

begin;

do $$
declare
  matched_team_count integer;
begin
  select count(*)
  into matched_team_count
  from public.teams as team
  join (
    values
      ('Herren 1', 'Aktive', 'Herren 1'),
      ('Herren 2', 'Aktive', 'Herren 2'),
      ('mD1', 'Jugend', 'mD1'),
      ('mD2', 'Jugend', 'mD2'),
      ('mE', 'Jugend', 'mE'),
      ('wC', 'Jugend', 'wC'),
      ('wD', 'Jugend', 'wD'),
      ('wE', 'Jugend', 'wE')
  ) as mapping(import_name, category, short_name)
    on lower(team.import_name) = lower(mapping.import_name)
   and team.category = mapping.category;

  if matched_team_count <> 8 then
    raise exception
      using
        errcode = '23514',
        message = 'Die acht erwarteten Vereinsmannschaften konnten nicht eindeutig über import_name zugeordnet werden.';
  end if;

  update public.teams as team
  set name = mapping.short_name
  from (
    values
      ('Herren 1', 'Aktive', 'Herren 1'),
      ('Herren 2', 'Aktive', 'Herren 2'),
      ('mD1', 'Jugend', 'mD1'),
      ('mD2', 'Jugend', 'mD2'),
      ('mE', 'Jugend', 'mE'),
      ('wC', 'Jugend', 'wC'),
      ('wD', 'Jugend', 'wD'),
      ('wE', 'Jugend', 'wE')
  ) as mapping(import_name, category, short_name)
  where lower(team.import_name) = lower(mapping.import_name)
    and team.category = mapping.category
    and team.name is distinct from mapping.short_name;
end;
$$;

commit;
