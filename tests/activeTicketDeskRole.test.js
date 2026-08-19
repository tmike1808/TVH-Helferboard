import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import test from 'node:test'
import { DASHBOARD_EXPORT_COLUMNS } from '../src/utils/dashboardExportModel.js'

const migration = readFileSync(
  new URL(
    '../supabase/migrations/20260819000100_add_active_ticket_desk_role.sql',
    import.meta.url
  ),
  'utf8'
)
const seed = readFileSync(
  new URL('../supabase/seed.sql', import.meta.url),
  'utf8'
)
const app = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8')

test('Migration legt Kasse Eintritt ohne feste ID mit den Vereinswerten an', () => {
  assert.match(migration, /'Kasse Eintritt',[\s\S]*?'Aktive',[\s\S]*?2,[\s\S]*?1,[\s\S]*?4/)
  assert.doesNotMatch(migration, /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i)
  assert.match(migration, /where not exists/i)
})

test('Migration ordnet Verkauf und Ordner nach Kasse Eintritt ein', () => {
  assert.match(migration, /when 'Verkauf' then 5/)
  assert.match(migration, /when 'Ordner' then 6/)
  assert.doesNotMatch(migration, /\b(games|helper_assignments)\b/i)
  assert.doesNotMatch(migration, /\b(policy|grant|revoke|row level security)\b/i)
})

test('Seed enthält den finalen Aktive-Rollenstand in exakter Reihenfolge', () => {
  const activeBlock = seed.slice(
    seed.indexOf("('Zeitnehmer', 'Aktive'"),
    seed.indexOf("('Zeitnehmer', 'Jugend'")
  )

  assert.match(activeBlock, /Zeitnehmer[\s\S]*Sekretär[\s\S]*Wischer[\s\S]*Kasse Eintritt[\s\S]*Verkauf[\s\S]*Ordner/)
  assert.match(activeBlock, /\('Kasse Eintritt', 'Aktive', 2, 1, 4\)/)
  assert.match(activeBlock, /\('Verkauf', 'Aktive', 4, 3, 5\)/)
  assert.match(activeBlock, /\('Ordner', 'Aktive', 4, 3, 6\)/)
})

test('öffentliche App rendert den XLSX-Button vorläufig nicht', () => {
  assert.doesNotMatch(app, /DashboardExportButton/)
})

test('XLSX-Implementierung bleibt vorhanden und auf 13 Spalten eingefroren', () => {
  assert.equal(DASHBOARD_EXPORT_COLUMNS.length, 13)
  assert.equal(
    DASHBOARD_EXPORT_COLUMNS.some(column => column.header === 'Kasse Eintritt'),
    false
  )
  assert.equal(
    existsSync(new URL('../src/components/DashboardExportButton.jsx', import.meta.url)),
    true
  )
  assert.equal(
    existsSync(new URL('../src/services/dashboardExport.js', import.meta.url)),
    true
  )
})
