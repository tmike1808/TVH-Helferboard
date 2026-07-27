# TVH Helfer Dashboard

Stand dieser Bestandsaufnahme: 27. Juli 2026. Grundlage sind der Commit `5624894` (`V24.0.5.1 Sprint 1A`), der Arbeitsstand von Sprint 1B und die in DB-0 erstellte, noch nicht remote ausgeführte Supabase-Grundlage.

## 1. Projektziel

Das Projekt soll ein öffentliches Helferboard für den TV Homburg Handball bereitstellen. Helfer sollen sich ohne Benutzerkonto für Aufgaben bei Spielen eintragen und wieder austragen können. Ein Adminbereich soll Spiele verwalten und später Importe ermöglichen. Hauptziel ist eine stabile, öffentlich nutzbare MVP-Version.

Der derzeitige Code bildet dieses Ziel teilweise ab: Das Helfer-Dashboard ist implementiert, benötigt aber eine gültige lokale Supabase-Konfiguration und passende Datenbankregeln. Der Adminbereich ist über die Sidebar erreichbar, zeigt Spiele an und besitzt seit Sprint 1B einen Ablauf zum Anlegen. Bearbeiten und Löschen sind noch nicht implementiert.

## 2. Technischer Ist-Zustand

### Technologien und Versionen

Das Projekt ist eine JavaScript-Single-Page-Anwendung ohne TypeScript und ohne Router. `package.json` deklariert folgende Abhängigkeiten; in `package-lock.json` sind die jeweils rechts genannten Versionen aufgelöst:

| Bereich | Deklaration | Aufgelöste Version |
| --- | --- | --- |
| React | `react ^18.3.1` | `18.3.1` |
| React DOM | `react-dom ^18.3.1` | `18.3.1` |
| Vite | `vite ^5.4.10` | `5.4.21` |
| Vite React Plugin | `@vitejs/plugin-react ^4.3.1` | `4.7.0` |
| Zustand | `zustand ^5.0.5` | `5.0.14` |
| Supabase JavaScript Client | `@supabase/supabase-js ^2.49.8` | `2.110.8` |
| Tailwind CSS | `tailwindcss ^3.4.17` | `3.4.19` |
| PostCSS | `postcss ^8.4.49` | `8.5.23` |
| Autoprefixer | `autoprefixer ^10.4.20` | `10.5.4` |
| Lucide React | `lucide-react ^0.511.0` | `0.511.0` |

Das Lockfile verwendet Lockfile-Version 3. Für die Bestandsprüfung standen Node.js `24.15.0` und npm `11.12.1` zur Verfügung. Das Repository definiert keine unterstützte Node-/npm-Version über `engines`, `.nvmrc` oder eine vergleichbare Datei.

Vorhandene npm-Skripte:

- `npm run dev`: startet Vite.
- `npm run build`: erzeugt den Produktions-Build mit Vite.

Es gibt keine Skripte für Tests, Linting, Formatierung oder Vorschau.

### Einstiegspunkte

1. `index.html` stellt das Element `#root` bereit und lädt `/src/main.jsx`.
2. `src/main.jsx` initialisiert React mit `ReactDOM.createRoot`, aktiviert `React.StrictMode`, lädt die globalen Styles und rendert `App`.
3. `src/App.jsx` lädt beim Mounten die Dashboard-Daten, rendert Sidebar, Topbar, KPIs, Filter und die gefilterten MatchCards.

Es ist kein Client-Router installiert. `App` schaltet für die aktuell zwei benötigten Ansichten über lokalen React-Zustand zwischen Dashboard und `AdminGamesPage` um. Die Adminseite ist damit ohne Browser-Reload über die Sidebar erreichbar, besitzt aber keine eigene URL und ist nach einem Browser-Reload nicht als separate Route wiederherstellbar.

### Aktuelle Verzeichnisstruktur

Abgesehen von `.git/` und dem installierten `node_modules/` besteht das Repository aus:

```text
.
├── .env.example
├── .gitignore
├── ADMIN_IMPLEMENTATION_PLAN.md
├── CHANGELOG.md
├── PROJECT.md
├── README.md
├── README_INSTALLATION.md
├── SUPABASE_SETUP.md
├── docs/
│   └── INSTALLATION.md
├── index.html
├── package.json
├── package-lock.json
├── postcss.config.js
├── reports/
│   ├── V24.0.5.1-Sprint-1A.1.md
│   ├── V24.0.5.1-Sprint-1B.md
│   └── DB-0-Supabase-Grundlage.md
├── supabase/
│   ├── migrations/
│   │   └── 20260727000100_initial_schema.sql
│   └── seed.sql
├── tailwind.config.js
├── vite.config.js
└── src/
    ├── App.jsx
    ├── main.jsx
    ├── components/
    │   ├── FilterBar.jsx
    │   ├── KPISection.jsx
    │   ├── MatchCard.jsx
    │   ├── Sidebar.jsx
    │   ├── Topbar.jsx
    │   └── admin/
    │       ├── DeleteGameDialog.jsx
    │       ├── GameForm.jsx
    │       └── GameTable.jsx
    ├── lib/
    │   └── supabase.js
    ├── pages/
    │   └── AdminGamesPage.jsx
    ├── services/
    │   ├── gameService.js
    │   └── helperService.js
    ├── store/
    │   └── useDashboardStore.js
    └── styles/
        └── globals.css
```

`node_modules/`, `dist/`, lokale `.env`-Varianten und Editor-Dateien werden über `.gitignore` ausgeschlossen. `.env.example` ist ausdrücklich von der allgemeinen `.env.*`-Regel ausgenommen und enthält ausschließlich Platzhalter.

### Zustandsverwaltung

`src/store/useDashboardStore.js` verwendet einen einzelnen Zustand-Store. Er enthält:

- Daten: `games`, `teams`, `roles`, `assignments`
- Filter: `selectedTeam`, `selectedCategory`
- Aktionen: `loadData`, `reloadAssignments`, `setSelectedTeam`, `setSelectedCategory`
- Selektorlogik: `getFilteredGames`

Die Admin-Spieleübersicht verwendet diesen Store bewusst nicht. Sie hält Spiele, Teams, Lade-, Formular-, Speicher- und Meldungszustände lokal in `AdminGamesPage` und lädt beziehungsweise schreibt ausschließlich über `gameService`.

`loadData` liest alle vier Tabellen direkt über den Supabase-Client und speichert die Ergebnisse im Store. Die Abfragen laufen nacheinander. Ladezustände und sichtbare Fehlerzustände werden nicht verwaltet. Erfolgreiche `data: null`-Antworten werden auf leere Arrays normalisiert. Bei Supabase-Fehlern bleiben die zuletzt gültigen Store-Daten erhalten und technische Details werden protokolliert; eine sichtbare Dashboard-Fehlermeldung gibt es weiterhin nicht. Unerwartete Promise-Fehler aus `loadData()` werden in `App` abgefangen.

Die Spielfilterung ordnet Spiele über `games.team_id = teams.id` einem Team zu. Der Teamfilter vergleicht die ausgewählte Select-Zeichenkette mit `team.id`; falls die Datenbank numerische IDs liefert, kann der strikte Vergleich fehlschlagen. Der Kategoriefilter vergleicht `team.category` mit `Aktive` oder `Jugend`.

### Supabase-Anbindung

`src/lib/supabase.js` erzeugt einen Client mit `createClient` und liest die lokale Konfiguration ausschließlich aus den Vite-Umgebungsvariablen `VITE_SUPABASE_URL` und `VITE_SUPABASE_ANON_KEY`. `.env.example` dokumentiert beide Namen mit Platzhalterwerten. Lokale Werte gehören in die ignorierte `.env.local`. Fehlen Werte, wird eine verständliche Konsolenwarnung ausgegeben und ein nicht produktiver Fallback verwendet, damit die Oberfläche ihren behandelten Ladefehler anzeigen kann.

Damit ist das Repository ohne lokale Konfiguration nicht gegen ein echtes Supabase-Projekt lauffähig. Seit DB-0 existieren eine versionierte initiale Migration, reproduzierbare Seed-Daten und dokumentierte Row-Level-Security-Policies. Sie wurden in dieser Aufgabe ausschließlich statisch geprüft und noch auf keine lokale oder entfernte Datenbank angewendet.

Der Dashboard-Store greift direkt auf Supabase zu. Für Helferzuordnungen und Spiele existieren zusätzlich Services. Authentifizierung oder Autorisierung ist im Frontend nicht implementiert. Die DB-0-Migration erlaubt öffentliches Lesen sowie Insert und Delete für `helper_assignments`, aber keine anonymen Admin-Schreibzugriffe auf `teams`, `games` oder `helper_roles`. Deshalb ist Sprint 1B implementiert, die reale Datenbankabnahme steht jedoch aus und `gameService.createGame()` wird an der sicheren RLS-Grundlage ohne spätere Admin-Authentifizierung erwartungsgemäß scheitern.

### Services

`src/services/helperService.js`:

- `createAssignment(payload)`: fügt einen Eintrag in `helper_assignments` ein.
- `deleteAssignment(id)`: löscht einen Eintrag über dessen `id`.
- Beide Funktionen protokollieren Supabase-Fehler und liefern dann `false`, werfen den Fehler aber nicht weiter.

`src/services/gameService.js`:

- `getGames()`: lädt die im Dashboard nachweislich verwendeten Spielfelder sowie `id`, `name` und `category` der Teams, ordnet Teams über `team_id` zu und sortiert Spiele aufsteigend nach `start_time`.
- `getTeams()`: lädt `id`, `name` und `category` der verfügbaren Mannschaften und sortiert sie für das Formular nach Namen.
- `createGame(g)`: begrenzt den Schreib-Payload auf `team_id`, `start_time`, `opponent` und `is_home`, legt genau diesen Datensatz an und wirft einen Supabase-Fehler an die Seite weiter. Der anschließend sichtbare Datensatz wird über `getGames()` neu gelesen.
- `updateGame(id, g)`: aktualisiert ein Spiel anhand von `id`.
- `deleteGame(id)`: löscht ein Spiel anhand von `id`.

`getGames()`, `getTeams()` und `createGame()` werden von `AdminGamesPage` verwendet und werfen Supabase-Fehler an die Seite weiter. `updateGame()` und `deleteGame()` bleiben ungenutzt. Für Lese- und Schreibzugriff gilt `start_time` als kanonisches Zeitfeld.

### Seiten und Komponenten

- `App`: Anwendungsshell, interne Umschaltung zwischen Dashboard und Admin-Spieleübersicht sowie erneutes Laden der Dashboard-Daten bei jedem Öffnen des Dashboards.
- `Sidebar`: Navigation zwischen Dashboard und „Spiele verwalten“ mit sichtbarem Aktivzustand; noch nicht implementierte Ziele sind deaktiviert.
- `Topbar`: konfigurierbare Überschrift und Untertitel mit den bisherigen Dashboard-Texten als Standard.
- `KPISection`: zeigt Heimspiele, offene Dienste, Helfereinträge und Mannschaften für die aktuelle Filterung.
- `FilterBar`: Team- und Kategoriefilter.
- `MatchCard`: aufklappbare Spielkarte, dynamische Rollenanzeige sowie Ein- und Austragen von Helfern.
- `AdminGamesPage`: erreichbare Spieleverwaltung mit lokalem Lade-, Fehler-, Leer-, Formular-, Speicher- und Meldungszustand; orchestriert Lesen und Anlegen über `gameService`.
- `GameTable`: responsive Desktop-Tabelle und mobile Listenansicht für Datum, Uhrzeit, Heimteam, Gastteam und Kategorie.
- `GameForm`: kontrolliertes, beschriftetes Create-Formular mit Datum, Uhrzeit, Heim-/Auswärtswahl, TVH-Team-Auswahl, Gegnername, Validierung, Ladezustand und Abbrechen.
- `DeleteGameDialog`: leerer Platzhalter, der `null` zurückgibt.

### Aktuell implementierte Funktionen

- Laden von Spielen, Teams, Helferrollen und Helferzuordnungen aus Supabase.
- Anzeige und Aufklappen von MatchCards.
- Teamfilter und Kategoriefilter.
- KPI-Anzeige auf Basis der aktuell gefilterten Spiele.
- Dynamisches Laden der Rollen passend zur Teamkategorie.
- Sortierung der Rollen nach `order_index`.
- Berechnung der benötigten Plätze aus der Summe von `helper_roles.slots`.
- Orange Statusdarstellung bei offenen Plätzen und grüne Statusdarstellung bei vollständiger Besetzung.
- Eintragen eines getrimmten Helfernamens in eine noch offene Rolle.
- Clientseitiges Verhindern eines namensgleichen Doppeleintrags innerhalb derselben Rolle und desselben Spiels, ohne Beachtung der Groß-/Kleinschreibung.
- Austragen über das Löschen einer Helferzuordnung.
- Neuladen aller Helferzuordnungen nach Einfügen oder Löschen.
- Reload-freier Wechsel zwischen Dashboard und Admin-Spieleübersicht.
- Rein lesendes Laden der Spiele und zugehörigen Teamdaten über `gameService`.
- Nach `start_time` sortierte, deutsch formatierte Spieleübersicht mit Lade-, Fehler- und Leerzustand.
- Öffnen und Abbrechen eines zurückgesetzten Create-Formulars.
- Laden der TVH-Mannschaften aus `teams` und Anzeige lesbarer Namen im Auswahlfeld.
- Validierung von Datum, Uhrzeit, TVH-Mannschaft, Gegner und unterschiedlichen Heim-/Gastmannschaften.
- Erzeugen eines eindeutigen ISO-Zeitwerts aus lokal erfasstem Datum und lokaler Uhrzeit.
- Anlegen über `gameService.createGame()` mit sichtbarem Lade-, Erfolgs- und Fehlerzustand sowie synchronem Doppelklickschutz.
- Neuladen und sortierte Darstellung der Adminliste nach erfolgreichem Anlegen.
- Erneutes Laden aller Dashboard-Daten beim nächsten Öffnen des Dashboards.

Diese Funktionen sind im Code vorhanden. Sprint 1B ist implementiert, die reale Datenbankabnahme steht aus. Die DB-0-Migration wurde nicht remote ausgeführt; insbesondere sind RLS-Verhalten und der erfolgreiche Admin-Schreibvorgang gegen ein echtes Projekt nicht end-to-end nachgewiesen.

### Platzhalter, unvollständige Funktionen und bekannte Abweichungen

- Ohne lokale Umgebungsvariablen ist keine echte Supabase-Verbindung vorhanden.
- Die sichere DB-0-RLS-Grundlage blockiert anonyme Inserts in `games`; der Sprint-1B-Create-Pfad benötigt vor der realen Abnahme eine Admin-Authentifizierung und darauf begrenzte Policies.
- Der Adminbereich kann lesen und anlegen; Update und Delete fehlen.
- `DeleteGameDialog` ist weiterhin ein Platzhalter.
- Kalender, Helferansicht, Teams und Kalenderimport sind deaktiviert und haben keine Funktion.
- Es gibt keine URL-basierte Navigation; die aktuelle Seite wird nur im lokalen Zustand von `App` gehalten.
- Spiele-CRUD besitzt einen eingebundenen Create-Pfad; Bearbeitungsformular und Löschbestätigung fehlen.
- Es gibt keinen Excel-Import und keinen handball.net-Import.
- Die KPI „Offene Dienste“ rechnet pauschal mit zehn Plätzen pro Spiel, nicht mit den dynamischen Rollen und deren `slots`.
- Die MatchCard ermittelt „vollständig besetzt“ anhand der Gesamtzahl aller Spielzuordnungen. Zuordnungen zu nicht passenden Rollen können den Status verfälschen.
- Fehler aus `helperService` werden in `MatchCard` nicht anhand des Rückgabewerts ausgewertet. Ein fehlgeschlagenes Einfügen kann daher trotzdem das Eingabefeld leeren; ein verständlicher Fehler wird nicht zuverlässig angezeigt.
- Beim Austragen gibt es keine Bestätigung und keinen Besitznachweis. Die DB-0-Policy muss deshalb für die öffentliche Austragefunktion derzeit das Löschen jeder sichtbaren Zuordnung anhand ihrer ID erlauben.
- Die DB-0-Migration verhindert namensgleiche Doppeleinträge je Spiel und Rolle ohne Beachtung der Groß-/Kleinschreibung. Eine konkurrierende Überbuchung über `helper_roles.slots` wird weiterhin nicht serverseitig verhindert.
- Das Dashboard besitzt weiterhin keine eigene Lade-, Leer-, Netzwerkfehler- oder Wiederholungsansicht; die Admin-Spieleübersicht behandelt Laden, Fehler und leere Daten.
- Es gibt keine automatisierten Tests und kein Testskript.
- Es gibt keine Deployment-Konfiguration im Repository.

Das `CHANGELOG.md` nennt für `STABILIZATION_01` Rollensortierung, Trimmen von Namen, Verhindern doppelter Einträge und Fehlerbehandlung, für `V24.0.5` die vorbereitete Admin-Grundstruktur, für Sprint 1A die interne Navigation und Leseansicht sowie für Sprint 1B den Create-Ablauf. Read und Create sind implementiert; Update und Delete bleiben offen.

## 3. Datenmodell

Die folgenden Angaben beschreiben die mit dem Code kompatible DB-0-Migration. Diese Definitionen sind versioniert, wurden aber noch nicht gegen eine echte Supabase-Instanz ausgeführt.

### `teams`

| Feld | Verwendung im Code | Definition in DB-0 |
| --- | --- | --- |
| `id` | Identifikation, Zuordnung über `games.team_id`, Wert des Teamfilters | `uuid`, Primärschlüssel, Default `gen_random_uuid()` |
| `name` | Anzeigename in Filter und MatchCard | `text not null`, getrimmt, Länge 1–120 |
| `category` | Filterung und Auswahl der Rollen; erwartet werden `Aktive` oder `Jugend` | `text not null`, Check auf `Aktive`/`Jugend` |
| `created_at`, `updated_at` | Derzeit nicht vom Frontend gelesen | `timestamptz not null`, Default `now()`; Update-Trigger |

### `games`

| Feld | Verwendung im Code | Definition in DB-0 |
| --- | --- | --- |
| `id` | React-Key, Zuordnung von Helfern, Ziel für Update und Delete | `uuid`, Primärschlüssel, Default `gen_random_uuid()` |
| `team_id` | Zuordnung zu `teams.id` | `uuid not null`, Fremdschlüssel, `ON DELETE RESTRICT` |
| `start_time` | Datumsausgabe und Sortierung | `timestamptz not null`, indexiert |
| `opponent` | Gegnername in der MatchCard | `text not null`, getrimmt, Länge 1–120 |
| `is_home` | Zählung der Heimspiele in den KPIs | `boolean not null` |
| `created_at`, `updated_at` | Derzeit nicht vom Frontend gelesen | `timestamptz not null`, Default `now()`; Update-Trigger |

`createGame` schreibt ausschließlich die vier belegten Felder. `updateGame` übernimmt weiterhin beliebige Objektfelder, ist aber nicht in die Oberfläche eingebunden. Daraus lassen sich keine weiteren verlässlichen Spalten ableiten.

### `helper_roles`

| Feld | Verwendung im Code | Definition in DB-0 |
| --- | --- | --- |
| `id` | React-Key und Zuordnung über `helper_assignments.role_id` | `uuid`, Primärschlüssel, Default `gen_random_uuid()` |
| `name` | Rollenbezeichnung | `text not null`, getrimmt, Länge 1–80 |
| `category` | Zuordnung zu einer Teamkategorie | `text not null`, Check auf `Aktive`/`Jugend` |
| `order_index` | aufsteigende Sortierung der Rollen | `integer not null`, positiv, je Kategorie eindeutig |
| `slots` | benötigte Anzahl und Offen-/Voll-Berechnung | `integer not null`, größer als 0 |
| `created_at`, `updated_at` | Derzeit nicht vom Frontend gelesen | `timestamptz not null`, Default `now()`; Update-Trigger |

### `helper_assignments`

| Feld | Verwendung im Code | Definition in DB-0 |
| --- | --- | --- |
| `id` | React-Key und Ziel des Löschvorgangs | `uuid`, Primärschlüssel, Default `gen_random_uuid()` |
| `game_id` | Zuordnung zu einem Spiel | `uuid not null`, Fremdschlüssel, `ON DELETE CASCADE` |
| `role_id` | Zuordnung zu einer Helferrolle | `uuid not null`, Fremdschlüssel, `ON DELETE RESTRICT` |
| `helper_name` | Anzeigename, Trimmen und Prüfung auf namensgleiche Doppeleinträge | `text not null`, getrimmt, Länge 1–100 |
| `created_at` | Derzeit nicht vom Frontend gelesen | `timestamptz not null`, Default `now()` |

DB-0 ergänzt einen eindeutigen Index auf `game_id`, `role_id` und `lower(helper_name)` sowie einen Trigger, der nur Rollen aus der Kategorie des Spielteams zulässt. Ein serverseitiger Schutz vor Überbuchung anhand von `slots` ist noch nicht enthalten.

## 4. Fachliche Regeln

- Rollen werden dynamisch aus `helper_roles` geladen.
- Rollen werden innerhalb der Kategorie aufsteigend nach `order_index` sortiert.
- Die fachlich vorgesehene Reihenfolge für **Aktive** ist:
  1. Zeitnehmer
  2. Sekretär
  3. Wischer
  4. Verkauf
  5. Ordner
- Die fachlich vorgesehene Reihenfolge für **Jugend** ist:
  1. Zeitnehmer
  2. Sekretär
  3. Schiri
  4. Verkauf
  5. Kuchen
  6. Brezeln
  7. Trikots
- Orange bedeutet: Es sind noch Helferplätze offen.
- Grün bedeutet: Alle benötigten Helferplätze sind besetzt.

Die Farblogik und Sortierung sind im Code umgesetzt. DB-0 enthält beide Rollenlisten mit den verbindlichen `order_index`-Werten. Weil konkrete Vereinsbedarfe weiterhin nicht belegt sind, setzt der Seed alle `slots` deutlich als vorläufig markiert auf den technischen Mindestwert `1`.

## 5. Eingefrorener MVP-Umfang

- Dashboard mit Spielen.
- KPIs.
- Teamfilter.
- Kategoriefilter.
- Aufklappbare MatchCards.
- Helfer eintragen.
- Helfer austragen.
- Dynamische Rollen.
- Spiele im Adminbereich anzeigen.
- Spiele anlegen.
- Spiele bearbeiten.
- Spiele löschen.
- Excel-Import nach Fertigstellung des Spiele-CRUD.
- Öffentliches Deployment.

Die Liste beschreibt den eingefrorenen Zielumfang. Im Ist-Zustand sind Dashboard, KPIs, Filter, MatchCards, dynamische Rollen, Helferaktionen sowie Lesen und Anlegen in der Admin-Spieleübersicht implementiert. Bearbeiten, Löschen, Excel-Import und öffentliches Deployment sind noch nicht fertiggestellt.

## 6. Nicht Teil des aktuellen MVP

- handball.net-Import.
- Benachrichtigungen.
- Saisonverwaltung.
- Benutzerkonten für Helfer.
- Komplexe Rechteverwaltung.
- Statistiken und Historie.
- Exporte.

## 7. Entwicklungsregeln

- Bestehende Architektur und Gestaltung weiterverwenden.
- Keine Platzhalter in als fertig bezeichneten Funktionen.
- Keine unnötigen neuen Abhängigkeiten.
- Keine Zugangsdaten oder `.env`-Inhalte committen.
- Supabase-Zugriffe ausschließlich über klar benannte Services oder vorhandene Datenzugriffsschichten.
- Formulare müssen validieren und verständliche Fehler anzeigen.
- Bestehende Funktionen dürfen nicht ohne ausdrückliche Anforderung entfernt werden.
- Jede Version muss das `CHANGELOG.md` aktualisieren.
- Jede Aufgabe endet mit einer Prüfung des Produktions-Builds.

## 8. Definition of Done

Eine Aufgabe gilt nur als fertig, wenn:

- alle Anforderungen umgesetzt sind,
- keine Platzhalter mehr enthalten sind,
- `npm install` beziehungsweise `npm ci` ohne relevante Fehler möglich ist,
- `npm run build` erfolgreich durchläuft,
- vorhandene Tests ausgeführt wurden,
- neue offensichtliche Fehler behandelt werden,
- `CHANGELOG.md` aktualisiert wurde,
- `git status` geprüft wurde,
- eine klare Zusammenfassung aller geänderten Dateien und Prüfergebnisse vorliegt.

Im aktuellen Repository existieren keine automatisierten Tests und kein Testskript. Bis Tests ergänzt werden, ist dieser Prüfschritt ausdrücklich als „keine Tests vorhanden“ zu dokumentieren und darf nicht als ausgeführte Testabdeckung dargestellt werden.

## 9. Versionsplan

- **V24.0.5:** vorhandene Ausgangsversion. Admin-Grundstruktur und Spiele-Service sind vorbereitet; ein funktionaler Adminbereich fehlt.
- **V24.0.5.1:** Adminbereich für Spiele; Sprint 1A mit Navigation und Leseansicht sowie Sprint 1B mit Create sind umgesetzt. DB-0 liefert die versionierte, noch nicht angewendete Datenbankgrundlage. Die reale Datenbankabnahme sowie Update und Delete stehen noch aus.
- **V24.0.6:** Excel-Import nach Fertigstellung des Spiele-CRUD.
- **V24.0.7:** handball.net-Import; nicht Teil des aktuellen MVP.
