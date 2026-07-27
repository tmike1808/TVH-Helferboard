# Changelog

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
