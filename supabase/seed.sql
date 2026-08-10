-- TVH Helferboard: Vereinsmannschaften und offizielle Helferrollen.
-- Das Skript enthält nur Daten; das Schema kommt aus den Migrationen.

begin;

-- VEREINSMANNSCHAFTEN MIT EINDEUTIGEN EXCEL-IMPORTNAMEN.
insert into public.teams (name, category, import_name)
values
  ('Herren 1', 'Aktive', 'Herren 1'),
  ('Herren 2', 'Aktive', 'Herren 2'),
  ('mD1', 'Jugend', 'mD1'),
  ('mD2', 'Jugend', 'mD2'),
  ('mE', 'Jugend', 'mE'),
  ('wC', 'Jugend', 'wC'),
  ('wD', 'Jugend', 'wD'),
  ('wE', 'Jugend', 'wE')
on conflict (name, category)
do update set
  import_name = excluded.import_name,
  updated_at = now();

-- OFFIZIELLE VEREINSWERTE:
-- Reihenfolge, Bezeichnungen und slots entsprechen dem bestätigten Bedarf.
insert into public.helper_roles (
  name,
  category,
  slots,
  order_index
)
values
  ('Zeitnehmer', 'Aktive', 1, 1),
  ('Sekretär', 'Aktive', 1, 2),
  ('Wischer', 'Aktive', 2, 3),
  ('Verkauf', 'Aktive', 4, 4),
  ('Ordner', 'Aktive', 4, 5),
  ('Zeitnehmer', 'Jugend', 1, 1),
  ('Sekretär', 'Jugend', 1, 2),
  ('Schiri', 'Jugend', 1, 3),
  ('Verkauf', 'Jugend', 2, 4),
  ('Kuchen', 'Jugend', 3, 5),
  ('Brezeln / Sonstiges', 'Jugend', 1, 6),
  ('Trikots', 'Jugend', 1, 7)
on conflict (name, category)
do update set
  slots = excluded.slots,
  order_index = excluded.order_index,
  updated_at = now();

commit;
