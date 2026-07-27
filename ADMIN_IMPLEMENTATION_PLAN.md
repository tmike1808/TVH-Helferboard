# Sprint 1 – Phase A: Architekturanalyse Adminbereich

Stand: 27. Juli 2026
Analysierter Ausgangspunkt: Commit `51bd47d` (`Version 24.0.5`)

Diese Datei dokumentiert ausschließlich den vorhandenen Zustand und den konkreten Plan für das spätere Spiele-CRUD. In dieser Phase wurden keine funktionalen Änderungen am Anwendungscode vorgenommen.

## Status DB-0

**DB-0 ist im aktuellen Arbeitsbaum als versionierte, noch nicht ausgeführte Datenbankgrundlage umgesetzt.**

- `supabase/migrations/20260727000100_initial_schema.sql` definiert die vier vom Code verwendeten Tabellen mit UUID-Schlüsseln, `games.start_time` als `timestamptz`, Fremdschlüsseln, Indizes, Constraints und Löschregeln.
- `helper_roles.slots` bleibt das verbindliche Mengenfeld, weil ausschließlich dieser Name im Anwendungscode belegt ist.
- Spiele löschen ihre Helferzuordnungen per Cascade; Teams und Rollen mit abhängigen Daten werden per Restrict geschützt.
- RLS ist für alle Tabellen aktiviert. Öffentlich erlaubt sind Lesen sowie Insert/Delete für `helper_assignments`.
- Für `teams`, `games` und `helper_roles` existieren keine anonymen Schreibrechte oder Schreib-Policies.
- `supabase/seed.sql` enthält anpassbare Beispielteams und die vorgegebenen Rollenfolgen. Alle Slot-Werte sind mangels Vereinsvorgabe ausdrücklich vorläufig.
- `SUPABASE_SETUP.md` beschreibt die einmalige SQL-Editor-Anwendung, Seed-Ausführung, lokale Vite-Konfiguration und Sicherheitsgrenzen.
- Es wurde kein SQL lokal oder remote ausgeführt. Die Prüfung war statisch; `psql`, Supabase CLI und Docker waren nicht verfügbar.

Der zentrale Sicherheitskonflikt bleibt bewusst offen: Sprint 1B ist implementiert, die reale Datenbankabnahme steht aus. Ohne Admin-Authentifizierung blockiert die sichere DB-0-RLS-Konfiguration den anonymen Insert in `games`.

## Status Sprint 1B

**Sprint 1B ist im aktuellen Arbeitsbaum implementiert, die reale Datenbankabnahme steht aus.** Schritt 7 des Plans ist für den nachweisbaren Datenbankvertrag abgeschlossen:

- `GameForm` bildet `team_id`, `opponent`, `is_home` und `start_time` als kontrolliertes Create-Formular ab.
- Die TVH-Mannschaft wird über lesbare Namen aus `teams` ausgewählt; `opponent` bleibt entsprechend dem vorhandenen Schema ein Gegnername.
- Datum und Uhrzeit werden getrennt erfasst, als lokale Zeit validiert und mit `toISOString()` als eindeutiger Zeitpunkt gespeichert.
- Leere Pflichtfelder und identische Heim-/Gastmannschaften verhindern den Serviceaufruf und werden sichtbar erläutert.
- `gameService.createGame()` begrenzt den Payload auf die vier belegten Felder und prüft den Insert-Fehler. Die erzeugte Zeile wird danach über den vorhandenen Lesepfad geladen, sodass der Insert keine zusätzliche Select-Policy voraussetzt.
- `AdminGamesPage` hält Formular- und Speicherzustand lokal, verhindert synchron doppeltes Absenden und lädt die sortierte Adminliste nach Erfolg erneut.
- `App` lädt die Dashboard-Daten bei jedem erneuten Öffnen des Dashboards; Adminformularzustand wurde nicht in den globalen Store verschoben.
- Supabase wird über `VITE_SUPABASE_URL` und `VITE_SUPABASE_ANON_KEY` konfiguriert; `.env.example` enthält nur Platzhalter.
- Update, Delete, Excel-Import, Authentifizierung, RLS-Änderungen und Routing bleiben außerhalb von Sprint 1B.

Browserseitig wurden die UI- und Fehlerpfade mit kontrollierten lokalen REST-Antworten geprüft. Da keine echten lokalen Supabase-Zugangsdaten vorhanden waren, ist ein erfolgreicher Schreibvorgang gegen das reale Supabase-Projekt nicht nachgewiesen.

## Status Sprint 1A.1

**Sprint 1A.1 ist im aktuellen Arbeitsbaum umgesetzt.** Der Sprint-1A-Lesepfad wurde ohne fachliche Erweiterung überprüft und bereinigt:

- Keine ungenutzten Imports, Variablen oder Admin-States festgestellt.
- Die interne Navigation bleibt bewusst auf Dashboard und „Spiele verwalten“ begrenzt; React Router wurde nicht ergänzt.
- `GameTable` bleibt rein präsentational, erhält Daten ausschließlich über Props und bereitet Desktop- und Mobilzeilen über ein gemeinsames View-Model auf.
- Ein fehlendes `games`-Prop wird wie ein leeres Array behandelt; Datensätze verwenden weiterhin die Supabase-`id` als stabilen Key.
- Redundante Initial-State-Updates in `AdminGamesPage` wurden entfernt; der Unmount-Schutz bleibt erhalten.
- Die Dashboard-Nullabsicherung bewahrt bei Supabase-Fehlern zuletzt gültige Daten, protokolliert die Fehler und normalisiert nur erfolgreiche `null`-Daten auf leere Arrays.
- Unerwartete Promise-Rejections aus dem initialen Dashboard-Ladevorgang werden in `App` abgefangen.
- Create, Edit, Delete, Formulare, Dialoge, Authentifizierung, RLS und Router bleiben außerhalb dieses Abschluss-Sprints.

## Status Sprint 1A

**Sprint 1A ist im aktuellen Arbeitsbaum umgesetzt.** Die Abschnitte 1 bis 6 dokumentieren weiterhin den analysierten Ausgangspunkt von Commit `51bd47d`; der konkrete Umsetzungsstand ist:

| Teil | Stand nach Sprint 1A |
| --- | --- |
| Navigation | Dashboard und „Spiele verwalten“ werden ohne Browser-Reload über lokalen Zustand in `App` gewechselt. Für zwei interne Ansichten war keine neue Router-Abhängigkeit erforderlich. |
| Sidebar | Beide erreichbaren Seiten besitzen einen eindeutigen Aktivzustand; nicht implementierte Ziele sind deaktiviert. |
| `gameService` | Der Leseweg verwendet `start_time`, lädt die belegten Spiele- und Teamfelder, ordnet Teams über `team_id` zu, sortiert aufsteigend und wirft Supabase-Fehler weiter. |
| `AdminGamesPage` | Verwendet lokalen Lade-, Fehler- und Datenzustand und greift ausschließlich über `getGames()` auf Daten zu. |
| `GameTable` | Zeigt Datum, Uhrzeit, Heimteam, Gastteam und Kategorie als Desktop-Tabelle beziehungsweise mobile Liste. |
| Create/Edit/Delete | Weiterhin nicht implementiert und nicht vorgetäuscht. `GameForm` und `DeleteGameDialog` bleiben Folgearbeiten. |
| Globaler Store | Die Adminseite verwendet ihn nicht. Erfolgreiche `null`-Daten werden defensiv normalisiert; bei Supabase-Fehlern bleiben vorhandene Daten erhalten und die Fehler werden protokolliert. |

Der Admin-Datenfluss verwendet den DashboardStore nicht. Während der manuellen Navigation wurde lediglich dessen bestehende Nullbehandlung minimal abgesichert: fehlgeschlagene Supabase-Abfragen überschreiben keine vorhandenen Daten, und erfolgreiche `null`-Antworten werden als leere Arrays dargestellt.

Damit sind aus dem ursprünglichen Plan der Leseanteil von Schritt 2, die für diesen Umfang ausreichende interne Navigation aus Schritt 4, Schritt 5 und die Read-only-Anteile aus Schritt 6 erledigt. Die Schreib-, Sicherheits- und Testschritte bleiben offen.

## 1. Architekturübersicht

Die Anwendung ist eine React-Single-Page-Anwendung mit Vite, Zustand und Supabase. Der öffentliche Dashboard-Bereich ist direkt in `App.jsx` aufgebaut. Die vorhandenen Admin-Dateien sind weder importiert noch erreichbar.

Die gewünschte Schichtenfolge

```text
Supabase
    ↓
Services
    ↓
Store
    ↓
Pages
    ↓
Components
    ↓
Dashboard Refresh
```

existiert derzeit **nicht als durchgängiger Datenfluss**. Der tatsächliche Code hat drei getrennte Pfade:

1. Dashboard-Lesezugriffe umgehen die Services.
2. Helfer-Schreibzugriffe verwenden einen Service, der anschließende Refresh umgeht ihn wieder.
3. Der Spiele-Service und die Admin-Oberfläche sind vorhanden, aber vollständig unverbunden.

## 2. Tatsächlicher Datenfluss

### 2.1 Initiales Laden des Dashboards

```text
src/lib/supabase.js
    ↓ direkter Import
useDashboardStore.loadData()
    ↓ vier sequenzielle select('*')-Abfragen
games / teams / roles / assignments im Zustand-Store
    ↓
App, KPISection, FilterBar und MatchCard
    ↓
React-Neuberechnung nach dem Zustand-Update
```

Details:

- `src/main.jsx` rendert genau eine `App`-Instanz.
- `App` ruft `loadData()` einmal in einem `useEffect` beim Mounten auf.
- `loadData()` fragt `games`, `teams`, `helper_roles` und `helper_assignments` direkt über den Supabase-Client ab.
- `gameService` und `helperService` sind an diesem Lesevorgang nicht beteiligt.
- Der Store setzt alle vier Ergebnisse gemeinsam, nachdem die vier Abfragen nacheinander abgeschlossen wurden.
- `App` berechnet anschließend `getFilteredGames()` und rendert MatchCards.
- `KPISection`, `FilterBar` und `MatchCard` lesen selbst ebenfalls aus demselben Zustand-Store.

### 2.2 Eintragen und Austragen von Helfern

```text
MatchCard / RoleCard
    ↓
helperService.createAssignment() oder deleteAssignment()
    ↓
Supabase: helper_assignments
    ↓
useDashboardStore.reloadAssignments()
    ↓ direkter Supabase-Zugriff, Service wird umgangen
assignments im Zustand-Store
    ↓
MatchCard und KPISection werden neu gerendert
```

Dieser Pfad ist der einzige vorhandene explizite Refresh nach einer Mutation. Er lädt immer die vollständige Tabelle `helper_assignments` neu.

### 2.3 Vorhandener Spiele-Service

```text
gameService
    ↓
Supabase: games

Keine Verbindung zu:
- useDashboardStore
- AdminGamesPage
- GameTable
- GameForm
- DeleteGameDialog
- App
```

`getGames`, `createGame`, `updateGame` und `deleteGame` existieren nur als exportierte Funktionen. Im gesamten Repository gibt es keinen Import und keinen Aufruf dieser Funktionen.

### 2.4 Aktueller Adminpfad

```text
AdminGamesPage
    ↓
statischer Hinweistext

GameTable           isolierter Platzhalter
GameForm            isolierter Platzhalter
DeleteGameDialog    isolierter Platzhalter
```

Die vier Dateien importieren weder einander noch Store oder Service. `AdminGamesPage` wird nicht von `App` oder `main.jsx` gerendert.

### 2.5 Dashboard-Refresh nach künftigem Spiele-CRUD

Ein solcher Mechanismus existiert aktuell nicht. `games` werden ausschließlich über `loadData()` beim Mounten von `App` geladen. Nach einem späteren Create, Update oder Delete würde das Dashboard ohne zusätzliche Store-Aktion mit veralteten Spieldaten weiterarbeiten.

## 3. Analyse der einzelnen Dateien

### `src/pages/AdminGamesPage.jsx`

**Aktuelle Aufgabe**

- Soll dem Dateinamen und der Überschrift nach die Seite für die Spielverwaltung werden.

**Tatsächlicher Implementierungsstand**

- Rendert nur die Überschrift „Spielverwaltung“ und einen Hinweis, dass CRUD später folgt.
- Hat keine Imports, Props, Zustände oder Eventhandler.
- Ist in keiner anderen Datei eingebunden.

**Fehlende Funktionalität**

- Laden und Anzeigen von Spielen und Teams.
- Lade-, Leer- und Fehlerzustände.
- Öffnen und Schließen des Formulars.
- Auswahl eines Spiels zum Bearbeiten.
- Auswahl und Bestätigung eines Spiels zum Löschen.
- Aufruf der Store-Aktionen.
- Erfolgsmeldungen und verständliche Fehlermeldungen.
- Refresh nach Mutationen.

**Abhängigkeiten**

- Aktuell nur Reacts JSX-Transformation und vorhandene Tailwind-Klassen.
- Künftig: `useDashboardStore`, `Topbar`, `GameTable`, `GameForm`, `DeleteGameDialog` und Routing-Kontext.

### `src/services/gameService.js`

**Aktuelle Aufgabe**

- Kapselt grundsätzlich CRUD-Zugriffe auf die Supabase-Tabelle `games`.

**Tatsächlicher Implementierungsstand**

- `getGames()` führt `select('*').order('date')` aus.
- `createGame(g)` übergibt das erhaltene Objekt direkt an `insert`.
- `updateGame(id, g)` aktualisiert nach `id`.
- `deleteGame(id)` löscht nach `id`.
- Alle Funktionen geben den unverarbeiteten Supabase-Query beziehungsweise dessen Promise-Ergebnis zurück.
- Der Service wird nirgends verwendet.

**Fehlende Funktionalität**

- Eindeutiger Rückgabevertrag für erfolgreiche Daten.
- Einheitliches Werfen oder Normalisieren von Supabase-Fehlern.
- Auswahl der tatsächlich benötigten Felder.
- Rückgabe des erzeugten oder aktualisierten Datensatzes.
- Nachweis, dass eine Mutation tatsächlich genau einen Datensatz betroffen hat.
- Abgleich des Sortierfelds: Der Service verwendet `date`, das Dashboard dagegen `start_time`.
- Validierung beziehungsweise Normalisierung des Payloads.

**Abhängigkeiten**

- `src/lib/supabase.js`.
- Tabelle `games` und deren nicht im Repository dokumentierte RLS- und Constraint-Regeln.

### `src/store/useDashboardStore.js`

**Aktuelle Aufgabe**

- Zentraler Zustand für Spiele, Teams, Rollen, Helferzuordnungen und Dashboard-Filter.
- Initiales Laden der Dashboard-Daten.
- Neuladen der Helferzuordnungen.
- Berechnung der gefilterten Spiele.

**Tatsächlicher Implementierungsstand**

- Importiert Supabase direkt.
- Enthält `games`, `teams`, `roles`, `assignments`, `selectedTeam` und `selectedCategory`.
- `loadData()` liest vier Tabellen sequenziell und ohne Fehlerprüfung.
- `reloadAssignments()` liest die Helferzuordnungen erneut und ohne Fehlerprüfung.
- Enthält keine Admin- oder Spiele-Mutationsaktionen.
- Enthält keine Lade-, Speicher- oder Fehlerzustände.

**Fehlende Funktionalität**

- Service-basierte Aktionen `loadGames`, `createGame`, `updateGame` und `deleteGame`.
- Für den Adminbereich ein separat auswertbarer Lade- und Fehlerzustand.
- Ein definierter Refresh der gemeinsamen `games`-Liste nach jeder Mutation.
- Fehlerweitergabe an die aufrufende Seite.
- Schutz vor parallelem Doppelspeichern.
- Belastbarer Fallback bei Supabase-Fehlern; Supabase kann `data: null` liefern, wofür der aktuelle Destructuring-Standard nicht greift.

**Abhängigkeiten**

- Zustand `create`.
- Direkter Supabase-Client.
- Wird von `App`, `KPISection`, `FilterBar` und `MatchCard` verwendet.
- `gameService` wird aktuell nicht verwendet.

### `src/App.jsx` und App-Routing

**Aktuelle Aufgabe**

- Ist gleichzeitig Anwendungsshell und einzige Dashboard-Seite.
- Lädt Daten und rendert die komplette öffentliche Oberfläche.

**Tatsächlicher Implementierungsstand**

- Rendert `Sidebar`, `Topbar`, `KPISection`, `FilterBar` und MatchCards.
- Ruft `loadData()` einmal beim Mounten auf.
- Enthält keine Routen, Pfadauswertung oder Seitenumschaltung.
- `package.json` und `package-lock.json` enthalten kein Routing-Paket.

**Fehlende Funktionalität**

- Trennung von Anwendungsshell und Dashboard-Seite.
- Route für das Dashboard.
- Route für die Spielverwaltung.
- Fallback für unbekannte Routen.
- Erreichbarkeit der Adminseite nach Browser-Reload.
- Route-abhängige aktive Navigation.

**Abhängigkeiten**

- React `useEffect`.
- `useDashboardStore`.
- Alle öffentlichen Dashboard-Komponenten.
- Künftig: eine Routing-Lösung und `AdminGamesPage`.

### `src/components/Sidebar.jsx`

**Aktuelle Aufgabe**

- Stellt die visuelle Hauptnavigation dar.

**Tatsächlicher Implementierungsstand**

- Rendert Schaltflächen für Dashboard, Kalender, Helfer, Teams, Spiele und Kalenderimport.
- Alle Einträge sind einfache `button`-Elemente ohne `onClick`, Link oder Ziel.
- „Dashboard“ ist unabhängig vom aktuellen Zustand immer als aktiv markiert.

**Fehlende Funktionalität**

- Navigation zum Dashboard und zur Spielverwaltung.
- Ableitung des aktiven Eintrags aus der aktuellen Route.
- Semantische Links und Tastaturverhalten.
- Definiertes Verhalten für noch nicht implementierte Ziele.

**Abhängigkeiten**

- `lucide-react`.
- Aktuell keine Abhängigkeit zu App, Store oder Routing.
- Künftig: Routing-Link-Komponenten beziehungsweise eine explizite Navigationsschnittstelle.

### `src/components/Topbar.jsx`

**Aktuelle Aufgabe**

- Zeigt Überschrift und Versionsuntertitel.

**Tatsächlicher Implementierungsstand**

- Inhalt ist vollständig statisch: „TV Homburg Dashboard“ und „V24 CORE MERGE“.
- Nimmt keine Props entgegen.

**Fehlende Funktionalität**

- Seitenspezifischer Titel für die Spielverwaltung.
- Optionaler Untertitel oder Aktionsbereich, etwa „Spiel anlegen“.

**Abhängigkeiten**

- Nur Reacts JSX-Transformation und Tailwind-Klassen.
- Künftig: reine Props; keine Store- oder Service-Abhängigkeit erforderlich.

### `src/components/admin/GameTable.jsx`

**Aktuelle Aufgabe**

- Soll die Spiele im Adminbereich tabellarisch darstellen.

**Tatsächlicher Implementierungsstand**

- Rendert ausschließlich den Text „GameTable“.
- Hat keine Props, Daten oder Aktionen.

**Fehlende Funktionalität**

- Spalten für Zeitpunkt, Team, Gegner und Heim-/Auswärtsspiel.
- Zuordnung von `team_id` zum Teamnamen.
- Aktionen zum Bearbeiten und Löschen.
- Lade-, Leer- und gegebenenfalls Fehlerdarstellung.
- Stabile Keys und verständliche Datumsformatierung.

**Abhängigkeiten**

- Aktuell keine.
- Künftig ausschließlich über Props: `games`, `teams`, `loading`, `onEdit`, `onDelete`.
- Darf nicht selbst auf Supabase oder den Store zugreifen.

### `src/components/admin/GameForm.jsx`

**Aktuelle Aufgabe**

- Soll das gemeinsame Formular zum Anlegen und Bearbeiten eines Spiels werden.

**Tatsächlicher Implementierungsstand**

- Rendert ausschließlich den Text „GameForm“.
- Hat keine Felder, Props oder Validierung.

**Fehlende Funktionalität**

- Kontrollierte Felder für `team_id`, `start_time`, `opponent` und `is_home`.
- Initialwerte für den Bearbeitungsmodus.
- Clientseitige Pflichtfeld- und Datumsvalidierung.
- Normalisierung des Gegnernamens.
- Korrekte Umwandlung zwischen `datetime-local` und dem bestätigten Datenbanktyp.
- Speichern-, Abbrechen- und Ladeverhalten.
- Feldbezogene und serverseitige Fehlermeldungen.
- Deaktivierung während eines laufenden Speichervorgangs.

**Abhängigkeiten**

- Aktuell keine.
- Künftig über Props: `teams`, `initialGame`, `mode`, `saving`, `error`, `onSubmit`, `onCancel`.
- Darf nicht selbst auf Supabase oder den Store zugreifen.

### `src/components/admin/DeleteGameDialog.jsx`

**Aktuelle Aufgabe**

- Soll das Löschen eines Spiels bestätigen.

**Tatsächlicher Implementierungsstand**

- Gibt immer `null` zurück.
- Hat keine Props, Darstellung oder Aktion.

**Fehlende Funktionalität**

- Sichtbarer, zugänglicher Bestätigungsdialog.
- Eindeutige Anzeige des betroffenen Spiels.
- Bestätigen und Abbrechen.
- Lade- und Fehlerzustand.
- Fokusführung und Schließen per Escape.
- Behandlung von Spielen mit vorhandenen `helper_assignments`.

**Abhängigkeiten**

- Aktuell keine.
- Künftig über Props: `game`, `open`, `deleting`, `error`, `onConfirm`, `onCancel`.
- Darf nicht selbst auf Supabase oder den Store zugreifen.

## 4. Ergebnis der Architekturprüfungen

| Prüfpunkt | Ergebnis | Beleg im aktuellen Code |
| --- | --- | --- |
| Existiert Routing? | Nein | `App` rendert nur das Dashboard; kein Router-Paket und keine Routen vorhanden. |
| Existiert Navigation? | Nur visuell | Sidebar-Einträge sind Buttons ohne Links oder Eventhandler. |
| Existiert Admin-Store-Anbindung? | Nein | `AdminGamesPage` und Admin-Komponenten importieren den Store nicht. |
| Existiert ein Spiele-Service? | Formal ja, praktisch ungenutzt | Vier CRUD-Funktionen existieren, werden aber nirgends importiert. |
| Existiert initialer Dashboard-Refresh? | Einmalig | `App` ruft `loadData()` einmal beim Mounten auf. |
| Existiert Refresh nach Helferänderungen? | Ja | `MatchCard` ruft nach Mutationen `reloadAssignments()` auf. |
| Existiert Refresh nach Spieleänderungen? | Nein | Es gibt keine Spielemutation und keine dedizierte `loadGames`-Aktion. |
| Existiert Fehlerbehandlung im Spiele-Service? | Nein | Supabase-Ergebnisse werden unverarbeitet zurückgegeben. |
| Existiert Fehlerbehandlung im Store? | Nein | Fehlerfelder werden nicht gelesen; Lade- und Fehlerzustände fehlen. |
| Existiert Fehlerbehandlung im Adminbereich? | Nein | Der Adminbereich ist ein statischer Platzhalter. |
| Existieren automatisierte Tests? | Nein | Kein Testskript und keine Testdateien vorhanden. |

## 5. Ziel-Datenfluss für das Spiele-CRUD

Der spätere CRUD-Datenfluss soll ohne direkte Supabase-Zugriffe aus Pages oder Admin-Komponenten umgesetzt werden:

```text
Supabase-Tabelle games
    ↑↓
gameService
    - kennt Abfragen und Supabase-Fehler
    - liefert Daten oder wirft einen normalisierten Fehler
    ↑↓
useDashboardStore
    - hält games als gemeinsame Datenquelle
    - verwaltet Loading und Error
    - lädt nach jeder Mutation die Spiele neu
    ↑↓
AdminGamesPage
    - orchestriert Tabellen-, Formular- und Dialogzustand
    - ruft ausschließlich Store-Aktionen auf
    ↓
GameTable / GameForm / DeleteGameDialog
    - erhalten Daten und Callbacks über Props
    - greifen weder auf Store noch Supabase zu
    ↓
Store-Update nach erfolgreichem CRUD
    ↓
DashboardPage, KPISection und MatchCard rendern dieselbe games-Liste neu
```

## 6. Risiken und vor der Implementierung zu klärende Punkte

### Blockierende Risiken

1. **Kein verifizierbares Datenbankschema:** Im Repository fehlen Migrationen und Schema-Dateien. Vor CRUD müssen Typen, Nullbarkeit, Fremdschlüssel und Constraints für `games` bestätigt werden.
2. **`date` gegen `start_time`:** `gameService` sortiert nach `date`, das Dashboard zeigt `start_time`. Das kanonische Feld muss vor der ersten Service-Änderung feststehen.
3. **Keine Admin-Autorisierung:** Das Frontend hat keine Authentifizierung. Offene RLS-Schreibrechte würden jedem Besucher Spieleänderungen erlauben; geschlossene RLS-Rechte würden das CRUD vollständig blockieren. Eine einfache, verbindliche Admin-Zugriffsstrategie ist vor der Freigabe erforderlich, auch wenn komplexe Rechteverwaltung nicht zum MVP gehört.
4. **Supabase nur als Platzhalter:** Mit `YOUR_PROJECT` und `YOUR_ANON_KEY` ist kein End-to-End-Test gegen die Datenbank möglich.
5. **Löschen mit Helferzuordnungen:** Das Verhalten des Fremdschlüssels `helper_assignments.game_id` ist unbekannt. Es muss entschieden werden, ob Löschen blockiert, Zuordnungen kaskadiert löscht oder nur Spiele ohne Zuordnungen erlaubt.

### Weitere technische Risiken

- Supabase kann bei Fehlern `data: null` liefern; der aktuelle Store erwartet Arrays.
- IDs aus HTML-Selects sind Zeichenketten. Bei numerischen Datenbank-IDs können die strikten Vergleiche im Store fehlschlagen.
- Ohne expliziten Refresh bleiben Dashboard, KPIs und MatchCards nach CRUD veraltet.
- `createGame` und `updateGame` akzeptieren aktuell beliebige Objektfelder.
- Ein nur clientseitiger Adminschutz wäre keine Sicherheitsgrenze.
- BrowserRouter-Routen benötigen Server-Fallback-Konfiguration, die im Repository nicht existiert.
- Es fehlen Tests für Services, Store, Navigation, Formularvalidierung und CRUD-Zustände.
- Im Arbeitsbaum sind bereits die Repository-Bereinigung (`.gitignore` und 7.757 vorgemerkte `node_modules`-Entfernungen) sowie die unversionierte `PROJECT.md` vorhanden. Diese Änderungen gehören nicht zu Sprint 1 Phase A und dürfen nicht versehentlich verändert oder verworfen werden.

## 7. Konkreter Implementierungsplan

Jeder Schritt ist einzeln abschließbar und besitzt einen eigenen Prüfnachweis. Der nächste Schritt beginnt erst, wenn der vorherige Test bestanden ist.

### Schritt 1 – Datenbankvertrag und Admin-Schreibrechte verbindlich klären

**Änderung**

- In Supabase die Definition von `games` für `id`, `team_id`, `start_time`, `opponent` und `is_home` prüfen.
- Festlegen, ob `date` existiert oder vollständig durch `start_time` ersetzt wird.
- Fremdschlüsselverhalten zwischen `games`, `teams` und `helper_assignments` prüfen.
- Festlegen, wie Admin-Schreibrechte über Supabase Auth und RLS abgesichert werden.
- Die bestätigte Struktur als Migration beziehungsweise versionierte Schema-Dokumentation in einem Folgeschritt ins Repository aufnehmen; keine Zugangsdaten eintragen.

**Betroffene Bereiche**

- Supabase-Schema und RLS.
- Später `src/services/gameService.js` und `src/components/admin/GameForm.jsx`.

**Unabhängiger Test**

- Ein autorisierter Admin kann einen Testdatensatz lesen, anlegen, ändern und löschen.
- Ein nicht autorisierter öffentlicher Client kann Spiele lesen, aber nicht anlegen, ändern oder löschen.
- Das definierte Verhalten beim Löschen eines Spiels mit Helferzuordnungen ist reproduzierbar.

### Schritt 2 – `gameService` auf einen eindeutigen Vertrag bringen

**Änderung**

- `getGames()` auf die bestätigten Felder begrenzen und nach dem kanonischen Zeitfeld sortieren.
- `createGame(payload)` so implementieren, dass der neu erzeugte Datensatz zurückgegeben wird.
- `updateGame(id, payload)` so implementieren, dass genau ein aktualisierter Datensatz zurückgegeben wird.
- `deleteGame(id)` so implementieren, dass ein fehlendes oder nicht löschbares Spiel erkennbar ist.
- In jeder Funktion Supabase-`error` prüfen und werfen; Pages dürfen keine Supabase-Antwortobjekte auswerten müssen.
- Nur `team_id`, `start_time`, `opponent` und `is_home` als schreibbare Felder zulassen.

**Betroffene Datei**

- `src/services/gameService.js`

**Unabhängiger Test**

- Jede der vier Funktionen liefert bei Erfolg den dokumentierten Wert.
- Eine ungültige ID und eine von RLS abgelehnte Mutation erzeugen einen fangbaren Fehler.
- `getGames()` liefert Spiele in der erwarteten zeitlichen Reihenfolge.
- `npm run build` bleibt erfolgreich.

### Schritt 3 – Spieleaktionen in den gemeinsamen Zustand-Store integrieren

**Änderung**

- `gameService` in `useDashboardStore` importieren.
- Zustände `gamesLoading`, `gamesSaving` und `gamesError` ergänzen.
- Aktionen `loadGames`, `createGame`, `updateGame` und `deleteGame` ergänzen.
- Jede Mutation wartet auf den Service und ruft danach `loadGames()` auf.
- Fehler im Store als verständliche Meldung speichern und zusätzlich an `AdminGamesPage` weiterwerfen.
- `loadData()` für den Spieleanteil auf `loadGames()` umstellen, damit es nur einen Leseweg für `games` gibt.
- Bestehende Filter- und Dashboard-Funktionen unverändert erhalten.

**Betroffene Datei**

- `src/store/useDashboardStore.js`

**Unabhängiger Test**

- `loadGames()` füllt `games` und beendet den Ladezustand.
- Jede Mutation aktualisiert anschließend dieselbe `games`-Liste.
- Bei einem Servicefehler bleibt die bestehende Liste erhalten und `gamesError` ist gesetzt.
- Team- und Kategoriefilter funktionieren weiterhin.
- `npm run build` bleibt erfolgreich.

### Schritt 4 – Echtes App-Routing und erreichbare Navigation einführen

**Änderung**

- Als einzige begründete neue Laufzeitabhängigkeit `react-router-dom` ergänzen und im Lockfile festhalten.
- Wegen der fehlenden Server-Rewrite-Konfiguration zunächst `HashRouter` verwenden.
- Die bestehende Dashboard-Darstellung unverändert in `src/pages/DashboardPage.jsx` verschieben.
- In `App.jsx` die gemeinsame Shell und folgende Routen definieren:
  - `/` → `DashboardPage`
  - `/admin/games` → `AdminGamesPage`
  - unbekannte Route → Weiterleitung auf `/`
- In `Sidebar` Dashboard und Spiele als echte Navigationslinks umsetzen.
- Den aktiven Zustand aus der Route statt aus einem fest gesetzten Prop ableiten.
- Noch nicht implementierte Sidebar-Ziele ohne falsche Navigation als deaktiviert kennzeichnen.

**Betroffene Dateien**

- `package.json`
- `package-lock.json`
- `src/main.jsx`
- `src/App.jsx`
- `src/components/Sidebar.jsx`
- `src/pages/DashboardPage.jsx` (neu)

**Unabhängiger Test**

- Dashboard ist unter `#/` erreichbar und verhält sich wie zuvor.
- „Spiele“ öffnet `#/admin/games`.
- Browser-Reload auf `#/admin/games` zeigt erneut die Adminseite.
- Der jeweils aktive Sidebar-Eintrag ist korrekt.
- Eine unbekannte Hash-Route führt zum Dashboard.
- `npm run build` bleibt erfolgreich.

### Schritt 5 – `Topbar` konfigurierbar machen

**Änderung**

- `Topbar` erhält Props für `title`, `subtitle` und optional `actions`.
- Dashboard verwendet die bisherigen Texte als Defaults oder übergibt sie explizit.
- AdminGamesPage verwendet „Spielverwaltung“ und stellt „Spiel anlegen“ im Aktionsbereich bereit.

**Betroffene Dateien**

- `src/components/Topbar.jsx`
- `src/pages/DashboardPage.jsx`
- `src/pages/AdminGamesPage.jsx`

**Unabhängiger Test**

- Das Dashboard zeigt unverändert seinen bisherigen Titel.
- Die Adminseite zeigt „Spielverwaltung“ und genau eine sichtbare Aktion „Spiel anlegen“.
- `npm run build` bleibt erfolgreich.

### Schritt 6 – Read-only-Spielverwaltung und `GameTable` fertigstellen

**Änderung**

- `AdminGamesPage` bindet `games`, `teams`, `gamesLoading`, `gamesError` und die Ladeaktionen aus dem Store an.
- Beim Mounten werden Spiele und, falls noch nicht vorhanden, Teams geladen.
- `GameTable` erhält ausschließlich Props.
- Spalten: Datum/Uhrzeit aus `start_time`, Mannschaft, Gegner, Heim/Auswärts und Aktionen.
- Teamname wird über `team_id` aus `teams` aufgelöst.
- Ladezustand, leere Liste und Ladefehler erhalten jeweils eine eigene sichtbare Darstellung.
- Bearbeiten- und Löschen-Schaltflächen rufen zunächst nur die übergebenen Callbacks auf.

**Betroffene Dateien**

- `src/pages/AdminGamesPage.jsx`
- `src/components/admin/GameTable.jsx`
- gegebenenfalls `src/store/useDashboardStore.js` für eine dedizierte `loadTeams`-Aktion

**Unabhängiger Test**

- Vorhandene Spiele erscheinen in der festgelegten Reihenfolge.
- Teamname, Gegner, Zeitpunkt und Heim-/Auswärtsstatus sind korrekt.
- Leere Tabelle, Ladezustand und Supabase-Fehler sind unterscheidbar.
- Klicks auf Bearbeiten und Löschen liefern jeweils das richtige Spiel an die Page.
- `npm run build` bleibt erfolgreich.

### Schritt 7 – Anlegen mit `GameForm` implementieren

**Änderung**

- `GameForm` als kontrolliertes Formular mit `team_id`, `start_time`, `opponent` und `is_home` umsetzen.
- Validieren:
  - Team ist ausgewählt.
  - Zeitpunkt ist vorhanden und gültig.
  - Gegner ist nach `trim()` nicht leer.
  - `is_home` wird als Boolean übergeben.
- Datum gemäß dem in Schritt 1 bestätigten Datenbanktyp normalisieren.
- `AdminGamesPage` verwaltet den Modus „create“, öffnet und schließt das Formular und ruft die Store-Aktion auf.
- Formular nur nach erfolgreichem Speichern schließen.
- Während des Speicherns alle konkurrierenden Aktionen deaktivieren.

**Betroffene Dateien**

- `src/components/admin/GameForm.jsx`
- `src/pages/AdminGamesPage.jsx`
- `src/store/useDashboardStore.js`
- `src/services/gameService.js`

**Unabhängiger Test**

- Ungültige Eingaben verhindern den Serviceaufruf und zeigen feldbezogene Meldungen.
- Ein gültiges Spiel wird genau einmal angelegt.
- Das neue Spiel erscheint ohne Browser-Reload in der Tabelle.
- Nach Navigation zum Dashboard erscheint es dort ebenfalls ohne erneute Vollseitenladung.
- Ein Supabase-Fehler lässt das Formular offen und zeigt eine verständliche Meldung.
- `npm run build` bleibt erfolgreich.

### Schritt 8 – Bearbeiten mit demselben `GameForm` implementieren

**Änderung**

- `AdminGamesPage` verwaltet `selectedGame` und den Modus „edit“.
- `GameForm` setzt beim Wechsel zu einem Spiel alle bestätigten Felder als Initialwerte.
- `start_time` wird korrekt in den lokalen `datetime-local`-Wert und zurück konvertiert.
- Speichern ruft `updateGame(selectedGame.id, payload)` auf.
- Abbrechen verwirft lokale Formularänderungen.

**Betroffene Dateien**

- `src/components/admin/GameForm.jsx`
- `src/components/admin/GameTable.jsx`
- `src/pages/AdminGamesPage.jsx`
- `src/store/useDashboardStore.js`

**Unabhängiger Test**

- Bearbeiten öffnet genau den ausgewählten Datensatz.
- Abbrechen verändert weder Store noch Datenbank.
- Speichern aktualisiert Tabelle und Dashboard ohne Browser-Reload.
- Zeitzone und Uhrzeit bleiben bei Öffnen und Speichern unverändert.
- Ein Supabase-Fehler überschreibt die sichtbaren Daten nicht.
- `npm run build` bleibt erfolgreich.

### Schritt 9 – Löschen mit `DeleteGameDialog` implementieren

**Änderung**

- Dialog zeigt Mannschaft, Gegner und Zeitpunkt des ausgewählten Spiels.
- `AdminGamesPage` verwaltet das zu löschende Spiel.
- Bestätigen ruft die Store-Aktion `deleteGame(id)` auf.
- Dialog schließt nur nach erfolgreichem Löschen.
- Fehler, insbesondere vorhandene Helferzuordnungen oder fehlende Rechte, bleiben sichtbar.
- Bestätigen ist während des Löschens deaktiviert.
- Escape und Abbrechen schließen ohne Mutation.

**Betroffene Dateien**

- `src/components/admin/DeleteGameDialog.jsx`
- `src/components/admin/GameTable.jsx`
- `src/pages/AdminGamesPage.jsx`
- `src/store/useDashboardStore.js`

**Unabhängiger Test**

- Abbrechen und Escape löschen nichts.
- Bestätigen löscht genau das ausgewählte zulässige Spiel.
- Tabelle und Dashboard entfernen das Spiel ohne Browser-Reload.
- Ein durch Fremdschlüssel oder RLS blockiertes Löschen zeigt einen verständlichen Fehler und lässt den Dialog offen.
- `npm run build` bleibt erfolgreich.

### Schritt 10 – Refresh, Fehlerzustände und Nebenwirkungen vollständig prüfen

**Änderung**

- Nach Create, Update und Delete ist `loadGames()` der einzige Refresh-Weg.
- Adminseite und Dashboard verwenden dieselbe Store-Liste; keine zweite lokale Spielekopie anlegen.
- Fehler beim Laden dürfen eine bereits geladene Liste nicht durch `null` ersetzen.
- Schnelle Doppelklicks dürfen keine doppelten Mutationen auslösen.
- Beim Routenwechsel dürfen Formular- und Dialogzustände nicht versehentlich bestehen bleiben.
- Bestehende Helferfunktionen, Filter, KPIs und MatchCards unverändert regressionsprüfen.

**Betroffene Dateien**

- `src/store/useDashboardStore.js`
- `src/pages/AdminGamesPage.jsx`
- `src/pages/DashboardPage.jsx`
- `src/components/admin/GameForm.jsx`
- `src/components/admin/DeleteGameDialog.jsx`

**Unabhängiger Test**

- Vollständige manuelle Matrix: Laden, Leerzustand, Create, Edit, Delete, Abbrechen, Netzwerkfehler, RLS-Fehler, Fremdschlüsselfehler und schneller Doppelklick.
- Nach jeder erfolgreichen Mutation stimmen Admin-Tabelle, Dashboard, Filter und KPIs überein.
- Bestehendes Ein- und Austragen von Helfern funktioniert weiterhin.
- `npm run build` bleibt erfolgreich.

### Schritt 11 – Automatisierte Tests ergänzen

**Änderung**

- Eine zum Vite-/React-Projekt passende Testkonfiguration ergänzen.
- Service-Tests prüfen Daten- und Fehlerverträge mit gemocktem Supabase-Client.
- Store-Tests prüfen Loading, Error und Refresh nach jeder Mutation mit gemocktem `gameService`.
- Komponenten-Tests prüfen Formularvalidierung, Tabellen-Callbacks und Löschbestätigung.
- Routing-Test prüft Dashboard, Adminroute, Fallback und aktive Sidebar.
- `npm test` als reproduzierbares Skript ergänzen.

**Betroffene Dateien**

- `package.json`
- `package-lock.json`
- Testkonfiguration (neu)
- Tests für `gameService`, Store, Routing und Admin-Komponenten (neu)

**Unabhängiger Test**

- `npm test` läuft ohne Fehler.
- Mindestens die erfolgreichen CRUD-Pfade und alle sichtbaren Fehlerpfade sind abgedeckt.
- `npm run build` bleibt erfolgreich.

### Schritt 12 – Version abschließen

**Änderung**

- Platzhaltertexte und Platzhalterimplementierungen im fertigen Adminbereich entfernen.
- `CHANGELOG.md` für `V24.0.5.1` mit Routing, Navigation, CRUD, Validierung, Fehlerbehandlung und Refresh aktualisieren.
- Keine Zugangsdaten oder `.env`-Inhalte aufnehmen.
- Produktions-Build und alle Tests ausführen.
- Git-Diff darauf prüfen, dass keine bestehenden Dashboard-Funktionen entfernt wurden.

**Betroffene Dateien**

- `CHANGELOG.md`
- Alle in den vorherigen Schritten tatsächlich geänderten Dateien.

**Unabhängiger Test**

- `npm ci` beziehungsweise `npm install` läuft ohne relevante Fehler.
- `npm test` läuft erfolgreich.
- `npm run build` läuft erfolgreich.
- Suche nach den bisherigen Admin-Platzhaltern liefert keinen Treffer.
- `git status` und die Liste aller geänderten Dateien sind dokumentiert.

## 8. Empfohlene Reihenfolge in Kurzform

1. Datenbankschema, Löschregeln und Admin-RLS klären.
2. `gameService` vereinheitlichen.
3. Spiele-CRUD und Refresh in den gemeinsamen Store aufnehmen.
4. Routing, DashboardPage und Sidebar-Navigation herstellen.
5. Topbar konfigurierbar machen.
6. Read-only-Adminseite und GameTable anschließen.
7. Create über GameForm umsetzen.
8. Edit über GameForm umsetzen.
9. DeleteGameDialog und Löschen umsetzen.
10. Refresh- und Fehlerpfade regressionsprüfen.
11. Automatisierte Tests ergänzen.
12. Changelog, Tests, Build und Git-Prüfung abschließen.

## 9. Voraussichtlich betroffene Dateien

### Bestehende Dateien

- `package.json`
- `package-lock.json`
- `CHANGELOG.md`
- `src/main.jsx`
- `src/App.jsx`
- `src/services/gameService.js`
- `src/store/useDashboardStore.js`
- `src/pages/AdminGamesPage.jsx`
- `src/components/Sidebar.jsx`
- `src/components/Topbar.jsx`
- `src/components/admin/GameTable.jsx`
- `src/components/admin/GameForm.jsx`
- `src/components/admin/DeleteGameDialog.jsx`

### Voraussichtlich neue Dateien

- `src/pages/DashboardPage.jsx`
- Testkonfiguration.
- Testdateien für Service, Store, Routing und Admin-Komponenten.
- Versionierte Supabase-Migration oder Schema-Dokumentation, sobald der reale Datenbankvertrag bestätigt ist.

## 10. Buildprüfung

`npm run build` wurde nach Umsetzung von Sprint 1A erfolgreich ausgeführt:

- Vite `5.4.21`
- 1.687 transformierte Module
- Buildzeit: 10,60 Sekunden
- Erzeugte Dateien: `dist/index.html`, ein CSS-Bundle und ein JavaScript-Bundle

`dist/` wird von der vorhandenen `.gitignore` ausgeschlossen.
