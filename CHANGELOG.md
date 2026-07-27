# Changelog

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
