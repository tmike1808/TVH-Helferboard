import assert from 'node:assert/strict'
import test from 'node:test'
import {
  calculateDashboardKpis,
  countRoleAssignments,
  filterDashboardGames,
  getAvailableRoleOptions,
  getAvailableTeams,
  INITIAL_DASHBOARD_FILTERS,
  isRoleOpen,
  normalizeRoleName,
  pruneSelectedRoleNames,
  pruneSelectedTeamIds,
  reconcileDashboardFilters,
  resetDashboardFilters,
  resolveSelectedRolesForCategory
} from '../src/utils/dashboardFilters.js'

const teams = [
  ['h1', 'Herren 1', 'Aktive'],
  ['h2', 'Herren 2', 'Aktive'],
  ['md1', 'mD1', 'Jugend'],
  ['md2', 'mD2', 'Jugend'],
  ['me', 'mE', 'Jugend'],
  ['wc', 'wC', 'Jugend'],
  ['wd', 'wD', 'Jugend'],
  ['we', 'wE', 'Jugend']
].map(([id, name, category]) => ({ id, name, category }))

const roles = [
  ['a-time', 'Zeitnehmer', 'Aktive', 1],
  ['a-secretary', 'Sekretär', 'Aktive', 1],
  ['a-wipe', 'Wischer', 'Aktive', 2],
  ['a-sale', 'Verkauf', 'Aktive', 4],
  ['a-order', 'Ordner', 'Aktive', 4],
  ['j-time', 'Zeitnehmer', 'Jugend', 1],
  ['j-secretary', 'Sekretär', 'Jugend', 1],
  ['j-referee', 'Schiri', 'Jugend', 1],
  ['j-sale', 'Verkauf', 'Jugend', 2],
  ['j-cake', 'Kuchen', 'Jugend', 3],
  ['j-pretzel', 'Brezeln / Sonstiges', 'Jugend', 1],
  ['j-shirts', 'Trikots', 'Jugend', 1]
].map(([id, name, category, slots]) => ({ id, name, category, slots }))

const games = [
  ['g-h1', 'h1', '2026-08-29T16:30:00.000Z', true],
  ['g-h2', 'h2', '2026-09-05T15:30:00.000Z', true],
  ['g-md1', 'md1', '2026-09-12T08:00:00.000Z', true],
  ['g-wd', 'wd', '2026-09-12T10:30:00.000Z', true],
  ['g-we', 'we', '2026-09-13T08:00:00.000Z', false]
].map(([id, team_id, start_time, is_home]) => ({
  id,
  team_id,
  start_time,
  is_home
}))

function assignment(id, gameId, roleId) {
  return { id, game_id: gameId, role_id: roleId }
}

function filter(overrides = {}) {
  return filterDashboardGames({
    games,
    teams,
    roles,
    assignments: [],
    ...overrides
  })
}

function ids(items) {
  return items.map(item => item.id)
}

test('1. Standardkategorie Alle zeigt alle Spiele', () => {
  assert.deepEqual(ids(filter()), ids(games))
  assert.equal(INITIAL_DASHBOARD_FILTERS.selectedCategory, 'all')
})

test('2. Kategorie Aktive zeigt ausschließlich Aktive-Spiele', () => {
  assert.deepEqual(ids(filter({ selectedCategory: 'Aktive' })), ['g-h1', 'g-h2'])
})

test('3. Kategorie Jugend zeigt ausschließlich Jugendspiele', () => {
  assert.deepEqual(ids(filter({ selectedCategory: 'Jugend' })), ['g-md1', 'g-wd', 'g-we'])
})

test('4. Kategorie Alle bietet alle acht Teams an', () => {
  assert.equal(getAvailableTeams(teams, 'all').length, 8)
})

test('5. Kategorie Aktive bietet nur Aktive-Teams an', () => {
  assert.deepEqual(ids(getAvailableTeams(teams, 'Aktive')), ['h1', 'h2'])
})

test('6. Kategorie Jugend bietet nur Jugendteams an', () => {
  assert.deepEqual(ids(getAvailableTeams(teams, 'Jugend')), ['md1', 'md2', 'me', 'wc', 'wd', 'we'])
})

test('7. ein ausgewähltes Team filtert eindeutig', () => {
  assert.deepEqual(ids(filter({ selectedTeamIds: ['h1'] })), ['g-h1'])
})

test('8. mehrere Teams werden mit OR verknüpft', () => {
  assert.deepEqual(ids(filter({ selectedTeamIds: ['h1', 'wd'] })), ['g-h1', 'g-wd'])
})

test('9. Kategorieänderung entfernt ungültige Teamauswahl', () => {
  assert.deepEqual(
    pruneSelectedTeamIds(['h1', 'md1'], getAvailableTeams(teams, 'Jugend')),
    ['md1']
  )
})

test('10. Kategorieänderung erhält weiterhin gültige Teamauswahl', () => {
  assert.deepEqual(
    pruneSelectedTeamIds(['md1', 'wd'], getAvailableTeams(teams, 'Jugend')),
    ['md1', 'wd']
  )
})

test('11. Kategorie Alle bietet die eindeutige Rollenvereinigung an', () => {
  const options = getAvailableRoleOptions(roles, 'all')
  assert.equal(options.length, 9)
})

test('12. Kategorie Aktive bietet nur Aktive-Rollen an', () => {
  assert.deepEqual(
    getAvailableRoleOptions(roles, 'Aktive').map(option => option.label),
    ['Ordner', 'Sekretär', 'Verkauf', 'Wischer', 'Zeitnehmer']
  )
})

test('13. Kategorie Jugend bietet nur Jugendrollen an', () => {
  assert.deepEqual(
    getAvailableRoleOptions(roles, 'Jugend').map(option => option.label),
    ['Brezeln / Sonstiges', 'Kuchen', 'Schiri', 'Sekretär', 'Trikots', 'Verkauf', 'Zeitnehmer']
  )
})

test('14. gleichnamige Rolle Verkauf erscheint nur einmal', () => {
  const sales = getAvailableRoleOptions(roles, 'all')
    .filter(option => option.value === normalizeRoleName('Verkauf'))
  assert.equal(sales.length, 1)
})

test('15. Kategorieänderung entfernt eine ungültige Rolle', () => {
  assert.deepEqual(
    pruneSelectedRoleNames(
      ['wischer', 'verkauf'],
      getAvailableRoleOptions(roles, 'Jugend')
    ),
    ['verkauf']
  )
})

test('16. gleichnamige gültige Rolle bleibt nach Kategorieänderung erhalten', () => {
  assert.deepEqual(
    pruneSelectedRoleNames(['verkauf'], getAvailableRoleOptions(roles, 'Jugend')),
    ['verkauf']
  )
})

test('17. Rollenfilter mit einer Rolle berücksichtigt die Spielkategorie', () => {
  assert.deepEqual(ids(filter({ selectedRoleNames: ['Wischer'] })), ['g-h1', 'g-h2'])
})

test('18. mehrere Rollen werden mit OR verknüpft', () => {
  assert.deepEqual(ids(filter({ selectedRoleNames: ['Ordner', 'Kuchen'] })), ids(games))
})

test('19. Rollen-ID-Auflösung für Aktive ist korrekt', () => {
  assert.deepEqual(
    ids(resolveSelectedRolesForCategory(roles, 'Aktive', ['Verkauf'])),
    ['a-sale']
  )
})

test('20. Rollen-ID-Auflösung für Jugend ist korrekt', () => {
  assert.deepEqual(
    ids(resolveSelectedRolesForCategory(roles, 'Jugend', ['Verkauf'])),
    ['j-sale']
  )
})

test('21. Offenfilter ohne Rollenauswahl hat keine Filterwirkung', () => {
  assert.deepEqual(ids(filter({ openSelectedRolesOnly: true })), ids(games))
})

test('22. eine Rolle mit 0 von n Belegungen ist offen', () => {
  assert.equal(isRoleOpen(roles.find(role => role.id === 'a-sale'), 0), true)
})

test('23. eine teilbesetzte Rolle ist offen', () => {
  assert.equal(isRoleOpen(roles.find(role => role.id === 'a-sale'), 2), true)
})

test('24. Verkauf mit 3 von 4 Belegungen ist offen', () => {
  assert.equal(isRoleOpen(roles.find(role => role.id === 'a-sale'), 3), true)
})

test('25. Verkauf mit 4 von 4 Belegungen ist nicht offen', () => {
  assert.equal(isRoleOpen(roles.find(role => role.id === 'a-sale'), 4), false)
})

test('26. mehrere Rollen mit mindestens einer offenen Rolle zeigen das Spiel', () => {
  const assignments = [
    assignment('1', 'g-h1', 'a-wipe'),
    assignment('2', 'g-h1', 'a-wipe'),
    assignment('3', 'g-h1', 'a-sale'),
    assignment('4', 'g-h1', 'a-sale'),
    assignment('5', 'g-h1', 'a-sale')
  ]
  const result = filter({
    assignments,
    selectedTeamIds: ['h1'],
    selectedRoleNames: ['Verkauf', 'Wischer'],
    openSelectedRolesOnly: true
  })
  assert.deepEqual(ids(result), ['g-h1'])
})

test('27. mehrere vollständig besetzte Rollen blenden das Spiel aus', () => {
  const assignments = [
    assignment('1', 'g-h1', 'a-wipe'),
    assignment('2', 'g-h1', 'a-wipe'),
    ...[1, 2, 3, 4].map(number => assignment(`s${number}`, 'g-h1', 'a-sale'))
  ]
  const result = filter({
    assignments,
    selectedTeamIds: ['h1'],
    selectedRoleNames: ['Verkauf', 'Wischer'],
    openSelectedRolesOnly: true
  })
  assert.deepEqual(result, [])
})

test('28. Kategorie, Teams und Rollen werden gruppenübergreifend mit AND verknüpft', () => {
  const result = filter({
    selectedCategory: 'Jugend',
    selectedTeamIds: ['md1', 'wd'],
    selectedRoleNames: ['Kuchen']
  })
  assert.deepEqual(ids(result), ['g-md1', 'g-wd'])
})

test('29. Offenfilter reagiert auf geänderte Assignments', () => {
  const threeAssignments = [1, 2, 3]
    .map(number => assignment(`${number}`, 'g-h1', 'a-sale'))
  const fourAssignments = [
    ...threeAssignments,
    assignment('4', 'g-h1', 'a-sale')
  ]
  const filters = {
    selectedTeamIds: ['h1'],
    selectedRoleNames: ['Verkauf'],
    openSelectedRolesOnly: true
  }

  assert.deepEqual(ids(filter({ ...filters, assignments: threeAssignments })), ['g-h1'])
  assert.deepEqual(filter({ ...filters, assignments: fourAssignments }), [])
})

test('30. vollständiger Filterreset liefert exakt den Ausgangszustand', () => {
  assert.deepEqual(resetDashboardFilters(), {
    selectedCategory: 'all',
    selectedTeamIds: [],
    selectedRoleNames: [],
    openSelectedRolesOnly: false
  })
})

test('31. KPI-Basis entspricht ausschließlich dem gefilterten Spielbestand', () => {
  const activeGames = filter({ selectedCategory: 'Aktive' })
  const assignments = [assignment('1', 'g-h1', 'a-sale')]
  const result = calculateDashboardKpis({
    games: activeGames,
    teams,
    roles,
    assignments
  })

  assert.deepEqual(result, {
    homeGames: 2,
    openTasks: 23,
    assignmentCount: 1,
    teamCount: 2
  })
})

test('32. Assignmentzählung bleibt auf game_id und role_id begrenzt', () => {
  const assignments = [
    assignment('1', 'g-h1', 'a-sale'),
    assignment('2', 'g-h1', 'a-wipe'),
    assignment('3', 'g-h2', 'a-sale')
  ]
  assert.equal(countRoleAssignments(assignments, 'g-h1', 'a-sale'), 1)
})

test('33. Reconciliation bereinigt Teams, Rollen und wirkungslosen Offenfilter', () => {
  const result = reconcileDashboardFilters({
    selectedCategory: 'Jugend',
    selectedTeamIds: ['h1', 'md1'],
    selectedRoleNames: ['Ordner'],
    openSelectedRolesOnly: true
  }, teams, roles)

  assert.deepEqual(result, {
    selectedCategory: 'Jugend',
    selectedTeamIds: ['md1'],
    selectedRoleNames: [],
    openSelectedRolesOnly: false
  })
})
