# Supabase-Grundlage einrichten

Diese Anleitung richtet ein neues Supabase-Projekt für das TVH Helferboard ein. In DB-0 wurde kein Remote-Projekt verbunden und kein SQL remote ausgeführt.

Die versionierte Grundlage besteht aus:

- `supabase/migrations/20260727000100_initial_schema.sql`
- `supabase/migrations/20260727000200_admin_auth.sql`
- `supabase/migrations/20260727000300_update_helper_roles.sql`
- `supabase/migrations/20260727000400_add_team_import_name.sql`
- `supabase/migrations/20260727000500_complete_import_teams.sql`
- `supabase/migrations/20260810000100_shorten_team_names.sql`
- `supabase/migrations/20260810000300_add_helper_role_minimum_staff.sql`
- `supabase/migrations/20260819000100_add_active_ticket_desk_role.sql`
- `supabase/seed.sql`

Die erste Migration ist die einmalig auszuführende Basismigration. Die
weiteren Migrationen werden in der Reihenfolge ihres Zeitstempels angewendet.
`seed.sql` ist für eine leere Datenbank wiederholbar und enthält die
bestätigten Vereinsmannschaften, ihre Excel-Importnamen sowie die
Helferrollen mit offiziellen Vereinswerten und Mindestbesetzungen.

## 1. Neues Supabase-Projekt anlegen

1. Im [Supabase-Dashboard](https://supabase.com/dashboard) anmelden.
2. Ein neues Projekt anlegen und Organisation, Projektname, Region sowie ein starkes Datenbankpasswort festlegen.
3. Warten, bis das Projekt vollständig bereitgestellt ist.

Echte Passwörter, URLs und Schlüssel gehören weder in diese Dokumentation noch in Git.

## 2. Migration im SQL Editor ausführen

1. Im neuen Projekt den **SQL Editor** öffnen.
2. **New query** wählen.
3. Den vollständigen Inhalt von `supabase/migrations/20260727000100_initial_schema.sql` einfügen.
4. Vor der Ausführung prüfen, dass das richtige Projekt ausgewählt ist.
5. Die Abfrage genau einmal ausführen.

Die Datei verwendet eine Transaktion. Schlägt eine Anweisung fehl, wird die Basismigration nicht teilweise übernommen. Ein erneutes Ausführen nach erfolgreicher Anwendung ist nicht vorgesehen, weil Tabellen, Trigger und Policies dann bereits existieren. Weitere Schemaänderungen gehören in neue, zeitgestempelte Migrationen.

## 3. Seed-Daten ausführen

1. `supabase/seed.sql` öffnen.
2. Die Vereinsmannschaften und ihre optionalen `import_name`-Werte prüfen.
3. Die vollständigen Rollenbezeichnungen, Reihenfolgen, Slot- und
   `minimum_staff`-Werte gegen die aktuelle Vereinsvorgabe prüfen.
4. Den vollständigen Inhalt in einer neuen SQL-Editor-Abfrage ausführen.

Das Seed-Skript enthält nur Daten und kann wegen `ON CONFLICT` erneut
ausgeführt werden. Es aktualisiert dabei Rollenreihenfolge, Slotwerte und
Mindestbesetzung auf den Inhalt der Datei.

## 4. Mindestbesetzung einrichten

Sprint 7 ergänzt:

- `supabase/migrations/20260810000300_add_helper_role_minimum_staff.sql`

Die Migration fügt `public.helper_roles.minimum_staff` hinzu, setzt zunächst
für alle Rollen `minimum_staff = slots` und reduziert ausschließlich
Aktive/Verkauf sowie Aktive/Ordner bei vier Slots auf drei. Ein Constraint
erzwingt positive Werte bis höchstens `slots`; die Spalte ist final `NOT NULL`.
RLS, Policies und Grants werden nicht verändert.

Dauerhafte Fachregel: `minimum_staff` entscheidet ausschließlich über die
Durchführbarkeit. Die KPI „Offene Dienste“ und der Offenfilter zählen weiterhin
tatsächlich freie Slots bis zur vollständigen Belegung.

### Aktive-Rolle Kasse Eintritt

V24.0.7.6 ergänzt die wiederholbare Datenmigration:

- `supabase/migrations/20260819000100_add_active_ticket_desk_role.sql`

Sie fügt ausschließlich `Aktive / Kasse Eintritt` mit `slots = 2`,
`minimum_staff = 1` und `order_index = 4` hinzu. Verkauf und Ordner erhalten
dadurch die Positionen 5 und 6. Die Migration verwendet keine festen Rollen-
IDs und verändert weder Spiele noch Helferzuordnungen, RLS, Policies oder
Grants. `supabase/seed.sql` enthält denselben Rollenstand für neue Projekte.
Die Migration darf erst nach ausdrücklicher Freigabe remote angewendet werden.

## 5. Excel-Importnamen einrichten

Sprint 2A ergänzt die Migration:

- `supabase/migrations/20260727000400_add_team_import_name.sql`
- `supabase/migrations/20260727000500_complete_import_teams.sql`

Die ersten beiden Migrationen erweitern `public.teams` um das optionale Feld
`import_name` und vervollständigen die acht Vereinsmannschaften. Ein
partieller Unique-Index auf `lower(import_name)` stellt sicher, dass nicht
leere Importnamen unabhängig von Groß-/Kleinschreibung eindeutig sind;
mehrere `NULL`-Werte bleiben erlaubt. Primärschlüssel, RLS-Regeln und Policies
werden nicht verändert.

Die erste Migration setzt für die vier vorhandenen Teams die anhand der
Teamliste und der Beispieldatei eindeutig belegten Zuordnungen. Die zweite
Migration ergänzt ausschließlich die vier noch fehlenden Jugendteams und
wiederholt die bestehenden Importnamen robust ohne hart codierte IDs:

| Excel-Mannschaft | Supabase-Team |
| --- | --- |
| `Herren 1` | `Herren 1` |
| `Herren 2` | `Herren 2` |
| `mD1` | `mD1` |
| `mD2` | `mD2` |
| `mE` | `mE` |
| `wC` | `wC` |
| `wD` | `wD` |
| `wE` | `wE` |

Sprint 4 ergänzt anschließend
`supabase/migrations/20260810000100_shorten_team_names.sql`. Diese
idempotente Datenmigration ordnet die acht Teams robust über das eindeutige
`import_name` und die Kategorie zu und ändert ausschließlich ihren sichtbaren
`name`. Team-IDs, `import_name`, Spielezuordnungen, Helferzuordnungen, Schema,
RLS und Policies bleiben unverändert.

`teams.order_index` existiert weder in der Basismigration noch in der
aktuellen Instanz. Deshalb wird in Sprint 2A kein solches Feld ergänzt oder
mit erfundenen Werten befüllt. `gameService` sortiert Teams weiterhin
alphabetisch nach `name`.

## 6. Project URL und öffentlichen Schlüssel finden

Die Projekt-URL und den clientgeeigneten öffentlichen Schlüssel zeigt Supabase im **Connect**-Dialog. Die Schlüssel sind außerdem unter **Settings → API Keys** verfügbar. Für dieses Frontend wird nur der öffentliche Anon-/Publishable-Schlüssel verwendet.

Geheime oder privilegierte Schlüssel dürfen niemals in den Browser, in `.env.example`, in Screenshots, in Reports oder in Git gelangen. Die offiziellen Supabase-Hinweise zu Schlüsseln stehen unter [Understanding API keys](https://supabase.com/docs/guides/getting-started/api-keys).

## 7. `.env.local` anlegen

Im Projektstamm eine lokale, von Git ignorierte Datei `.env.local` anlegen:

```dotenv
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-or-publishable-key
```

Beide Werte durch die Angaben des eigenen Projekts ersetzen. `.env.local` niemals committen. `.env.example` bleibt eine sichere Vorlage mit Platzhaltern.

Danach den Vite-Entwicklungsserver neu starten, weil Vite Umgebungsvariablen beim Start lädt:

```text
npm run dev
```

## 8. Tabellen und Seed-Daten prüfen

Im Table Editor müssen folgende Tabellen vorhanden sein:

- `teams`
- `games`
- `helper_roles`
- `helper_assignments`

Alternativ im SQL Editor nur lesend prüfen:

```sql
select 'teams' as table_name, count(*) as row_count from public.teams
union all
select 'games', count(*) from public.games
union all
select 'helper_roles', count(*) from public.helper_roles
union all
select 'helper_assignments', count(*) from public.helper_assignments;
```

Die Rollenreihenfolge prüfen:

```sql
select category, name, slots, minimum_staff, order_index
from public.helper_roles
order by category, order_index;
```

Die Importnamen prüfen:

```sql
select name, category, import_name
from public.teams
order by category, name;
```

Aktive Policies prüfen:

```sql
select tablename, policyname, roles, cmd
from pg_policies
where schemaname = 'public'
  and tablename in (
    'teams',
    'games',
    'helper_roles',
    'helper_assignments'
  )
order by tablename, cmd, policyname;
```

## 9. Aktive RLS-Regeln

RLS ist für alle vier Tabellen aktiviert.

Öffentlich erlaubt:

- Lesen von `teams`
- Lesen von `games`
- Lesen von `helper_roles`
- Lesen von `helper_assignments`
- Einfügen in `helper_assignments` mit passenden Spiel-/Rollenkategorien
- Löschen aus `helper_assignments`

Öffentlich nicht erlaubt:

- Einfügen, Ändern oder Löschen in `teams`
- Einfügen, Ändern oder Löschen in `games`
- Einfügen, Ändern oder Löschen in `helper_roles`
- Ändern vorhandener `helper_assignments`

Die RLS- und Grant-Konfiguration folgt der Supabase-Empfehlung, exponierte Tabellen abzusichern und nur benötigte Rechte zu vergeben. Hintergrund: [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security).

## 10. Warum Admin-Schreiboperationen ohne Admin-Anmeldung nicht funktionieren

Die sichere DB-0-Grundlage erteilt anonymen Clients absichtlich kein
Schreibrecht auf `games`. Sprint 1C ergänzt Supabase Auth, `admin_users` und
darauf begrenzte Admin-Policies. Create, Edit und Delete funktionieren deshalb
nur nach erfolgreicher Anmeldung und bestätigter Adminfreigabe.

Ohne Admin-Anmeldung bleiben Spiele-Schreiboperationen erwartungsgemäß durch
RLS blockiert. Dieser Schutz darf nicht durch eine öffentliche Insert-Policy
auf `games` oder durch einen privilegierten Schlüssel im Frontend umgangen
werden. Die Importvorschau aus Sprint 2A liest ausschließlich Teams und Spiele.
Sprint 2B führt Spiele- und freiwillige Alias-Mutationen erst nach bestätigter
Adminanmeldung und ausdrücklicher Importbestätigung aus. Dafür werden
ausschließlich die bereits vorhandenen Sprint-1C-Policies verwendet.

Der Import lädt unmittelbar vor dem Speichern den aktuellen Spielebestand und
prüft Duplikate erneut anhand von `team_id`, `start_time` und normalisiertem
Gegnernamen. Es wurde bewusst keine zusätzliche Unique-Regel auf `games`
eingeführt: Ohne externe fachliche Spiel-ID ist das freie Gegnerfeld keine
zweifelsfrei belastbare Datenbankidentität. Der Single-Flight-Schutz und die
erneute Remote-Prüfung begrenzen das Risiko auf Anwendungsebene.

## 11. Admin-Authentifizierung einrichten

Sprint 1C ergänzt die Migration:

- `supabase/migrations/20260727000200_admin_auth.sql`

Sie legt `public.admin_users` und die RLS-Hilfsfunktion
`public.is_admin()` an. Zusätzlich erlaubt sie Insert, Update und Delete auf
`games`, `teams` und `helper_roles` ausschließlich authentifizierten
Benutzern, deren Auth-User-ID in `admin_users` freigeschaltet ist. Die
öffentlichen Select-Policies und die bestehenden Policies für
`helper_assignments` bleiben unverändert.

### Migration ausführen

1. Im richtigen Supabase-Projekt den **SQL Editor** öffnen.
2. Den vollständigen Inhalt von
   `supabase/migrations/20260727000200_admin_auth.sql` einfügen.
3. Die Abfrage genau einmal ausführen.
4. Prüfen, dass die Tabelle `public.admin_users` und die Funktion
   `public.is_admin()` vorhanden sind.

Es darf keine allgemeine Schreibpolicy für die Rolle `authenticated`
hinzugefügt werden. Die Migration erteilt zwar die erforderlichen
Tabellenrechte an `authenticated`, jede Mutation wird aber zusätzlich durch
eine RLS-Policy mit `public.is_admin()` geschützt.

### Festen Admin-Benutzer anlegen

1. Das Supabase-Dashboard öffnen.
2. **Authentication → Users** öffnen.
3. Einen Benutzer mit E-Mail-Adresse und starkem Passwort anlegen.
4. Die UUID dieses Benutzers kopieren.
5. Im SQL Editor exakt folgende Freischaltung mit der kopierten UUID
   ausführen:

```sql
insert into public.admin_users (user_id)
values ('AUTH-USER-UUID');
```

6. Die Freischaltung prüfen:

```sql
select user_id, created_at
from public.admin_users;
```

Die echte E-Mail-Adresse, UUID und das Passwort gehören weder in diese
Dokumentation noch in Quellcode, Screenshots, Reports oder Git.

### Adminrechte wieder entziehen

```sql
delete from public.admin_users
where user_id = 'AUTH-USER-UUID';
```

Das Löschen aus `admin_users` entzieht nur die Adminrechte. Das zugehörige
Auth-Konto bleibt in **Authentication → Users** bestehen und kann dort bei
Bedarf getrennt verwaltet werden.

## 12. Bekannte MVP-Sicherheitsgrenzen

- Helfer besitzen noch keine Konten oder Austrage-Tokens. Deshalb kann die öffentliche Delete-Policy technisch jede sichtbare Helferzuordnung anhand ihrer ID löschen. Ein späteres Besitz- oder Tokenkonzept sollte dies einschränken.
- `helper_assignments` ist gemäß MVP-Vorgabe öffentlich lesbar; damit sind eingetragene Helfernamen öffentlich. Datenschutz und Namenshinweise müssen vor dem öffentlichen Betrieb fachlich bewertet werden.
- Die Datenbank verhindert namensgleiche Doppeleinträge je Spiel und Rolle ohne Beachtung der Groß-/Kleinschreibung. Sie verhindert noch keine konkurrierende Überbelegung über `helper_roles.slots`.
- Änderungen an offiziellen Rollenbezeichnungen oder Slot-Werten gehören in
  eine neue Datenmigration und gleichzeitig in `supabase/seed.sql`.
