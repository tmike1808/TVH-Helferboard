# DB-0 – Reproduzierbare Supabase-Datenbankgrundlage

Versionierte Basismigration und Seed-Daten für das TVH Helferboard.

Prüfdatum: 27. Juli 2026
Ausgangs-HEAD: `5624894`

## 1. Inventarisierte Datenzugriffe

### `teams`

| Bereich | Tatsächlicher Zugriff |
| --- | --- |
| Lesen | `useDashboardStore.loadData()` verwendet `select('*')`; `gameService.getTeams()` liest `id`, `name`, `category` |
| Schreiben | Kein aktueller Schreibzugriff im Anwendungscode |
| Filter | Im Store Zuordnung über `teams.id === games.team_id`; Teamfilter über `id`; Kategoriefilter über `category` |
| Sortierung | `gameService.getTeams()` sortiert clientseitig nach `name` mit deutscher Locale |
| Beziehungen | `games.team_id` verweist auf `teams.id` |
| Erwartete Typen | `id` stabiler ID-Wert, `name`/`category` Zeichenketten |
| Mögliche Nullwerte im bisherigen Code | `gameService` toleriert fehlende Teamzuordnung als `team: null`; UI besitzt Namens-/Kategorie-Fallbacks. DB-0 verhindert diesen Zustand für neue Daten durch NOT NULL und Fremdschlüssel. |

### `games`

| Bereich | Tatsächlicher Zugriff |
| --- | --- |
| Lesen | Store: `select('*')`; Service: `id`, `team_id`, `start_time`, `opponent`, `is_home` |
| Schreiben | `createGame()` inseriert `team_id`, `start_time`, `opponent`, `is_home`; ungenutzte Exporte `updateGame(id, g)` und `deleteGame(id)` filtern nach `id` |
| Filter | Clientseitig nach Team und Kategorie; Update/Delete über Supabase `.eq('id', id)` |
| Sortierung | `getGames()` sortiert serverseitig aufsteigend nach `start_time`, Nullwerte zuletzt |
| Beziehungen | `team_id` zu `teams.id`; `helper_assignments.game_id` zu `games.id` |
| Erwartete Typen | `id`/`team_id` IDs, `start_time` ISO-kompatibler Zeitpunkt, `opponent` Zeichenkette, `is_home` Boolean |
| Mögliche Nullwerte im bisherigen Code | Tabelle zeigt Fallbacks für fehlenden/ungültigen Zeitpunkt, Gegner, Team und Kategorie. DB-0 definiert alle fachlichen Spielfelder als NOT NULL. |

### `helper_roles`

| Bereich | Tatsächlicher Zugriff |
| --- | --- |
| Lesen | Store verwendet `select('*')` |
| Schreiben | Kein aktueller Schreibzugriff im Anwendungscode |
| Filter | `MatchCard` filtert Rollen clientseitig über `role.category === team.category` |
| Sortierung | Clientseitig aufsteigend nach `order_index` |
| Beziehungen | `helper_assignments.role_id` verweist auf `helper_roles.id`; Kategorie muss zur Kategorie des Spielteams passen |
| Erwartete Typen | `id` ID, `name`/`category` Zeichenketten, `order_index` und `slots` positive Ganzzahlen |
| Mögliche Nullwerte im bisherigen Code | Keine belastbare Nullbehandlung für `slots` oder `order_index`; DB-0 setzt deshalb NOT NULL und positive Checks. |

Das tatsächlich erwartete Mengenfeld heißt `slots`. Ein neues Feld `required_count` wurde nicht eingeführt.

### `helper_assignments`

| Bereich | Tatsächlicher Zugriff |
| --- | --- |
| Lesen | Store und `reloadAssignments()` verwenden `select('*')` |
| Schreiben | `createAssignment()` inseriert `game_id`, `role_id`, `helper_name`; `deleteAssignment(id)` löscht mit `.eq('id', id)` |
| Filter | Clientseitig nach `game_id`, danach nach `role_id`; Löschung nach `id` |
| Sortierung | Keine |
| Beziehungen | `game_id` zu `games.id`, `role_id` zu `helper_roles.id` |
| Erwartete Typen | Drei IDs beziehungsweise ID-Bezüge und `helper_name` als getrimmte Zeichenkette |
| Mögliche Nullwerte im bisherigen Code | Der Client setzt alle drei Insert-Felder. DB-0 macht sie NOT NULL und verhindert leere beziehungsweise nicht getrimmte Namen. |

Die clientseitige Duplikatprüfung vergleicht `helper_name` innerhalb desselben Spiels und derselben Rolle ohne Beachtung der Groß-/Kleinschreibung.

## 2. Festgelegtes Schema mit Feldern und Datentypen

### `teams`

- `id uuid primary key default gen_random_uuid()`
- `name text not null`, getrimmt, 1 bis 120 Zeichen
- `category text not null`, nur `Aktive` oder `Jugend`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`
- eindeutige Kombination aus `name` und `category`
- Index auf `category`

### `games`

- `id uuid primary key default gen_random_uuid()`
- `team_id uuid not null`
- `start_time timestamptz not null`
- `opponent text not null`, getrimmt, 1 bis 120 Zeichen
- `is_home boolean not null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`
- Indizes auf `start_time` und `team_id`

### `helper_roles`

- `id uuid primary key default gen_random_uuid()`
- `name text not null`, getrimmt, 1 bis 80 Zeichen
- `category text not null`, nur `Aktive` oder `Jugend`
- `slots integer not null`, größer als 0
- `order_index integer not null`, größer als 0
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`
- eindeutige Namen und Reihenfolge innerhalb einer Kategorie

### `helper_assignments`

- `id uuid primary key default gen_random_uuid()`
- `game_id uuid not null`
- `role_id uuid not null`
- `helper_name text not null`, getrimmt, 1 bis 100 Zeichen
- `created_at timestamptz not null default now()`
- Indizes auf `game_id` und `role_id`
- eindeutiger Index auf `game_id`, `role_id`, `lower(helper_name)`

Die Zeitstempel `updated_at` werden bei Änderungen an Teams, Spielen und Rollen durch Trigger aktualisiert.

## 3. Beziehungen und Löschregeln

```text
teams
  └── games.team_id
        └── helper_assignments.game_id

helper_roles
  └── helper_assignments.role_id
```

- `games.team_id → teams.id`: `ON UPDATE CASCADE`, `ON DELETE RESTRICT`. Ein Team mit vorhandenen Spielen kann nicht unbemerkt entfernt werden.
- `helper_assignments.game_id → games.id`: `ON UPDATE CASCADE`, `ON DELETE CASCADE`. Beim Löschen eines Spiels werden seine Helferzuordnungen mitgelöscht.
- `helper_assignments.role_id → helper_roles.id`: `ON UPDATE CASCADE`, `ON DELETE RESTRICT`. Eine verwendete Rolle kann nicht gelöscht werden und hinterlässt keine verwaisten Zuordnungen.
- Ein Trigger verhindert, dass eine Helferrolle einer anderen Kategorie als das Spielteam zugeordnet wird.

Die Datenbank verhindert namensgleiche Einträge innerhalb derselben Rolle und desselben Spiels unabhängig von Groß-/Kleinschreibung. Eine Begrenzung konkurrierender Inserts auf `helper_roles.slots` ist noch nicht enthalten.

## 4. RLS- und Sicherheitskonzept

RLS ist für alle vier Tabellen aktiviert. Zuvor werden vorhandene Rechte für `anon` und `authenticated` entzogen und anschließend nur die benötigten MVP-Rechte vergeben.

Erlaubt für `anon` und `authenticated`:

- SELECT auf allen vier Tabellen
- INSERT auf die Spalten `game_id`, `role_id`, `helper_name` von `helper_assignments`
- DELETE auf `helper_assignments`

Nicht erteilt:

- INSERT, UPDATE oder DELETE auf `teams`
- INSERT, UPDATE oder DELETE auf `games`
- INSERT, UPDATE oder DELETE auf `helper_roles`
- UPDATE auf `helper_assignments`

Es existieren keine anonymen Admin-Schreib-Policies. Es wurde kein privilegierter Schlüssel in Frontend, Migration, Seed oder Dokumentation aufgenommen.

Die Insert-Policy für Helferzuordnungen prüft einen getrimmten Namen und eine zum Spiel passende Rollenkategorie. Fremdschlüssel und Trigger sichern denselben Grundvertrag zusätzlich ab.

## 5. Konflikte zwischen aktuellem Frontend und sicherer Datenbank

Sprint 1B ist implementiert, die reale Datenbankabnahme steht aus.

`gameService.createGame()` wird aktuell mit dem öffentlichen Frontend-Client aufgerufen. DB-0 erteilt anonymen Clients absichtlich kein INSERT-Recht und keine INSERT-Policy auf `games`. Der Create-Ablauf wird daher gegen diese sichere Grundlage blockiert, bis ein späterer Sprint Admin-Authentifizierung und darauf begrenzte RLS-Policies einführt.

Der Konflikt wurde nicht durch eine unsichere öffentliche Games-Policy oder einen privilegierten Schlüssel im Browser umgangen.

Weitere Sicherheitsgrenzen:

- Ohne Helferkonten oder Austrage-Token kann die öffentliche Delete-Policy nicht feststellen, wem eine Zuordnung gehört. Jeder Client mit Kenntnis einer sichtbaren ID kann sie löschen.
- Öffentliche Lesbarkeit von `helper_assignments` macht Helfernamen öffentlich sichtbar.
- Der Datenbank-Unique-Index verhindert Duplikate, aber noch keine konkurrierende Überbelegung einer Rolle.

## 6. Seed-Daten

`supabase/seed.sql` enthält vier klar als anpassbar markierte Beispielteams:

- TVH Herren 1
- TVH Damen 1
- TVH Männliche Jugend A
- TVH Weibliche Jugend B

Rollen für `Aktive`:

1. Zeitnehmer
2. Sekretär
3. Wischer
4. Verkauf
5. Ordner

Rollen für `Jugend`:

1. Zeitnehmer
2. Sekretär
3. Schiri
4. Verkauf
5. Kuchen
6. Brezeln
7. Trikots

Der Code benötigt für jede Rolle einen positiven `slots`-Wert. Konkrete Vereinswerte sind nicht belegt; deshalb verwendet der Seed klar als vorläufig markiert den technischen Mindestwert `1`. Vor produktiver Ausführung müssen diese Werte fachlich angepasst werden.

Das Seed-Skript enthält nur Daten und ist über `ON CONFLICT` für eine leere beziehungsweise unverändert erneut geseedete Grundlage wiederholbar.

## 7. Geänderte und neu erstellte Dateien

DB-0 neu:

- `supabase/migrations/20260727000100_initial_schema.sql`
- `supabase/seed.sql`
- `SUPABASE_SETUP.md`
- `reports/DB-0-Supabase-Grundlage.md`

DB-0 aktualisiert:

- `PROJECT.md`
- `ADMIN_IMPLEMENTATION_PLAN.md`
- `CHANGELOG.md`

Bereits vor DB-0 im uncommitteten Sprint-1B-Arbeitsstand vorhanden:

- `.gitignore`
- `.env.example`
- `src/App.jsx`
- `src/components/admin/GameForm.jsx`
- `src/lib/supabase.js`
- `src/pages/AdminGamesPage.jsx`
- `src/services/gameService.js`
- `reports/V24.0.5.1-Sprint-1B.md`

Es wurden keine Anwendungsfunktionen für DB-0 geändert.

## 8. Build-Ergebnis

Ergebnis: erfolgreich, Exit-Code `0`.

```text
> tvh-v24-core-merge-fixed@1.0.0 build
> vite build

vite v5.4.21 building for production...
✓ 1688 modules transformed.
dist/index.html                  0.38 kB │ gzip:   0.27 kB
dist/assets/index-nv1-rYva.css  12.65 kB │ gzip:   3.08 kB
dist/assets/index-CYsWW82Z.js  382.70 kB │ gzip: 108.67 kB
✓ built in 8.25s
```

`dist/` blieb ignoriert.

## 9. `git diff --check`

Ergebnis: erfolgreich, Exit-Code `0`. Es wurden keine Whitespace-Fehler gemeldet. Die Hinweise zur Windows-Zeilenendenkonvertierung sind keine `git diff --check`-Fehler.

Die ergänzenden statischen Prüfungen meldeten:

```text
STATIC_MIGRATION_CHECK=PASS
STATIC_SEED_CHECK=PASS
CREDENTIAL_MATCH_COUNT=0
REAL_URL_MATCH_COUNT=0
```

Geprüft wurden Feldnamen, Tabellenreihenfolge, Fremdschlüssel, Löschregeln, RLS-vor-Policy-Reihenfolge, fehlende Admin-Schreibrechte, beide Rollenfolgen, vorläufige Seed-Markierungen und Zugangsdatenmuster.

## 10. Risiken und offene Entscheidungen

- Die Migration wurde ausschließlich statisch geprüft. `psql`, Supabase CLI und Docker waren lokal nicht verfügbar; es fand keine echte PostgreSQL- oder RLS-Ausführung statt.
- Die Slot-Werte sind vorläufig und müssen fachlich bestätigt werden.
- Admin-Authentifizierung und Admin-RLS-Policies fehlen bewusst.
- Das öffentliche Austragen besitzt noch keinen Eigentumsnachweis.
- Öffentliche Helfernamen benötigen vor dem Deployment eine Datenschutzbewertung.
- Ein serverseitiger Schutz vor Überbelegung ist noch offen.
- Die Kategorie-Checks erlauben derzeit ausschließlich `Aktive` und `Jugend`, passend zum vorhandenen Code und MVP.
- Die Basismigration ist einmalig auszuführen. Spätere Änderungen müssen neue Migrationen verwenden.

## 11. `git status --short`

```text
 M .gitignore
 M ADMIN_IMPLEMENTATION_PLAN.md
 M CHANGELOG.md
 M PROJECT.md
 M src/App.jsx
 M src/components/admin/GameForm.jsx
 M src/lib/supabase.js
 M src/pages/AdminGamesPage.jsx
 M src/services/gameService.js
?? .env.example
?? SUPABASE_SETUP.md
?? reports/DB-0-Supabase-Grundlage.md
?? reports/V24.0.5.1-Sprint-1B.md
?? supabase/
```

## 12. Bestätigung: keine echten Zugangsdaten

Migration, Seed, Setup-Anleitung und Report enthalten keine echten URLs, Schlüssel oder Passwörter. `.env.example` enthält ausschließlich Platzhalter.

## 13. Bestätigung: kein Commit und kein Push

Es wurde kein Commit erstellt und kein Push ausgeführt. Es wurde außerdem keine lokale oder entfernte Datenbank verändert.
