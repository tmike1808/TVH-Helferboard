# Changelog

## Unveröffentlicht – Header- und App-Branding
- Dashboard-Titel und motivierenden Vereinsuntertitel gemäß Branding-Vorgabe aktualisiert
- Bereitgestelltes TVH-Logo in Desktop-Sidebar und mobiler Kopfzeile eingebunden
- Sidebar-Branding auf „TVH“ und „Dashboard“ sowie den Primärton Dunkelrot umgestellt
- Keine Funktions-, Logik-, Datenbank-, RLS-, Policy- oder Rechteänderungen vorgenommen

## V24.0.6.2 – Sprint 5 Hierarchische Dashboard-Filter
- Kategorie als stärksten Einfachfilter mit den Zuständen Alle, Aktive und Jugend beibehalten
- Mannschafts- und Helferrollenfilter als zugängliche Mehrfachauswahl ohne neue UI-Abhängigkeit umgesetzt
- Team- und Rollenoptionen dynamisch aus Kategorie, Teams und `helper_roles` abgeleitet
- Ungültige nachgelagerte Team- und Rollenauswahlen bei Kategorieänderungen automatisch bereinigt
- Gleichnamige Rollen kategorieübergreifend einmal angezeigt und je Spielkategorie auf die korrekte Rollen-ID aufgelöst
- Optionalen Filter für Spiele mit mindestens einer offenen ausgewählten Rolle ergänzt; `assignmentCount < slots` bleibt die einzige Offenregel
- Dashboardliste und KPIs konsistent auf denselben gefilterten Spielbestand umgestellt
- Zentralen Filterreset, verständlichen Leerzustand und responsive Multiselect-Popover ergänzt
- 33 automatisierte Filter-, Rollenauflösungs-, Offenstatus-, Reset- und KPI-Tests ergänzt
- Keine Datenbank-, RLS-, Admin-CRUD- oder Importänderungen vorgenommen

## V24.0.6.1 – Sprint 4 RB-2 und kompakte Teamnamen
- Admin-Spieleverwaltung um Checkboxen, Auswahlzähler sowie „Alle auswählen/abwählen“ ergänzt
- Bestätigte Sammellöschung mit begrenzter Spielvorschau, Cascade-Hinweis und mobiler Dialogdarstellung umgesetzt
- Sequenziellen Service-Workflow mit ID-Validierung, Einzelergebnissen, Teilfehlern, Fortschritt und Parallelitätsschutz ergänzt
- Adminliste und Dashboard nach erfolgreichen Teillöschungen ohne Browserreload aktualisiert; fehlgeschlagene Spiele bleiben ausgewählt
- Sichtbare Namen der acht Vereinsmannschaften über eine idempotente Datenmigration auf die bestätigten Kurzformen umgestellt
- `import_name`, Team-IDs, Spielezuordnungen, Helferzuordnungen, RLS und Policies unverändert gelassen
- Seed- und Supabase-Setup-Dokumentation auf die kompakten Teamnamen aktualisiert
- Auswahl-, Sammellösch-, Refresh-, Teilfehler-, Parallelitäts- und Import-Mapping-Tests ergänzt
- RB-1, RB-3, RB-4, RB-5 sowie `minimum_staff` bewusst nicht umgesetzt

## V24.0.6.0 – Sprint 3 Mobile UX / Responsive Fix
- Mobile Navigation als einklappbaren Drawer mit ausreichend großen Touch-Zielen umgesetzt
- KPI-Bereich mobil auf ein belastbares 2×2-Grid und Desktop weiterhin auf vier Spalten umgestellt
- Team- und Kategoriefilter mobil auf volle Breite gestapelt und den bekannten Body-Overflow beseitigt
- MatchCards für lange Team- und Gegnernamen sowie Rollen auf ein responsives 1-/2-/3-/5-Spaltenraster umgestellt
- Anwurfzeit aus `games.start_time` lokal als `HH:mm Uhr` auf Mobil und Desktop ergänzt
- Admin-Listen, Formulare, Dialoge, Login und Importansicht gegen schmale Viewports abgesichert
- Breite Importtabellen weiterhin ausschließlich innerhalb ihres begrenzten Containers horizontal scrollbar gehalten
- Dashboard-Spiele als kleine präsentationale RB-8-Korrektur chronologisch nach `start_time` sortiert
- Drei automatisierte Tests für lokale Datums-/Zeitformatierung ergänzt
- Keine Datenbank-, RLS-, Migrations- oder Importlogik geändert

## V24.0.5.6 – Sprint 2B
- Bestätigten Excel-Import für ausschließlich erneut geprüfte Heimspiele ergänzt
- Vor jeder Mutation vorhandene Spiele erneut geladen und Remote- sowie Dateiduplikate nochmals geprüft
- Zeilenweise Insert-Strategie mit exakten Payload-Feldern, Fortschritt und nachvollziehbaren Teilerfolgen umgesetzt
- Bestätigungsdialog, synchroner Mehrfachauslösungsschutz und verständlicher Abschlussbericht ergänzt
- Admin-Referenzdaten und Dashboard-Store nach erfolgreichen Imports ohne Seitenreload aktualisiert
- Freiwilliges Speichern manueller `import_name`-Zuordnungen ohne Überschreiben vorhandener Aliase vorbereitet
- Keine neue Spiele-Unique-Regel eingeführt, da ohne fachliche Spiel-ID keine zweifelsfrei belastbare Datenbankidentität belegt ist
- Zehn zusätzliche Workflow-, Duplikat-, Payload-, Fehler-, Refresh- und Alias-Tests ergänzt
- Die vollständige `Spiele.xlsx` bleibt bis zur ausdrücklichen Produktivfreigabe unangetastet

## V24.0.5.5 – Sprint 2A
- Geschützte Adminseite „Spielimport“ mit rein clientseitiger `.xlsx`-Dateiauswahl ergänzt
- Excel-Blätter, Spaltenüberschriften, Datum und Anwurfzeit robust normalisiert
- Importvorschau mit Statusübersicht, verständlichen Fehlern und responsive Tabelle mit horizontalem Scrollbereich umgesetzt
- Automatisches Team-Mapping über das neue nullable Feld `teams.import_name` ergänzt
- Eindeutige fallunabhängige Importnamen über einen partiellen Unique-Index abgesichert
- Vier anhand der echten Teamliste und `Spiele.xlsx` belegte Importnamen in Migration und Seed hinterlegt
- Fehlende Jugendteams `mD1`, `mD2`, `wC` und `wE` über eine reine Datenmigration und den Seed ergänzt
- Kein `teams.order_index` erfunden: Das Feld existiert weder im versionierten Schema noch in der aktuellen Instanz
- Lokales manuelles Mapping für alle gleichen Excel-Mannschaftsnamen umgesetzt
- Duplikate gegen vorhandene Supabase-Spiele und innerhalb derselben Datei erkannt
- Kein Schreiben auf `games` oder `teams` aus der Importvorschau; Import bleibt für Sprint 2B deaktiviert
- Neun automatisierte Parser-, Normalisierungs- und Negativtests mit Node Test ergänzt
- `read-excel-file` als einzige neue Laufzeitabhängigkeit ergänzt; die bevorzugte Bibliothek `xlsx` wegen ungefixter hoher Sicherheitsmeldungen verworfen

## V24.0.5.4 – Sprint 1D
- Admin-Spielverwaltung um Bearbeiten und bestätigtes Löschen erweitert
- `gameService` mit strukturierten Update-/Delete-Abläufen und begrenzten Schreib-Payloads vervollständigt
- Gemeinsames `GameForm` für Create und Edit mit vollständiger Vorbelegung
- Eindeutige Bearbeiten-/Löschen-Aktionen in Desktop- und Mobilansicht ergänzt
- Löschdialog mit Spielidentifikation und Hinweis auf kaskadierte Helfereintragungen umgesetzt
- Doppelklickschutz und verständliche Fehlerzustände für Update und Delete ergänzt
- Adminliste und Dashboard-Store werden nach jeder erfolgreichen Spielmutation ohne Seitenreload aktualisiert
- Bestehende Team- und Kategoriefilter bleiben beim Datenrefresh erhalten

## V24.0.5.3 – Sprint 1C.1
- Technische Platzhalterwerte in `helper_roles` durch offizielle Vereinswerte ersetzt
- Rollenbedarf für Aktive auf 1, 1, 2, 4 und 4 Plätze aktualisiert
- Rollenbedarf für Jugend auf 1, 1, 1, 2, 3, 1 und 1 Plätze aktualisiert
- Jugendrolle „Brezeln“ in „Brezeln / Sonstiges“ umbenannt
- Neue reine Datenmigration für bestehende Supabase-Projekte
- Seed-Daten für neu angelegte Datenbanken aktualisiert
- KPI „Offene Dienste“ auf die dynamische Summe der geladenen Rollenplätze umgestellt

## V24.0.5.3 – Sprint 1C
- Admin-Authentifizierung über Supabase Auth mit E-Mail und Passwort
- Adminfreigabe ausschließlich über `public.admin_users`
- Sichere, RLS-taugliche Funktion `public.is_admin()` mit begrenztem Ausführungsrecht
- Insert-, Update- und Delete-Policies für `games`, `teams` und `helper_roles` ausschließlich für freigeschaltete Admins
- Bestehende öffentliche Lese- und Helferrechte unverändert beibehalten
- Kontrollierte Login-Seite ohne Registrierung, Passwort-Reset oder Social Login
- Sessionprüfung beim App-Start und Reaktion auf Auth-Statusänderungen
- Geschützter Adminbereich ohne kurzzeitiges Anzeigen vor abgeschlossener Berechtigungsprüfung
- Logout mit sofortiger lokaler Sperrung und Rückkehr zum Dashboard
- Keine neue Routing- oder State-Abhängigkeit

## DB-0 – Reproduzierbare Supabase-Datenbankgrundlage
- Initiale Migration für `teams`, `games`, `helper_roles` und `helper_assignments`
- UUID-Schlüssel, Fremdschlüssel, Constraints, Zeitstempel und Indizes festgelegt
- `games.start_time` als `timestamptz` und `helper_roles.slots` als Mengenfeld bestätigt
- Nach Spiel-Löschung werden Helferzuordnungen kaskadiert entfernt; Team- und Rollenlöschungen mit Abhängigkeiten werden blockiert
- RLS für alle Tabellen mit öffentlichen Leserechten und öffentlichen Helferaktionen vorbereitet
- Keine anonymen Schreibrechte oder Policies für Spiele und andere Admin-Daten
- Anpassbare Beispielteams und vorläufige Rollen-Slot-Werte in `supabase/seed.sql`
- Einrichtungs- und Sicherheitsanleitung in `SUPABASE_SETUP.md`

## V24.0.5.1 – Sprint 1B
- Funktionales Formular zum Anlegen von Spielen im Adminbereich
- Mannschaftsauswahl aus der vorhandenen `teams`-Tabelle
- Validierung von Datum, Uhrzeit, Mannschaften und Heim-/Auswärtszuordnung
- Lokalzeitbewusste Umwandlung von Datum und Uhrzeit nach `start_time`
- Speichern ausschließlich über `gameService.createGame()`
- Sichtbare Lade-, Erfolgs- und Fehlerzustände mit Doppelklickschutz
- Automatischer Refresh der Adminliste nach erfolgreichem Anlegen
- Aktualisierung der Dashboard-Daten beim nächsten Öffnen
- Supabase-Konfiguration über Vite-Umgebungsvariablen und `.env.example`

## V24.0.5.1 – Sprint 1A.1
- Sprint-1A-Codepfad auf ungenutzte und unnötige Logik geprüft
- Doppelte Datenaufbereitung in GameTable zusammengeführt
- GameTable gegen fehlende games-Props abgesichert
- Redundante State-Updates beim Laden der Adminseite entfernt
- Dashboard-Fehlerbehandlung bewahrt vorhandene Daten und protokolliert Supabase-Fehler
- Unerwartete Promise-Fehler beim initialen Dashboard-Laden werden behandelt

## V24.0.5.1 – Sprint 1A
- Reload-freie Navigation zwischen Dashboard und Spieleverwaltung
- Aktiver Seitenzustand in der Sidebar
- Lesender Admin-Datenfluss über gameService
- Spiele und Teamdaten nach start_time sortiert geladen
- Responsive GameTable mit deutscher Datums- und Uhrzeitdarstellung
- Lade-, Fehler- und Leerzustand der Admin-Spieleübersicht
- Dashboard-Store normalisiert fehlgeschlagene Supabase-Daten auf leere Arrays

## STABILIZATION_01
- Rollensortierung über order_index
- trim() für Helfernamen
- Doppelte Einträge auf derselben Rolle verhindert
- Fehlerbehandlung beim Speichern/Löschen


## V24.0.5
- Grundstruktur Admin Games
- gameService hinzugefügt
- AdminGamesPage angelegt
