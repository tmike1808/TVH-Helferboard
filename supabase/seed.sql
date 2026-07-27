-- TVH Helferboard: anpassbare Beispielteams und offizielle Helferrollen.
-- Vor Ausführung in einem Vereinsprojekt die Beispielteamnamen prüfen.
-- Das Skript enthält nur Daten; das Schema kommt aus den Migrationen.

begin;

-- ANPASSBARE BEISPIELTEAMS.
insert into public.teams (name, category)
values
  ('TVH Herren 1', 'Aktive'),
  ('TVH Damen 1', 'Aktive'),
  ('TVH Männliche Jugend A', 'Jugend'),
  ('TVH Weibliche Jugend B', 'Jugend')
on conflict (name, category)
do update set
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
