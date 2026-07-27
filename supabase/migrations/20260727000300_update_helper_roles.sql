-- TVH Helferboard: offizielle Helferrollen und Vereinswerte.
-- Diese Migration aktualisiert ausschließlich bereits vorhandene Rollen.

begin;

update public.helper_roles as role
set
  name = role_values.new_name,
  slots = role_values.slots
from (
  values
    ('Aktive', 'Zeitnehmer', 'Zeitnehmer', 1),
    ('Aktive', 'Sekretär', 'Sekretär', 1),
    ('Aktive', 'Wischer', 'Wischer', 2),
    ('Aktive', 'Verkauf', 'Verkauf', 4),
    ('Aktive', 'Ordner', 'Ordner', 4),
    ('Jugend', 'Zeitnehmer', 'Zeitnehmer', 1),
    ('Jugend', 'Sekretär', 'Sekretär', 1),
    ('Jugend', 'Schiri', 'Schiri', 1),
    ('Jugend', 'Verkauf', 'Verkauf', 2),
    ('Jugend', 'Kuchen', 'Kuchen', 3),
    ('Jugend', 'Brezeln', 'Brezeln / Sonstiges', 1),
    ('Jugend', 'Trikots', 'Trikots', 1)
) as role_values(category, current_name, new_name, slots)
where role.category = role_values.category
  and role.name = role_values.current_name;

commit;
