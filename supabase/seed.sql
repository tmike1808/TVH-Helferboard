-- TVH Helferboard: anpassbare Beispiel- und Entwicklungsdaten.
-- Vor Ausführung in einem Vereinsprojekt Teamnamen und slots fachlich prüfen.
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

-- VORLÄUFIGE SLOT-WERTE:
-- Der Code benötigt helper_roles.slots als positive Anzahl, konkrete
-- Vereinswerte sind im Repository aber nicht belegt. Deshalb wird für jede
-- Rolle der technische Mindestwert 1 gesetzt. Vor produktiver Nutzung anpassen.
insert into public.helper_roles (
  name,
  category,
  slots,
  order_index
)
values
  ('Zeitnehmer', 'Aktive', 1, 1),
  ('Sekretär', 'Aktive', 1, 2),
  ('Wischer', 'Aktive', 1, 3),
  ('Verkauf', 'Aktive', 1, 4),
  ('Ordner', 'Aktive', 1, 5),
  ('Zeitnehmer', 'Jugend', 1, 1),
  ('Sekretär', 'Jugend', 1, 2),
  ('Schiri', 'Jugend', 1, 3),
  ('Verkauf', 'Jugend', 1, 4),
  ('Kuchen', 'Jugend', 1, 5),
  ('Brezeln', 'Jugend', 1, 6),
  ('Trikots', 'Jugend', 1, 7)
on conflict (name, category)
do update set
  slots = excluded.slots,
  order_index = excluded.order_index,
  updated_at = now();

commit;
