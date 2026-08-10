# TVH Helfer Dashboard

Stand dieser Bestandsaufnahme: 10. August 2026. Grundlage ist der Commit
`a22d275` (`V24.0.6.0 Sprint 3: Mobile UX und Responsive Layout
finalisieren`) sowie der noch nicht committete Arbeitsstand von Sprint 4.

## 1. Projektziel

Das Projekt soll ein öffentliches Helferboard für den TV Homburg Handball bereitstellen. Helfer sollen sich ohne Benutzerkonto für Aufgaben bei Spielen eintragen und wieder austragen können. Ein Adminbereich soll Spiele verwalten und später Importe ermöglichen. Hauptziel ist eine stabile, öffentlich nutzbare MVP-Version.

Der derzeitige Code bildet dieses Ziel teilweise ab: Das Helfer-Dashboard
bleibt öffentlich erreichbar. Der Adminbereich ist über die Sidebar
erreichbar, wird durch Supabase Auth und eine Freigabe in `admin_users`
geschützt und besitzt vollständige Abläufe zum Anzeigen, Anlegen, Bearbeiten
und Löschen von Spielen. Sprint 2A ergänzt eine geschützte
Excel-Importvorschau mit Team-Mapping und Duplikaterkennung. Sprint 2B ergänzt
den bestätigten Import erneut geprüfter Heimspiele, Teilergebnisse,
Doppelauslösungsschutz und den reload-freien Dashboard-Refresh. In der
konfigurierten produktionsnahen Instanz sind inzwischen 63 Saisonspiele
vorhanden. Sprint 3 behebt die relevanten mobilen Overflow-Probleme und zeigt
Datum sowie Anwurfzeit in den MatchCards lesbar an. Sprint 4 ergänzt die
bestätigte Sammellöschung für Spiele und stellt die sichtbaren Namen der acht
Vereinsmannschaften auf kompakte Vereinswerte um.

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
| Excel-Leser | `read-excel-file ^9.3.4` | `9.3.4` |

Das Lockfile verwendet Lockfile-Version 3. Für die Bestandsprüfung standen Node.js `24.15.0` und npm `11.12.1` zur Verfügung. Das Repository definiert keine unterstützte Node-/npm-Version über `engines`, `.nvmrc` oder eine vergleichbare Datei.

Vorhandene npm-Skripte:

- `npm run dev`: startet Vite.
- `npm run build`: erzeugt den Produktions-Build mit Vite.
- `npm test`: führt die automatisierten Node-Tests aus.

Es gibt keine Skripte für Linting, Formatierung oder Vorschau.

### Einstiegspunkte

1. `index.html` stellt das Element `#root` bereit und lädt `/src/main.jsx`.
2. `src/main.jsx` initialisiert React mit `ReactDOM.createRoot`, aktiviert `React.StrictMode`, lädt die globalen Styles und rendert `App`.
3. `src/App.jsx` lädt beim Mounten die Dashboard-Daten, rendert Sidebar, Topbar, KPIs, Filter und die gefilterten MatchCards.

Es ist kein Client-Router installiert. `App` schaltet über lokalen
React-Zustand zwischen Dashboard, Admin-Login, geschützter
`AdminGamesPage` und geschützter `AdminGameImportPage` um. Beide Adminseiten
verwenden dieselbe Authentifizierungsprüfung. Die Admin-Session bleibt durch
den Supabase-Client nach einem Browser-Reload erhalten; die ausgewählte Seite
besitzt weiterhin keine eigene URL und startet nach einem Reload wieder beim
Dashboard.

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
│   ├── V24.0.5.3-Sprint-1C.md
│   ├── V24.0.5.3-Sprint-1C.1.md
│   ├── V24.0.5.4-Sprint-1D.md
│   ├── V24.0.5.5-Sprint-2A.md
│   ├── V24.0.5.6-Sprint-2B.md
│   ├── V24.0.6.0-Sprint-3-Mobile-UX.md
│   ├── V24.0.6.1-Sprint-4.md
│   └── DB-0-Supabase-Grundlage.md
├── supabase/
│   ├── migrations/
│   │   ├── 20260727000100_initial_schema.sql
│   │   ├── 20260727000200_admin_auth.sql
│   │   ├── 20260727000300_update_helper_roles.sql
│   │   ├── 20260727000400_add_team_import_name.sql
│   │   ├── 20260727000500_complete_import_teams.sql
│   │   └── 20260810000100_shorten_team_names.sql
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
    │       ├── BulkDeleteGamesDialog.jsx
    │       ├── DeleteGameDialog.jsx
    │       ├── GameImportConfirmDialog.jsx
    │       ├── GameImportPreview.jsx
    │       ├── GameImportResult.jsx
    │       ├── GameForm.jsx
    │       └── GameTable.jsx
    ├── lib/
    │   └── supabase.js
    ├── hooks/
    │   └── useAdminAuth.js
    ├── pages/
    │   ├── AdminGameImportPage.jsx
    │   ├── AdminGamesPage.jsx
    │   └── AdminLoginPage.jsx
    ├── services/
    │   ├── authService.js
    │   ├── gameImportModel.js
    │   ├── gameImportParser.js
    │   ├── gameImportService.js
    │   ├── gameImportWorkflow.js
    │   ├── gameBulkDelete.js
    │   ├── gameSelection.js
    │   ├── gameService.js
    │   └── helperService.js
    ├── store/
    │   └── useDashboardStore.js
    ├── styles/
    │   └── globals.css
    └── utils/
        └── formatDateTime.js
└── tests/
    ├── formatDateTime.test.js
    ├── gameBulkDelete.test.js
    ├── gameImportParser.test.js
    ├── gameImportWorkflow.test.js
    └── gameSelection.test.js
```

`node_modules/`, `dist/`, lokale `.env`-Varianten und Editor-Dateien werden über `.gitignore` ausgeschlossen. `.env.example` ist ausdrücklich von der allgemeinen `.env.*`-Regel ausgenommen und enthält ausschließlich Platzhalter.

### Zustandsverwaltung

`src/store/useDashboardStore.js` verwendet einen einzelnen Zustand-Store. Er enthält:

- Daten: `games`, `teams`, `roles`, `assignments`
- Filter: `selectedTeam`, `selectedCategory`
- Aktionen: `loadData`, `reloadAssignments`, `setSelectedTeam`, `setSelectedCategory`
- Selektorlogik: `getFilteredGames`

Die Admin-Spieleübersicht verwendet diesen Store bewusst nicht. Sie hält
Spiele, Teams, Lade-, Formular-, Speicher-, Auswahl-, Sammellösch- und
Meldungszustände lokal in `AdminGamesPage` und lädt beziehungsweise schreibt
ausschließlich über den Service-Layer.

Die Admin-Importseite hält ausgewählte Datei, Parsergebnis, lokale manuelle
Zuordnungen, freiwillige Alias-Auswahl, Bestätigungs-, Fortschritts- und
Ergebniszustände lokal. Analysierte Zeilen werden aus Parsergebnis, `teams`,
vorhandenen `games` und den lokalen Zuordnungen abgeleitet. Unmittelbar vor
einem bestätigten Import lädt der Workflow die Spiele erneut. Nach mindestens
einem erfolgreichen Insert aktualisiert er die lokalen Referenzdaten und ruft
`useDashboardStore.loadData()` auf; die bestehenden Filterwerte bleiben
erhalten.

Der Authstatus liegt ebenfalls nicht im Zustand-Store. `useAdminAuth` hält
Session, Lade-, Fehler- und Adminstatus innerhalb der Anwendung und verwendet
dafür ausschließlich `authService`.

`loadData` liest alle vier Tabellen direkt über den Supabase-Client und speichert die Ergebnisse im Store. Die Abfragen laufen nacheinander. Ladezustände und sichtbare Fehlerzustände werden nicht verwaltet. Erfolgreiche `data: null`-Antworten werden auf leere Arrays normalisiert. Bei Supabase-Fehlern bleiben die zuletzt gültigen Store-Daten erhalten und technische Details werden protokolliert; eine sichtbare Dashboard-Fehlermeldung gibt es weiterhin nicht. Unerwartete Promise-Fehler aus `loadData()` werden in `App` abgefangen.

Die Spielfilterung ordnet Spiele über `games.team_id = teams.id` einem Team zu. Der Teamfilter vergleicht die ausgewählte Select-Zeichenkette mit `team.id`; falls die Datenbank numerische IDs liefert, kann der strikte Vergleich fehlschlagen. Der Kategoriefilter vergleicht `team.category` mit `Aktive` oder `Jugend`.

### Supabase-Anbindung

`src/lib/supabase.js` erzeugt einen Client mit `createClient` und liest die lokale Konfiguration ausschließlich aus den Vite-Umgebungsvariablen `VITE_SUPABASE_URL` und `VITE_SUPABASE_ANON_KEY`. `.env.example` dokumentiert beide Namen mit Platzhalterwerten. Lokale Werte gehören in die ignorierte `.env.local`. Fehlen Werte, wird eine verständliche Konsolenwarnung ausgegeben und ein nicht produktiver Fallback verwendet, damit die Oberfläche ihren behandelten Ladefehler anzeigen kann.

Damit ist das Repository ohne lokale Konfiguration nicht gegen ein echtes
Supabase-Projekt lauffähig. Die initiale DB-0-Migration und Seed-Daten wurden
laut Sprint-1B.1-Abnahme auf der konfigurierten Instanz angewendet. Sprint 1C
ergänzt die Admin-Authentifizierung und sichere Schreibrechte. Sprint 1C.1
aktualisiert die offiziellen Rollenwerte. Sprint 2A ergänzt
`teams.import_name` als optionale, fallunabhängig eindeutige
Excel-Bezeichnung. Sprint 2B verwendet für Spiele- und optionale
Team-Mutationen ausschließlich die bereits vorhandenen Admin-Policies;
bestehende RLS-Regeln bleiben unverändert. Sprint 4 kürzt ausschließlich die
sichtbaren `teams.name`-Werte über eine idempotente Zuordnung anhand von
`import_name` und Kategorie. IDs, Importnamen, Spiele- und
Helferzuordnungen bleiben unverändert.

Der Dashboard-Store greift direkt auf Supabase zu. Für Authentifizierung,
Helferzuordnungen und Spiele existieren klar benannte Services. Die
DB-0-Migration erlaubt öffentliches Lesen sowie Insert und Delete für
`helper_assignments`, aber keine anonymen Admin-Schreibzugriffe. Die
Sprint-1C-Migration erteilt authentifizierten Clients die nötigen
Tabellenrechte, lässt Mutationen auf `teams`, `games` und `helper_roles` über
RLS jedoch nur zu, wenn `public.is_admin()` einen Eintrag in `admin_users`
bestätigt.

### Services

`src/services/authService.js`:

- lädt die bestehende Supabase-Session,
- abonniert Auth-Statusänderungen,
- meldet per E-Mail und Passwort an und ab,
- prüft die Adminfreigabe ausschließlich über den RPC-Aufruf `is_admin`.

`src/services/helperService.js`:

- `createAssignment(payload)`: fügt einen Eintrag in `helper_assignments` ein.
- `deleteAssignment(id)`: löscht einen Eintrag über dessen `id`.
- Beide Funktionen protokollieren Supabase-Fehler und liefern dann `false`, werfen den Fehler aber nicht weiter.

`src/services/gameService.js`:

- `getGames()`: lädt die im Dashboard nachweislich verwendeten Spielfelder sowie die Teamdaten, ordnet Teams über `team_id` zu und sortiert Spiele aufsteigend nach `start_time`.
- `getTeams()`: lädt `id`, `name`, `category` und `import_name` der verfügbaren Mannschaften und sortiert sie für Formulare und Import nach Namen.
- `createGame(g)`: begrenzt den Schreib-Payload auf `team_id`, `start_time`, `opponent` und `is_home`, legt genau diesen Datensatz an und kapselt Supabase-Fehler als strukturierten `GameServiceError`. Der anschließend sichtbare Datensatz wird über `getGames()` neu gelesen.
- `importGames(rows)`: verarbeitet ausschließlich validierte Bereit-Zeilen
  nacheinander, schreibt nur `team_id`, `start_time`, `opponent` und
  `is_home = true`, meldet Fortschritt und liefert Erfolge sowie Fehler je
  Excel-Zeile getrennt zurück.
- `saveTeamImportName(teamId, importName)`: prüft vorhandene Aliase erneut,
  überschreibt keinen gesetzten Importnamen und behandelt Unique-Konflikte
  verständlich.
- `updateGame(id, g)`: begrenzt den Payload auf dieselben vier Felder, aktualisiert eindeutig anhand der Spiel-ID und gibt den aktualisierten Datensatz zurück.
- `deleteGame(id)`: löscht eindeutig anhand der Spiel-ID, gibt die gelöschte ID zurück und unterscheidet einen Fremdschlüsselkonflikt von allgemeinen Fehlern.
- `deleteGames(ids, options)`: delegiert eine validierte Sammellöschung an den
  sequenziellen Bulk-Workflow und verwendet für jede ID das bestehende
  `deleteGame`.

Die CRUD-Funktionen werden von `AdminGamesPage` verwendet; `getTeams()` und
`getGames()` versorgen zusätzlich die Importvorschau, während
`importGames()` und `saveTeamImportName()` ausschließlich den bestätigten
Importablauf bedienen. Technische
Supabase-Fehler werden nicht direkt in der Oberfläche ausgegeben; die Seite
übersetzt die strukturierten Fehlercodes in verständliche Meldungen. Für Lese-
und Schreibzugriff gilt `start_time` als kanonisches Zeitfeld.

`src/services/gameBulkDelete.js`:

- validiert die vollständige ID-Liste vor der ersten Mutation,
- entfernt doppelte IDs und verarbeitet ausschließlich die explizite Auswahl,
- löscht sequenziell und liefert erfolgreiche sowie fehlgeschlagene IDs
  getrennt zurück,
- verhindert parallele Sammelläufe über einen Single-Flight-Schutz,
- stößt den injizierten Refresh nur nach mindestens einem Erfolg an und hält
  einen Refresh-Fehler getrennt vom Mutationsergebnis fest.

`src/services/gameSelection.js` kapselt Einzelauswahl, Auswahl/Abwahl aller
aktuell dargestellten Spiele sowie das Entfernen nicht mehr vorhandener IDs
nach Reload oder Löschung.

`src/services/gameImportService.js`:

- akzeptiert ausschließlich `.xlsx`,
- liest Dateien vollständig clientseitig mit `read-excel-file`,
- lädt nichts in Supabase Storage oder an einen anderen Server,
- wählt das erste nicht leere Tabellenblatt mit der benötigten Struktur,
- gibt ausschließlich ein normalisiertes Parsergebnis zurück.

`src/services/gameImportParser.js`:

- normalisiert Spaltenüberschriften und Textwerte,
- verarbeitet Excel-Datumswerte sowie unterstützte Textdaten und Uhrzeiten,
- bestätigt Heimspiele über `H/A` oder die TVH-Heimmannschaft,
- ordnet Teams exakt über `import_name` und optional exakt über `name` zu,
- übernimmt manuelle Zuordnungen nur lokal für alle gleichen Excel-Namen,
- erkennt Duplikate gegen vorhandene Spiele und innerhalb derselben Datei,
- enthält keinerlei Supabase- oder Mutationszugriff.

`src/services/gameImportModel.js`:

- validiert den finalen Import-Payload unabhängig von React und Supabase,
- erzwingt Status „Bereit“ und `is_home = true`,
- entfernt sämtliche Excel-Zusatzfelder,
- aggregiert vollständige Abschlussstatistiken.

`src/services/gameImportWorkflow.js`:

- lädt Spiele direkt vor dem Import erneut,
- führt Parser- und Duplikatprüfung nochmals aus,
- koordiniert freiwilliges Alias-Speichern und zeilenweise Inserts,
- verhindert parallele Ausführung über einen Single-Flight-Controller,
- aktualisiert Admin-Referenzdaten und Dashboard nach Teilerfolg oder Erfolg.

### Seiten und Komponenten

- `App`: Anwendungsshell, interne Umschaltung zwischen Dashboard, Login und
  den geschützten Adminseiten für Spieleverwaltung und Spielimport sowie
  erneutes Laden der Dashboard-Daten bei jedem Öffnen des Dashboards.
- `useAdminAuth`: lokale Auth-Steuerung mit Session-, Lade-, Fehler- und
  Adminstatus; sperrt nicht freigeschaltete oder nicht prüfbare Sitzungen.
- `Sidebar`: Navigation zwischen Dashboard, „Spiele verwalten“ und
  „Spielimport“ mit sichtbarem Aktivzustand; die Admin-Einträge führen ohne
  Freigabe zum Login, freigeschaltete Admins erhalten „Abmelden“.
- `Topbar`: konfigurierbare Überschrift und Untertitel mit den bisherigen Dashboard-Texten als Standard.
- `KPISection`: zeigt Heimspiele, offene Dienste, Helfereinträge und Mannschaften für die aktuelle Filterung.
- `FilterBar`: Team- und Kategoriefilter.
- `MatchCard`: aufklappbare Spielkarte, dynamische Rollenanzeige sowie Ein- und Austragen von Helfern.
- `AdminGamesPage`: erreichbare Spieleverwaltung mit lokalem Lade-, Fehler-,
  Leer-, Formular-, Speicher-, Auswahl-, Einzel-/Sammellösch- und
  Meldungszustand; aktualisiert nach Mutationen Adminliste und Dashboard-Store.
- `AdminLoginPage`: kontrolliertes Loginformular mit Pflichtfeldprüfung,
  Ladezustand, Doppelklickschutz und Rückkehr zum Dashboard.
- `GameTable`: responsive Desktop-Tabelle und mobile Listenansicht für Datum,
  Uhrzeit, Heimteam, Gastteam und Kategorie, Checkbox je Spiel sowie eindeutig
  zugeordnete Einzelaktionen zum Bearbeiten und Löschen.
- `GameForm`: gemeinsames, kontrolliertes Create-/Edit-Formular mit Datum, Uhrzeit, Heim-/Auswärtswahl, TVH-Team-Auswahl, Gegnername, Validierung, Vorbelegung, Ladezustand und Abbrechen.
- `DeleteGameDialog`: modaler Bestätigungsdialog mit Spielidentifikation, Hinweis auf kaskadierte Helferzuordnungen, Ladezustand, Fehleranzeige, Abbrechen und Escape-Unterstützung.
- `BulkDeleteGamesDialog`: mobiler, intern scrollbar begrenzter
  Bestätigungsdialog mit Auswahlanzahl, kompakter Vorschau, Cascade-Hinweis,
  Fortschritt und eindeutiger destruktiver Aktion.
- `AdminGameImportPage`: geschützte Dateiauswahl mit Referenzdaten-Laden,
  Rücksetzen, Parserfehlern, lokaler manueller Zuordnung, freiwilliger
  Alias-Speicherung, ausdrücklicher Importbestätigung und Ergebnisanzeige.
- `GameImportPreview`: Status-KPIs und eine horizontal scrollbare
  Vorschautabelle mit Excel-Zeile, Team-Mapping, Gegner, Zeitpunkt und
  verständlichen Hinweisen.
- `GameImportConfirmDialog`: ausdrückliche Bestätigung mit importierbaren und
  übersprungenen Zeilen sowie sichtbarem Fortschritt.
- `GameImportResult`: Abschlussstatistik, Detailansicht für übersprungene oder
  fehlgeschlagene Zeilen und kontrolliertes Zurücksetzen.

### Aktuell implementierte Funktionen

- Laden von Spielen, Teams, Helferrollen und Helferzuordnungen aus Supabase.
- Anzeige und Aufklappen von MatchCards.
- Teamfilter und Kategoriefilter.
- KPI-Anzeige auf Basis der aktuell gefilterten Spiele.
- Dynamisches Laden der Rollen passend zur Teamkategorie.
- Sortierung der Rollen nach `order_index`.
- Berechnung der benötigten Plätze aus der Summe von `helper_roles.slots`.
- Berechnung der KPI „Offene Dienste“ aus den dynamischen Rollenplätzen je
  Spielkategorie abzüglich vorhandener Helferzuordnungen.
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
- Bearbeiten mit Vorbelegung aller Spielfelder, identischer Validierung,
  synchronem Doppelklickschutz und `gameService.updateGame()`.
- Löschen erst nach ausdrücklicher Bestätigung über
  `gameService.deleteGame()`; laufende Löschvorgänge können nicht mehrfach
  ausgelöst oder abgebrochen werden.
- Auswahl einzelner oder aller aktuell dargestellten Spiele über Checkboxen;
  einzelne Spiele können wieder abgewählt werden.
- Sammellöschen erst nach ausdrücklicher Bestätigung mit Auswahlanzahl und
  Hinweis auf die kaskadierte Löschung zugehöriger Helferzuordnungen.
- Sequenzielle Sammellöschung mit Fortschritt, Doppelauslösungsschutz,
  eindeutigem Voll-/Teilergebnis und Auswahl der fehlgeschlagenen Spiele.
- Automatisches Entfernen veralteter Auswahl-IDs nach Löschung, Reload oder
  erneutem Öffnen der Seite.
- Neuladen und sortierte Darstellung der Adminliste nach erfolgreichem
  Anlegen, Bearbeiten oder Löschen.
- Unmittelbares Neuladen aller Dashboard-Daten nach jeder erfolgreichen
  Spielmutation; Team- und Kategoriefilter bleiben dabei erhalten.
- Laden und Wiederherstellen einer bestehenden Supabase-Session.
- Reaktion auf Änderungen des Supabase-Authstatus.
- Login mit E-Mail und Passwort ohne öffentliche Registrierung.
- Prüfung der Adminfreigabe ausschließlich über `admin_users`.
- Sperren und Abmelden eines gültigen Auth-Benutzers ohne Adminfreigabe.
- Geschütztes Rendern der Adminseite erst nach abgeschlossener Prüfung.
- Logout mit sofortigem Wechsel zum öffentlichen Dashboard.
- Auswahl, clientseitiges Lesen und Zurücksetzen einer `.xlsx`-Datei.
- Prüfung der Pflichtspalten `Mannschaft`, `GAST`, `Datum`, `Anwurf` sowie
  `H/A` oder `HEIM`.
- Exaktes automatisches Team-Mapping über `teams.import_name` und lokales
  manuelles Mapping für alle gleichen Excel-Mannschaftsnamen.
- Statusdarstellung für bereite, unzugeordnete, ungültige, bereits
  vorhandene, dateiintern doppelte und nicht als Heimspiel bestätigte Zeilen.
- Duplikaterkennung anhand von `team_id`, `start_time` und normalisiertem
  `opponent`.
- Responsive Importvorschau mit dynamischem Importbutton.
- Ausdrückliche Importbestätigung vor jeder Mutation.
- Erneute Remote-Duplikatprüfung direkt vor dem Speichern.
- Zeilenweiser Spieleimport mit Teilerfolgen und Fortschrittsanzeige.
- Schutz vor Doppelklick und paralleler Importausführung.
- Abschlussbericht mit importierten, vorhandenen, ungültigen,
  unzugeordneten, übersprungenen und fehlgeschlagenen Zeilen.
- Reload-freier Refresh von Importreferenzen und Dashboard-Store.
- Freiwilliges, konfliktgeschütztes Speichern manueller Team-Aliase.

Diese Funktionen sind im Code vorhanden. Die öffentlichen Lesezugriffe und der
anonyme RLS-Fehler wurden in Sprint 1B.1 real geprüft. Die neue
Adminmigration, Sessionwiederherstellung, Nicht-Admin-Sperre und der
erfolgreiche Admin-Schreibvorgang wurden in Sprint 1C gegen die konfigurierte
Instanz abgenommen. Alle temporären Testdaten und Auth-Konten wurden danach
wieder entfernt.

### Platzhalter, unvollständige Funktionen und bekannte Abweichungen

- Ohne lokale Umgebungsvariablen ist keine echte Supabase-Verbindung vorhanden.
- Anonyme Inserts in `games` bleiben absichtlich blockiert. Der Create-Pfad
  funktioniert real nur nach Anwendung der Sprint-1C-Migration und manueller
  Freischaltung eines Auth-Benutzers; dieser Ablauf ist end-to-end bestätigt.
- Kalender, Helferansicht und Teams sind deaktiviert und haben keine Funktion.
- Es gibt keine URL-basierte Navigation; die aktuelle Seite wird nur im lokalen Zustand von `App` gehalten.
- Die konfigurierte Instanz enthält inzwischen 63 Saisonspiele. Sprint 3
  behandelt diese ausschließlich lesend; weder Import- noch Spieldaten werden
  im Rahmen des UX-Refactorings verändert.
- Die Spiele-Duplikatprüfung erfolgt auf Anwendungsebene direkt vor dem
  Import. Eine zusätzliche DB-Unique-Regel wurde nicht eingeführt, weil das
  freie Gegnerfeld ohne externe fachliche Spiel-ID keine zweifelsfrei
  belastbare Datenbankidentität liefert.
- Es gibt keinen handball.net-Import.
- Die MatchCard ermittelt „vollständig besetzt“ anhand der Gesamtzahl aller Spielzuordnungen. Zuordnungen zu nicht passenden Rollen können den Status verfälschen.
- Fehler aus `helperService` werden in `MatchCard` nicht anhand des Rückgabewerts ausgewertet. Ein fehlgeschlagenes Einfügen kann daher trotzdem das Eingabefeld leeren; ein verständlicher Fehler wird nicht zuverlässig angezeigt.
- Beim Austragen gibt es keine Bestätigung und keinen Besitznachweis. Die DB-0-Policy muss deshalb für die öffentliche Austragefunktion derzeit das Löschen jeder sichtbaren Zuordnung anhand ihrer ID erlauben.
- Die DB-0-Migration verhindert namensgleiche Doppeleinträge je Spiel und Rolle ohne Beachtung der Groß-/Kleinschreibung. Eine konkurrierende Überbuchung über `helper_roles.slots` wird weiterhin nicht serverseitig verhindert.
- Das Dashboard besitzt weiterhin keine eigene Lade-, Leer-, Netzwerkfehler- oder Wiederholungsansicht; die Admin-Spieleübersicht behandelt Laden, Fehler und leere Daten.
- Die 19 automatisierten Tests decken Excel-Parser, Zeitnormalisierung,
  Pflichtspalten, ungültige Werte, Team-Mapping, Duplikaterkennung,
  Payloadbegrenzung, erneute Remote-Prüfung, Wiederholungsimport,
  Mehrfachauslösung, Teilerfolge, Refresh und Alias-Konflikte ab. Für das
  übrige Dashboard und Spiele-CRUD bestehen weiterhin keine automatisierten
  Komponenten- oder Integrationstests.
- Es gibt keine Deployment-Konfiguration im Repository.

Das `CHANGELOG.md` nennt für `STABILIZATION_01` Rollensortierung, Trimmen von
Namen, Verhindern doppelter Einträge und Fehlerbehandlung, für `V24.0.5` die
vorbereitete Admin-Grundstruktur, für Sprint 1A die interne Navigation und
Leseansicht, für Sprint 1B den Create-Ablauf, für Sprint 1C die
Admin-Authentifizierung und für Sprint 1D den Abschluss des Spiele-CRUD.

## 3. Datenmodell

Die folgenden Angaben beschreiben die versionierte und laut Sprint-1B.1
angewendete DB-0-Migration, die in Sprint 1C ergänzte Adminmigration sowie
die Daten- und Schemaänderungen aus Sprint 1C.1 und Sprint 2A.

### `teams`

| Feld | Verwendung im Code | Definition in DB-0 |
| --- | --- | --- |
| `id` | Identifikation, Zuordnung über `games.team_id`, Wert des Teamfilters | `uuid`, Primärschlüssel, Default `gen_random_uuid()` |
| `name` | Anzeigename in Filter und MatchCard | `text not null`, getrimmt, Länge 1–120 |
| `category` | Filterung und Auswahl der Rollen; erwartet werden `Aktive` oder `Jugend` | `text not null`, Check auf `Aktive`/`Jugend` |
| `import_name` | Exakte Zuordnung der Excel-Spalte `Mannschaft` | `text null`, getrimmt, Länge 1–120; partieller fallunabhängiger Unique-Index für Nicht-NULL-Werte |
| `created_at`, `updated_at` | Derzeit nicht vom Frontend gelesen | `timestamptz not null`, Default `now()`; Update-Trigger |

Ein Feld `teams.order_index` existiert weder in der versionierten
Basismigration noch in der aktuell konfigurierten Supabase-Instanz. Sprint 2A
führt deshalb keine unbelegte Reihenfolgenspalte ein. Die sichtbare
Teamreihenfolge bleibt die alphabetische Sortierung aus `gameService`.

### `games`

| Feld | Verwendung im Code | Definition in DB-0 |
| --- | --- | --- |
| `id` | React-Key, Zuordnung von Helfern, Ziel für Update und Delete | `uuid`, Primärschlüssel, Default `gen_random_uuid()` |
| `team_id` | Zuordnung zu `teams.id` | `uuid not null`, Fremdschlüssel, `ON DELETE RESTRICT` |
| `start_time` | Datumsausgabe und Sortierung | `timestamptz not null`, indexiert |
| `opponent` | Gegnername in der MatchCard | `text not null`, getrimmt, Länge 1–120 |
| `is_home` | Zählung der Heimspiele in den KPIs | `boolean not null` |
| `created_at`, `updated_at` | Derzeit nicht vom Frontend gelesen | `timestamptz not null`, Default `now()`; Update-Trigger |

`createGame` und `updateGame` schreiben ausschließlich die vier belegten
Felder. `deleteGame` filtert ausschließlich über eine validierte `id`;
`deleteGames` ruft diesen Ablauf sequenziell nur für die zuvor validierten,
explizit ausgewählten IDs auf. Daraus lassen sich keine weiteren
verlässlichen Spalten ableiten.

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

### `admin_users`

| Feld | Verwendung | Definition in Sprint 1C |
| --- | --- | --- |
| `user_id` | Freigabe einer Supabase-Auth-Identität als Admin | `uuid`, Primärschlüssel und Fremdschlüssel auf `auth.users(id)`, `ON DELETE CASCADE` |
| `created_at` | Zeitpunkt der Adminfreigabe | `timestamptz not null`, Default `now()` |

RLS ist aktiviert. Direkte Tabellenrechte werden weder `anon` noch
`authenticated` erteilt. Die als `SECURITY DEFINER` ausgeführte Funktion
`public.is_admin()` prüft `auth.uid()` bei leerem `search_path`; ausführen darf
sie nur die Rolle `authenticated`.

## 4. Fachliche Regeln

- Rollen werden dynamisch aus `helper_roles` geladen.
- Rollen werden innerhalb der Kategorie aufsteigend nach `order_index` sortiert.
- Die fachlich vorgesehene Reihenfolge für **Aktive** ist:
  1. Zeitnehmer – 1 Platz
  2. Sekretär – 1 Platz
  3. Wischer – 2 Plätze
  4. Verkauf – 4 Plätze
  5. Ordner – 4 Plätze
- Die fachlich vorgesehene Reihenfolge für **Jugend** ist:
  1. Zeitnehmer – 1 Platz
  2. Sekretär – 1 Platz
  3. Schiri – 1 Platz
  4. Verkauf – 2 Plätze
  5. Kuchen – 3 Plätze
  6. Brezeln / Sonstiges – 1 Platz
  7. Trikots – 1 Platz
- Orange bedeutet: Es sind noch Helferplätze offen.
- Grün bedeutet: Alle benötigten Helferplätze sind besetzt.

Die Farblogik und Sortierung sind im Code umgesetzt. Die Datenmigration aus
Sprint 1C.1 aktualisiert bestehende Projekte auf diese offiziellen Werte; der
Seed enthält dieselben Werte für neue Datenbanken. Die Gesamtbedarfe betragen
12 Plätze für Aktive und 10 Plätze für Jugend.

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

Die Liste beschreibt den eingefrorenen Zielumfang. Im Ist-Zustand sind
Dashboard, KPIs, Filter, MatchCards, dynamische Rollen, Helferaktionen sowie
Anzeigen, Anlegen, Bearbeiten und Löschen in der Admin-Spieleübersicht
implementiert. Excel-Analyse, Team-Mapping, Vorschau und kontrollierter
Spieleimport sind in Sprint 2A und Sprint 2B umgesetzt. Der produktive Import
der vollständigen Beispieldatei und das öffentliche Deployment sind noch
nicht freigegeben beziehungsweise fertiggestellt.

## 6. Nicht Teil des aktuellen MVP

- handball.net-Import.
- Benachrichtigungen.
- Saisonverwaltung.
- Benutzerkonten für Helfer.
- Komplexe Rechteverwaltung.
- Statistiken und Historie.
- Exporte.

## Release-Backlog vor Saisonstart

Die folgenden Anforderungen gehören nicht zu Sprint 2B und nicht zwingend
zum Hosting-Sprint. Sie müssen jedoch vor dem Saisonrelease umgesetzt werden.

### RB-1 – Mehrfachauswahl bei Filtern

- Mehrere Teams gleichzeitig auswählbar.
- Mehrere Kategorien gleichzeitig auswählbar.
- Dashboard, MatchCards und KPIs berücksichtigen die gewählte Kombination.

### RB-2 – Mehrfachauswahl beim Löschen von Spielen

- In Sprint 4 umgesetzt.
- Checkbox je Spiel sowie Auswahl/Abwahl aller aktuell dargestellten Spiele.
- Sicherheitsdialog mit Anzahl, begrenzter Vorschau und Cascade-Hinweis.
- Sequenzielle Löschung ausschließlich expliziter IDs mit nachvollziehbaren
  Voll- und Teilergebnissen.
- Schutz gegen Doppelklick und parallele Mehrfachauslösung.
- Adminliste und Dashboard werden ohne Browserreload aktualisiert.

### RB-3 – Intelligente Spieltagsgruppierung

- Alle Spiele desselben Datums bilden grundsätzlich einen Spieltag.
- Spiele am Samstag und am unmittelbar folgenden Sonntag bilden gemeinsam
  einen vollständigen Spieltag.
- Nur Samstag bleibt ein eigener Spieltag.
- Nur Sonntag bleibt ein eigener Spieltag.
- Freitag oder Montag werden nicht automatisch angegliedert.
- Gruppierung dynamisch aus `start_time` berechnen.
- Zeitraum passend darstellen, zum Beispiel `29.–30.08.2026`.

### RB-4 – Spieltagfilter

- Filterwerte entsprechen den berechneten Spieltagsgruppen.
- Samstag und der direkt folgende Sonntag erscheinen als ein Filterwert.
- KPIs, Listen und MatchCards berücksichtigen den ausgewählten Spieltag.

### RB-5 – Verbesserter Re-Import

- Aktualisierte Spielplandateien erneut einlesen.
- Vorhandene Spiele erkennen.
- Neue Spiele hinzufügen.
- Keine Doppelungen erzeugen.
- Mögliche Änderungen bestehender Spiele zunächst nur analysieren und
  verständlich anzeigen; kein ungefragtes Überschreiben.

### RB-6 – Mobile Filterdarstellung

- In Sprint 3 umgesetzt: Team- und Kategoriefilter nutzen mobil die volle
  verfügbare Breite und stehen untereinander.
- Bei 320, 375, 390 und 430 Pixel geprüft.
- Kein ungewollter horizontaler Body-Overflow.

### RB-7 – Anwurfzeiten anzeigen

- In Sprint 3 umgesetzt.
- MatchCards zeigen die Anwurfzeit aus `games.start_time` lokal im Format
  `HH:mm Uhr` auf Mobil und Desktop.
- Gespeicherte Zeitwerte bleiben unverändert.

### RB-8 – Chronologische Spielsortierung

- In Sprint 3 als kleine präsentationale Korrektur umgesetzt.
- Die gefilterte Dashboard-Liste wird auf einer Kopie chronologisch nach
  `start_time` sortiert.
- Remote-Datensätze werden weder aktualisiert noch umsortiert gespeichert.

### Weiterer Release-Backlog

- Helferrollenfilter und Filter auf Spiele mit offenen ausgewählten Rollen.
- `minimum_staff` und fachlicher Durchführbarkeitsstatus, insbesondere die
  spätere 3-von-4-Regel für Verkauf und Ordner. Diese Logik ist ausdrücklich
  nicht Teil von Sprint 4.

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

Im aktuellen Repository existiert ein Testskript für die Importlogik. Der
Definition-of-Done-Prüfschritt führt deshalb `npm test` aus; nicht abgedeckte
Dashboard- und CRUD-Bereiche werden weiterhin ausdrücklich als manuell
geprüft dokumentiert.

## 9. Versionsplan

- **V24.0.5:** vorhandene Ausgangsversion. Admin-Grundstruktur und Spiele-Service sind vorbereitet; ein funktionaler Adminbereich fehlt.
- **V24.0.5.1/V24.0.5.2:** Adminbereich für Spiele; Sprint 1A mit
  Navigation und Leseansicht sowie Sprint 1B mit Create und angewendeter
  DB-0-Grundlage.
- **V24.0.5.3:** Sprint 1C mit Supabase-Admin-Authentifizierung,
  `admin_users` und sicheren Schreibrechten. Die reale Admin-Abnahme wird im
  Sprint-Report dokumentiert.
- **V24.0.5.4:** Sprint 1D schließt die Spielverwaltung mit Bearbeiten,
  bestätigtem Löschen und unmittelbarer Aktualisierung von Adminliste und
  Dashboard ab.
- **V24.0.5.5:** Sprint 2A bereitet den Excel-Import mit `import_name`,
  clientseitigem Parser, Team-Mapping, Duplikaterkennung und Vorschau vor,
  ohne Spiele zu importieren.
- **V24.0.5.6:** Sprint 2B ergänzt bestätigten Spieleimport, erneute
  Remote-Duplikatprüfung, Teilergebnisse, Refresh und das freiwillige
  Speichern manueller Aliase.
- **V24.0.6.0:** Sprint 3 behebt Mobile-Overflow, führt den responsiven Drawer,
  mobile KPI-/Filter-/Rollenlayouts, Anwurfzeiten und die chronologische
  Dashboard-Sortierung ein.
- **V24.0.6.1:** Sprint 4 ergänzt RB-2 Sammellöschen und die kompakten
  sichtbaren Namen der acht Vereinsmannschaften bei unveränderten Team-IDs und
  Importnamen.
- **V24.0.7:** handball.net-Import; nicht Teil des aktuellen MVP.
