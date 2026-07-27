# Changelog

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
