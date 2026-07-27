# Supabase-Grundlage einrichten

Diese Anleitung richtet ein neues Supabase-Projekt für das TVH Helferboard ein. In DB-0 wurde kein Remote-Projekt verbunden und kein SQL remote ausgeführt.

Die versionierte Grundlage besteht aus:

- `supabase/migrations/20260727000100_initial_schema.sql`
- `supabase/seed.sql`

Die Migration ist eine einmalig auszuführende Basismigration. `seed.sql` ist für eine leere Datenbank wiederholbar, enthält aber bewusst anpassbare Beispieldaten und vorläufige Slot-Werte.

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
2. Die als Beispiele markierten Teamnamen prüfen und bei Bedarf vor der ersten produktiven Ausführung anpassen.
3. Die vorläufigen Werte von `helper_roles.slots` fachlich festlegen. Der Ausgangswert `1` ist nur der technische Mindestwert und kein bestätigter Vereinsbedarf.
4. Den vollständigen Inhalt in einer neuen SQL-Editor-Abfrage ausführen.

Das Seed-Skript enthält nur Daten und kann wegen `ON CONFLICT` erneut ausgeführt werden. Es aktualisiert dabei die definierten Rollenreihenfolgen und Slot-Werte auf den Inhalt der Datei.

## 4. Project URL und öffentlichen Schlüssel finden

Die Projekt-URL und den clientgeeigneten öffentlichen Schlüssel zeigt Supabase im **Connect**-Dialog. Die Schlüssel sind außerdem unter **Settings → API Keys** verfügbar. Für dieses Frontend wird nur der öffentliche Anon-/Publishable-Schlüssel verwendet.

Geheime oder privilegierte Schlüssel dürfen niemals in den Browser, in `.env.example`, in Screenshots, in Reports oder in Git gelangen. Die offiziellen Supabase-Hinweise zu Schlüsseln stehen unter [Understanding API keys](https://supabase.com/docs/guides/getting-started/api-keys).

## 5. `.env.local` anlegen

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

## 6. Tabellen und Seed-Daten prüfen

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
select category, name, slots, order_index
from public.helper_roles
order by category, order_index;
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

## 7. Aktive RLS-Regeln

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

## 8. Warum Admin-Schreiboperationen noch nicht funktionieren

Sprint 1B enthält im Frontend bereits `gameService.createGame()`, aber noch keine Admin-Authentifizierung. Die sichere DB-0-Grundlage erteilt anonymen Clients absichtlich kein Schreibrecht auf `games`.

Dadurch wird „Neues Spiel“ gegen diese sichere RLS-Konfiguration mit einem Berechtigungsfehler scheitern, bis ein späterer Sprint:

1. Supabase Auth für Administratoren einführt,
2. eine belastbare Adminrolle beziehungsweise einen überprüfbaren Claim festlegt und
3. darauf begrenzte RLS-Policies für Admin-Schreiboperationen als neue Migration ergänzt.

Dieser Konflikt darf nicht durch eine öffentliche Insert-Policy auf `games` oder durch einen privilegierten Schlüssel im Frontend umgangen werden.

## 9. Admin-Authentifizierung einrichten

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

## 10. Bekannte MVP-Sicherheitsgrenzen

- Helfer besitzen noch keine Konten oder Austrage-Tokens. Deshalb kann die öffentliche Delete-Policy technisch jede sichtbare Helferzuordnung anhand ihrer ID löschen. Ein späteres Besitz- oder Tokenkonzept sollte dies einschränken.
- `helper_assignments` ist gemäß MVP-Vorgabe öffentlich lesbar; damit sind eingetragene Helfernamen öffentlich. Datenschutz und Namenshinweise müssen vor dem öffentlichen Betrieb fachlich bewertet werden.
- Die Datenbank verhindert namensgleiche Doppeleinträge je Spiel und Rolle ohne Beachtung der Groß-/Kleinschreibung. Sie verhindert noch keine konkurrierende Überbelegung über `helper_roles.slots`.
- Die vorläufigen Slot-Werte im Seed sind vor produktiver Nutzung zu ersetzen.
