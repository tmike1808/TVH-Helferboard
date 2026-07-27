# TVH Helfer Dashboard

Stand dieser Bestandsaufnahme: 27. Juli 2026. Grundlage sind der Commit `51bd47d` (`Version 24.0.5`) sowie alle zu diesem Zeitpunkt vorhandenen Projektdateien. Aussagen zum Datenbankschema sind auf die im Code sichtbaren Zugriffe begrenzt, da das Repository weder SQL-Migrationen noch ein Schema oder Seed-Daten enthält.

## 1. Projektziel

Das Projekt soll ein öffentliches Helferboard für den TV Homburg Handball bereitstellen. Helfer sollen sich ohne Benutzerkonto für Aufgaben bei Spielen eintragen und wieder austragen können. Ein Adminbereich soll Spiele verwalten und später Importe ermöglichen. Hauptziel ist eine stabile, öffentlich nutzbare MVP-Version.

Der derzeitige Code bildet dieses Ziel teilweise ab: Das Helfer-Dashboard ist implementiert, benötigt aber eine gültige Supabase-Konfiguration und passende Datenbankregeln. Der Adminbereich ist über die Sidebar erreichbar und bietet eine rein lesende Spieleübersicht; Anlegen, Bearbeiten und Löschen sind noch nicht implementiert.

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
├── CHANGELOG.md
├── README.md
├── README_INSTALLATION.md
├── docs/
│   └── INSTALLATION.md
├── index.html
├── package.json
├── package-lock.json
├── postcss.config.js
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

Besonderheit des Ist-Zustands: Es gibt keine `.gitignore`, und `node_modules/` ist mit 7.757 Dateien in Git versioniert.

### Zustandsverwaltung

`src/store/useDashboardStore.js` verwendet einen einzelnen Zustand-Store. Er enthält:

- Daten: `games`, `teams`, `roles`, `assignments`
- Filter: `selectedTeam`, `selectedCategory`
- Aktionen: `loadData`, `reloadAssignments`, `setSelectedTeam`, `setSelectedCategory`
- Selektorlogik: `getFilteredGames`

Die Admin-Spieleübersicht verwendet diesen Store bewusst nicht. Sie hält Spiele, Ladezustand und Fehler lokal in `AdminGamesPage` und lädt ausschließlich über `gameService`.

`loadData` liest alle vier Tabellen direkt über den Supabase-Client und speichert die Ergebnisse im Store. Die Abfragen laufen nacheinander. Ladezustände und sichtbare Fehlerzustände werden nicht verwaltet. Erfolgreiche `data: null`-Antworten werden auf leere Arrays normalisiert. Bei Supabase-Fehlern bleiben die zuletzt gültigen Store-Daten erhalten und technische Details werden protokolliert; eine sichtbare Dashboard-Fehlermeldung gibt es weiterhin nicht. Unerwartete Promise-Fehler aus `loadData()` werden in `App` abgefangen.

Die Spielfilterung ordnet Spiele über `games.team_id = teams.id` einem Team zu. Der Teamfilter vergleicht die ausgewählte Select-Zeichenkette mit `team.id`; falls die Datenbank numerische IDs liefert, kann der strikte Vergleich fehlschlagen. Der Kategoriefilter vergleicht `team.category` mit `Aktive` oder `Jugend`.

### Supabase-Anbindung

`src/lib/supabase.js` erzeugt einen Client mit `createClient`. URL und Anon-Key sind dort fest eingetragene Platzhalter:

- `https://YOUR_PROJECT.supabase.co`
- `YOUR_ANON_KEY`

Damit ist das Repository ohne manuelle Konfiguration nicht gegen ein echtes Supabase-Projekt lauffähig. Umgebungsvariablen werden derzeit nicht verwendet. Es existieren keine `.env`-Dateien, keine Migrationen, keine Schema-Dateien, keine Seed-Daten und keine dokumentierten Row-Level-Security-Policies.

Der Dashboard-Store greift direkt auf Supabase zu. Für Helferzuordnungen und Spiele existieren zusätzlich Services. Authentifizierung oder Autorisierung ist im Frontend nicht implementiert. Ob anonyme Lese-, Einfüge-, Änderungs- oder Löschzugriffe serverseitig erlaubt und sicher eingeschränkt sind, lässt sich aus diesem Repository nicht feststellen.

### Services

`src/services/helperService.js`:

- `createAssignment(payload)`: fügt einen Eintrag in `helper_assignments` ein.
- `deleteAssignment(id)`: löscht einen Eintrag über dessen `id`.
- Beide Funktionen protokollieren Supabase-Fehler und liefern dann `false`, werfen den Fehler aber nicht weiter.

`src/services/gameService.js`:

- `getGames()`: lädt die im Dashboard nachweislich verwendeten Spielfelder sowie `id`, `name` und `category` der Teams, ordnet Teams über `team_id` zu und sortiert Spiele aufsteigend nach `start_time`.
- `createGame(g)`: legt ein Spiel mit dem übergebenen Objekt an.
- `updateGame(id, g)`: aktualisiert ein Spiel anhand von `id`.
- `deleteGame(id)`: löscht ein Spiel anhand von `id`.

`getGames()` wird von `AdminGamesPage` verwendet und wirft Supabase-Fehler an die Seite weiter. Die drei Schreibfunktionen sind weiterhin nicht eingebunden. Für den Lesezugriff gilt `start_time` als kanonisches Feld, weil dieses Feld bereits von `MatchCard` verwendet wird; `date` war außerhalb der früheren Service-Sortierung nicht belegt.

### Seiten und Komponenten

- `App`: Anwendungsshell, initialer Dashboard-Datenlader und interne Umschaltung zwischen Dashboard und Admin-Spieleübersicht.
- `Sidebar`: Navigation zwischen Dashboard und „Spiele verwalten“ mit sichtbarem Aktivzustand; noch nicht implementierte Ziele sind deaktiviert.
- `Topbar`: konfigurierbare Überschrift und Untertitel mit den bisherigen Dashboard-Texten als Standard.
- `KPISection`: zeigt Heimspiele, offene Dienste, Helfereinträge und Mannschaften für die aktuelle Filterung.
- `FilterBar`: Team- und Kategoriefilter.
- `MatchCard`: aufklappbare Spielkarte, dynamische Rollenanzeige sowie Ein- und Austragen von Helfern.
- `AdminGamesPage`: erreichbare, rein lesende Seite mit lokalem Lade-, Fehler-, Leer- und Datenzustand.
- `GameTable`: responsive Desktop-Tabelle und mobile Listenansicht für Datum, Uhrzeit, Heimteam, Gastteam und Kategorie.
- `GameForm`: Platzhalter, der nur „GameForm“ ausgibt.
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
- Vorbereitete, aber nicht verwendete Servicefunktionen für Create, Update und Delete.

Diese Funktionen sind im Code vorhanden. Ihre tatsächliche End-to-End-Funktion ist mit den eingecheckten Supabase-Platzhaltern nicht nachweisbar.

### Platzhalter, unvollständige Funktionen und bekannte Abweichungen

- Der Supabase-Endpunkt und Anon-Key sind Platzhalter.
- Der Adminbereich ist nur lesend; Create, Update und Delete fehlen.
- `GameForm` und `DeleteGameDialog` sind weiterhin Platzhalter.
- Kalender, Helferansicht, Teams und Kalenderimport sind deaktiviert und haben keine Funktion.
- Es gibt keine URL-basierte Navigation; die aktuelle Seite wird nur im lokalen Zustand von `App` gehalten.
- Spiele-CRUD besitzt nur nicht eingebundene Schreibfunktionen; Formulare, Validierung und Löschbestätigung fehlen.
- Es gibt keinen Excel-Import und keinen handball.net-Import.
- Die KPI „Offene Dienste“ rechnet pauschal mit zehn Plätzen pro Spiel, nicht mit den dynamischen Rollen und deren `slots`.
- Die MatchCard ermittelt „vollständig besetzt“ anhand der Gesamtzahl aller Spielzuordnungen. Zuordnungen zu nicht passenden Rollen können den Status verfälschen.
- Fehler aus `helperService` werden in `MatchCard` nicht anhand des Rückgabewerts ausgewertet. Ein fehlgeschlagenes Einfügen kann daher trotzdem das Eingabefeld leeren; ein verständlicher Fehler wird nicht zuverlässig angezeigt.
- Beim Austragen gibt es keine Bestätigung und keinen Besitznachweis. Die Sicherheit hängt vollständig von nicht dokumentierten Supabase-Regeln ab.
- Clientseitige Prüfungen verhindern keine konkurrierenden Überbuchungen oder Doppeleinträge. Datenbank-Constraints sind nicht dokumentiert.
- Das Dashboard besitzt weiterhin keine eigene Lade-, Leer-, Netzwerkfehler- oder Wiederholungsansicht; die Admin-Spieleübersicht behandelt Laden, Fehler und leere Daten.
- Es gibt keine automatisierten Tests und kein Testskript.
- Es gibt keine Deployment-Konfiguration im Repository.

Das `CHANGELOG.md` nennt für `STABILIZATION_01` Rollensortierung, Trimmen von Namen, Verhindern doppelter Einträge und Fehlerbehandlung, für `V24.0.5` die vorbereitete Admin-Grundstruktur und für `V24.0.5.1 – Sprint 1A` die interne Navigation sowie die lesende Admin-Spieleübersicht. Der Admin-Lesepfad ist implementiert; der Spiele-CRUD bleibt offen.

## 3. Datenmodell

Die folgenden Angaben beschreiben ausschließlich im Code gelesene oder geschriebene Felder. Datentypen, Nullbarkeit, Defaultwerte, Primär- und Fremdschlüssel, Unique- und Check-Constraints, Indizes, Löschregeln, Trigger sowie RLS-Policies sind im Repository nicht definiert und daher nicht eindeutig ermittelbar.

### `teams`

| Feld | Verwendung im Code | Nicht eindeutig ermittelbar |
| --- | --- | --- |
| `id` | Identifikation, Zuordnung über `games.team_id`, Wert des Teamfilters | Typ, Primärschlüsseldefinition |
| `name` | Anzeigename in Filter und MatchCard | Typ, Pflichtfeld, Eindeutigkeit |
| `category` | Filterung und Auswahl der Rollen; erwartet werden `Aktive` oder `Jugend` | Typ, erlaubte Werte, Pflichtfeld |

### `games`

| Feld | Verwendung im Code | Nicht eindeutig ermittelbar |
| --- | --- | --- |
| `id` | React-Key, Zuordnung von Helfern, Ziel für Update und Delete | Typ, Primärschlüsseldefinition |
| `team_id` | Zuordnung zu `teams.id` | Typ, Fremdschlüssel und Löschregel |
| `start_time` | Datumsausgabe in der MatchCard | Typ, Zeitzone, Pflichtfeld |
| `opponent` | Gegnername in der MatchCard | Typ, Pflichtfeld |
| `is_home` | Zählung der Heimspiele in den KPIs | Typ, Defaultwert, Pflichtfeld |

`createGame` und `updateGame` übernehmen beliebige Objektfelder. Daraus lassen sich keine weiteren verlässlichen Spalten ableiten.

### `helper_roles`

| Feld | Verwendung im Code | Nicht eindeutig ermittelbar |
| --- | --- | --- |
| `id` | React-Key und Zuordnung über `helper_assignments.role_id` | Typ, Primärschlüsseldefinition |
| `name` | Rollenbezeichnung | Typ, Pflichtfeld, Eindeutigkeit |
| `category` | Zuordnung zu einer Teamkategorie | Typ, erlaubte Werte, Pflichtfeld |
| `order_index` | aufsteigende Sortierung der Rollen | Typ, Defaultwert, Eindeutigkeit innerhalb einer Kategorie |
| `slots` | benötigte Anzahl und Offen-/Voll-Berechnung | Typ, Mindestwert, Pflichtfeld |

### `helper_assignments`

| Feld | Verwendung im Code | Nicht eindeutig ermittelbar |
| --- | --- | --- |
| `id` | React-Key und Ziel des Löschvorgangs | Typ, Primärschlüsseldefinition |
| `game_id` | Zuordnung zu einem Spiel | Typ, Fremdschlüssel und Löschregel |
| `role_id` | Zuordnung zu einer Helferrolle | Typ, Fremdschlüssel und Löschregel |
| `helper_name` | Anzeigename, Trimmen und Prüfung auf namensgleiche Doppeleinträge | Typ, Längenlimit, Pflichtfeld, serverseitige Normalisierung |

Nicht aus dem Repository belegbar sind insbesondere ein serverseitiger Schutz vor Überbuchung, ein Unique-Constraint gegen Doppeleinträge und eine Regel, die nur zum Spiel beziehungsweise zur Teamkategorie passende Rollen zulässt.

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

Die Farblogik und Sortierung sind im Code umgesetzt. Die konkreten Rollennamen, Kategorien, `order_index`-Werte und Platzanzahlen liegen ausschließlich in der nicht mitgelieferten Datenbank. Die beiden Rollenlisten können deshalb im Repository nicht gegen Seed-Daten verifiziert werden und sind als verbindliche fachliche Soll-Konfiguration zu behandeln.

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

Die Liste beschreibt den eingefrorenen Zielumfang. Im Ist-Zustand sind Dashboard, KPIs, Filter, MatchCards, dynamische Rollen, Helferaktionen und die lesende Admin-Spieleübersicht implementiert. Admin-Schreibfunktionen, Excel-Import und öffentliches Deployment sind noch nicht fertiggestellt.

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
- **V24.0.5.1:** Adminbereich für Spiele; Sprint 1A mit Navigation und Leseansicht ist umgesetzt, Create, Update und Delete stehen noch aus.
- **V24.0.6:** Excel-Import nach Fertigstellung des Spiele-CRUD.
- **V24.0.7:** handball.net-Import; nicht Teil des aktuellen MVP.
