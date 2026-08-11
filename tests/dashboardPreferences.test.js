import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
  createDashboardPreferences,
  DASHBOARD_PREFERENCES_KEY,
  deleteDashboardPreferences,
  readDashboardPreferences,
  resolveDashboardPreferences,
  sanitizeDashboardPreferences,
  saveDashboardPreferences
} from '../src/services/dashboardPreferences.js'
import { resetDashboardFilters } from '../src/utils/dashboardFilters.js'

const teams = [
  { id: 'h1', name: 'Herren 1', category: 'Aktive' },
  { id: 'h2', name: 'Herren 2', category: 'Aktive' },
  { id: 'me', name: 'mE', category: 'Jugend' },
  { id: 'wd', name: 'wD', category: 'Jugend' }
]

const roles = [
  { id: 'a-time', name: 'Zeitnehmer', category: 'Aktive' },
  { id: 'a-secretary', name: 'Sekretär', category: 'Aktive' },
  { id: 'a-wipe', name: 'Wischer', category: 'Aktive' },
  { id: 'j-time', name: 'Zeitnehmer', category: 'Jugend' },
  { id: 'j-secretary', name: 'Sekretär', category: 'Jugend' },
  { id: 'j-cake', name: 'Kuchen', category: 'Jugend' }
]

function createMemoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial))

  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null
    },
    setItem(key, value) {
      values.set(key, String(value))
    },
    removeItem(key) {
      values.delete(key)
    }
  }
}

function fullFilters(overrides = {}) {
  return {
    ...resetDashboardFilters(),
    ...overrides
  }
}

test('1. speichert das kleine versionierte Schema', () => {
  const storage = createMemoryStorage()
  const result = saveDashboardPreferences(fullFilters({
    selectedCategory: 'Jugend',
    selectedTeamIds: ['me', 'wd'],
    selectedRoleNames: ['Kuchen'],
    openSelectedRolesOnly: true
  }), storage)

  assert.equal(result.ok, true)
  assert.deepEqual(JSON.parse(storage.getItem(DASHBOARD_PREFERENCES_KEY)), {
    version: 1,
    category: 'Jugend',
    teamIds: ['me', 'wd'],
    roleNames: ['kuchen'],
    showOnlyOpenRoles: true
  })
})

test('2. lädt eine gültige Voreinstellung', () => {
  const storage = createMemoryStorage()
  saveDashboardPreferences(fullFilters({ selectedCategory: 'Aktive' }), storage)
  assert.equal(readDashboardPreferences(storage).status, 'valid')
})

test('3. unterscheidet fehlende Voreinstellung', () => {
  assert.deepEqual(readDashboardPreferences(createMemoryStorage()), {
    status: 'missing',
    preferences: null
  })
})

test('4. ungültiges JSON wird sicher ignoriert', () => {
  const storage = createMemoryStorage({
    [DASHBOARD_PREFERENCES_KEY]: '{kaputt'
  })
  assert.equal(readDashboardPreferences(storage).status, 'invalid')
})

test('5. unbekannte Schemaversion wird ignoriert', () => {
  assert.equal(sanitizeDashboardPreferences({
    version: 2,
    category: 'all',
    teamIds: [],
    roleNames: [],
    showOnlyOpenRoles: false
  }), null)
})

test('6. fehlende Pflichtfelder werden ignoriert', () => {
  assert.equal(sanitizeDashboardPreferences({ version: 1 }), null)
})

test('7. unbekannte Kategorie wird ignoriert', () => {
  assert.equal(sanitizeDashboardPreferences({
    version: 1,
    category: 'Senioren',
    teamIds: [],
    roleNames: [],
    showOnlyOpenRoles: false
  }), null)
})

test('8. falsche Arraytypen werden ignoriert', () => {
  assert.equal(sanitizeDashboardPreferences({
    version: 1,
    category: 'all',
    teamIds: 'h1',
    roleNames: [],
    showOnlyOpenRoles: false
  }), null)
})

test('9. falscher Boolean-Typ wird ignoriert', () => {
  assert.equal(sanitizeDashboardPreferences({
    version: 1,
    category: 'all',
    teamIds: [],
    roleNames: [],
    showOnlyOpenRoles: 'ja'
  }), null)
})

test('10. teilweise ungültige Arraywerte werden deterministisch bereinigt', () => {
  assert.deepEqual(sanitizeDashboardPreferences({
    version: 1,
    category: 'Aktive',
    teamIds: ['h1', '', null, 'h1'],
    roleNames: [' Zeitnehmer ', 4, 'ZEITNEHMER'],
    showOnlyOpenRoles: true
  }), {
    version: 1,
    category: 'Aktive',
    teamIds: ['h1'],
    roleNames: ['zeitnehmer'],
    showOnlyOpenRoles: true
  })
})

test('11. nicht mehr vorhandene Teams werden entfernt', () => {
  const result = resolveDashboardPreferences({
    version: 1,
    category: 'Aktive',
    teamIds: ['h1', 'entfernt'],
    roleNames: [],
    showOnlyOpenRoles: false
  }, teams, roles)
  assert.deepEqual(result.selectedTeamIds, ['h1'])
})

test('12. nicht mehr vorhandene Rollen werden entfernt', () => {
  const result = resolveDashboardPreferences({
    version: 1,
    category: 'Aktive',
    teamIds: [],
    roleNames: ['wischer', 'entfernt'],
    showOnlyOpenRoles: false
  }, teams, roles)
  assert.deepEqual(result.selectedRoleNames, ['wischer'])
})

test('13. Kategorie ist stärker als gespeicherte Teams', () => {
  const result = resolveDashboardPreferences({
    version: 1,
    category: 'Jugend',
    teamIds: ['h1', 'me'],
    roleNames: [],
    showOnlyOpenRoles: false
  }, teams, roles)
  assert.deepEqual(result.selectedTeamIds, ['me'])
})

test('14. Kategorie ist stärker als gespeicherte Rollen', () => {
  const result = resolveDashboardPreferences({
    version: 1,
    category: 'Jugend',
    teamIds: [],
    roleNames: ['wischer', 'kuchen'],
    showOnlyOpenRoles: true
  }, teams, roles)
  assert.deepEqual(result.selectedRoleNames, ['kuchen'])
  assert.equal(result.openSelectedRolesOnly, true)
})

test('15. Offenfilter wird ohne verbleibende Rolle deaktiviert', () => {
  const result = resolveDashboardPreferences({
    version: 1,
    category: 'Jugend',
    teamIds: [],
    roleNames: ['wischer'],
    showOnlyOpenRoles: true
  }, teams, roles)
  assert.equal(result.openSelectedRolesOnly, false)
})

test('16. Spieltagsauswahl wird nie gespeichert', () => {
  const result = createDashboardPreferences(fullFilters({
    selectedMatchdayIds: ['2026-08-29']
  }))
  assert.equal('selectedMatchdayIds' in result, false)
})

test('17. Vergangenheitsfilter wird nie gespeichert', () => {
  const result = createDashboardPreferences(fullFilters({ showPastGames: true }))
  assert.equal('showPastGames' in result, false)
})

test('18. sichtbarer Kalendermonat wird nie gespeichert', () => {
  const result = createDashboardPreferences({
    ...fullFilters(),
    visibleCalendarMonth: '2027-01'
  })
  assert.equal('visibleCalendarMonth' in result, false)
})

test('19. Neuladen setzt vergangene Spiele immer AUS', () => {
  const result = resolveDashboardPreferences({
    version: 1,
    category: 'all',
    teamIds: [],
    roleNames: [],
    showOnlyOpenRoles: false,
    showPastGames: true
  }, teams, roles)
  assert.equal(result.showPastGames, false)
})

test('20. Neuladen setzt Spieltage immer leer', () => {
  const result = resolveDashboardPreferences({
    version: 1,
    category: 'all',
    teamIds: [],
    roleNames: [],
    showOnlyOpenRoles: false,
    selectedMatchdayIds: ['2026-08-29']
  }, teams, roles)
  assert.deepEqual(result.selectedMatchdayIds, [])
})

test('21. ohne Voreinstellung gilt der vollständige Standardzustand', () => {
  assert.deepEqual(resolveDashboardPreferences(null, teams, roles), resetDashboardFilters())
})

test('22. Schreibfehler wird ohne Ausnahme gemeldet', () => {
  const storage = {
    setItem() { throw new Error('gesperrt') }
  }
  assert.deepEqual(saveDashboardPreferences(fullFilters(), storage), {
    ok: false,
    error: 'write-failed'
  })
})

test('23. Lesefehler wird ohne Ausnahme abgefangen', () => {
  const storage = {
    getItem() { throw new Error('gesperrt') }
  }
  assert.equal(readDashboardPreferences(storage).status, 'read-failed')
})

test('24. Löschfehler wird ohne Ausnahme gemeldet', () => {
  const storage = {
    removeItem() { throw new Error('gesperrt') }
  }
  assert.deepEqual(deleteDashboardPreferences(storage), {
    ok: false,
    error: 'delete-failed'
  })
})

test('25. fehlender Browser-Speicher wird verständlich erkannt', () => {
  assert.equal(readDashboardPreferences(null).status, 'unavailable')
  assert.equal(saveDashboardPreferences(fullFilters(), null).ok, false)
  assert.equal(deleteDashboardPreferences(null).ok, false)
})

test('26. Löschen entfernt ausschließlich den gespeicherten Schlüssel', () => {
  const storage = createMemoryStorage({ anderes: 'bleibt' })
  const currentFilters = fullFilters({ selectedCategory: 'Aktive' })
  saveDashboardPreferences(currentFilters, storage)
  assert.equal(deleteDashboardPreferences(storage).ok, true)
  assert.equal(storage.getItem(DASHBOARD_PREFERENCES_KEY), null)
  assert.equal(storage.getItem('anderes'), 'bleibt')
  assert.equal(currentFilters.selectedCategory, 'Aktive')
})

test('27. Filterreset löscht die gespeicherte Voreinstellung nicht', () => {
  const storage = createMemoryStorage()
  saveDashboardPreferences(fullFilters({ selectedCategory: 'Jugend' }), storage)
  assert.deepEqual(resetDashboardFilters().selectedTeamIds, [])
  assert.equal(readDashboardPreferences(storage).status, 'valid')
})

test('28. Beispiel A Jugend mE und wD wird wiederhergestellt', () => {
  const result = resolveDashboardPreferences({
    version: 1,
    category: 'Jugend',
    teamIds: ['me', 'wd'],
    roleNames: [],
    showOnlyOpenRoles: false
  }, teams, roles)
  assert.equal(result.selectedCategory, 'Jugend')
  assert.deepEqual(result.selectedTeamIds, ['me', 'wd'])
})

test('29. Beispiel B Alle mit Zeitnehmer und Sekretär wird wiederhergestellt', () => {
  const result = resolveDashboardPreferences({
    version: 1,
    category: 'all',
    teamIds: [],
    roleNames: ['zeitnehmer', 'sekretär'],
    showOnlyOpenRoles: false
  }, teams, roles)
  assert.deepEqual(result.selectedRoleNames, ['zeitnehmer', 'sekretär'])
})

test('30. Beispiel C Aktive Herren 1 mit Rollen und Offenfilter bleibt konsistent', () => {
  const result = resolveDashboardPreferences({
    version: 1,
    category: 'Aktive',
    teamIds: ['h1'],
    roleNames: ['zeitnehmer', 'sekretär'],
    showOnlyOpenRoles: true
  }, teams, roles)
  assert.deepEqual(result, {
    selectedCategory: 'Aktive',
    selectedTeamIds: ['h1'],
    showPastGames: false,
    selectedMatchdayIds: [],
    selectedRoleNames: ['zeitnehmer', 'sekretär'],
    openSelectedRolesOnly: true
  })
})

test('31. Kategorie allein durchläuft Speichern und Laden', () => {
  const storage = createMemoryStorage()
  saveDashboardPreferences(fullFilters({ selectedCategory: 'Jugend' }), storage)
  assert.equal(readDashboardPreferences(storage).preferences.category, 'Jugend')
})

test('32. ein Team durchläuft Speichern und Laden', () => {
  const storage = createMemoryStorage()
  saveDashboardPreferences(fullFilters({ selectedTeamIds: ['h1'] }), storage)
  assert.deepEqual(readDashboardPreferences(storage).preferences.teamIds, ['h1'])
})

test('33. mehrere Teams durchlaufen Speichern und Laden', () => {
  const storage = createMemoryStorage()
  saveDashboardPreferences(fullFilters({ selectedTeamIds: ['me', 'wd'] }), storage)
  assert.deepEqual(readDashboardPreferences(storage).preferences.teamIds, ['me', 'wd'])
})

test('34. eine Rolle durchläuft Speichern und Laden', () => {
  const storage = createMemoryStorage()
  saveDashboardPreferences(fullFilters({ selectedRoleNames: ['Zeitnehmer'] }), storage)
  assert.deepEqual(readDashboardPreferences(storage).preferences.roleNames, ['zeitnehmer'])
})

test('35. mehrere Rollen durchlaufen Speichern und Laden', () => {
  const storage = createMemoryStorage()
  saveDashboardPreferences(fullFilters({
    selectedRoleNames: ['Zeitnehmer', 'Sekretär']
  }), storage)
  assert.deepEqual(
    readDashboardPreferences(storage).preferences.roleNames,
    ['zeitnehmer', 'sekretär']
  )
})

test('36. Team und Rollen durchlaufen Speichern und Laden kombiniert', () => {
  const storage = createMemoryStorage()
  saveDashboardPreferences(fullFilters({
    selectedTeamIds: ['h1'],
    selectedRoleNames: ['Zeitnehmer', 'Sekretär']
  }), storage)
  const loaded = readDashboardPreferences(storage).preferences
  assert.deepEqual(loaded.teamIds, ['h1'])
  assert.deepEqual(loaded.roleNames, ['zeitnehmer', 'sekretär'])
})

test('37. Offenfilter durchläuft Speichern und Laden mit gültiger Rolle', () => {
  const storage = createMemoryStorage()
  saveDashboardPreferences(fullFilters({
    selectedRoleNames: ['Zeitnehmer'],
    openSelectedRolesOnly: true
  }), storage)
  assert.equal(
    readDashboardPreferences(storage).preferences.showOnlyOpenRoles,
    true
  )
})

test('38. Schreibfehler besitzt eine verständliche UI-Meldung', () => {
  const dashboardStore = readFileSync(
    new URL('../src/store/useDashboardStore.js', import.meta.url),
    'utf8'
  )
  assert.match(
    dashboardStore,
    /Meine Ansicht konnte in diesem Browser nicht gespeichert werden\./
  )
})
