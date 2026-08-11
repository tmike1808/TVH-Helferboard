import assert from 'node:assert/strict'
import test from 'node:test'
import {
  filterDashboardGames,
  filterGamesByDashboardTime,
  getRelevantMatchdayGroups,
  getRelevantMatchdayOptions,
  isGamePastInBerlin,
  reconcileDashboardFilters,
  resetDashboardFilters
} from '../src/utils/dashboardFilters.js'
import {
  getMatchdayByDate,
  getSelectedCalendarDates
} from '../src/utils/matchdayCalendar.js'

const teams = [
  { id: 'h1', name: 'Herren 1', category: 'Aktive' },
  { id: 'h2', name: 'Herren 2', category: 'Aktive' },
  { id: 'md1', name: 'mD1', category: 'Jugend' },
  { id: 'me', name: 'mE', category: 'Jugend' }
]

const roles = [
  { id: 'wipe', name: 'Wischer', category: 'Aktive', slots: 2 },
  { id: 'cake', name: 'Kuchen', category: 'Jugend', slots: 3 }
]

const games = [
  game('past', 'h1', '2026-08-08T14:00:00+02:00'),
  game('today-ended', 'h1', '2026-08-10T10:00:00+02:00'),
  game('tomorrow', 'h2', '2026-08-11T16:00:00+02:00'),
  game('active-sat', 'h1', '2026-09-12T16:00:00+02:00'),
  game('youth-sun', 'md1', '2026-09-13T10:00:00+02:00'),
  game('youth-only', 'me', '2026-10-03T10:00:00+02:00')
]

const NOW = new Date('2026-08-10T20:00:00Z')

function game(id, teamId, startTime) {
  return { id, team_id: teamId, start_time: startTime, is_home: true }
}

function ids(items) {
  return items.map(item => item.id)
}

function filter(overrides = {}) {
  return filterDashboardGames({
    games,
    teams,
    roles,
    assignments: [],
    now: NOW,
    ...overrides
  })
}

test('gestern wird standardmäßig ausgeblendet, heute und morgen bleiben sichtbar', () => {
  assert.deepEqual(ids(filter()).slice(0, 2), ['today-ended', 'tomorrow'])
  assert.equal(ids(filter()).includes('past'), false)
})

test('ein am heutigen Kalendertag bereits beendetes Spiel bleibt sichtbar', () => {
  assert.equal(ids(filter()).includes('today-ended'), true)
})

test('Vergangenheitsschalter ergänzt vergangene Spiele und AUS blendet sie wieder aus', () => {
  assert.equal(ids(filter({ showPastGames: true })).includes('past'), true)
  assert.equal(ids(filter({ showPastGames: false })).includes('past'), false)
})

test('expliziter historischer Matchday besitzt Vorrang vor dem Zeitschalter', () => {
  assert.deepEqual(
    ids(filter({ selectedMatchdayIds: ['2026-08-08'] })),
    ['past']
  )
})

test('Aufheben der historischen Matchday-Auswahl aktiviert die Standardzeitregel', () => {
  const selected = filter({ selectedMatchdayIds: ['2026-08-08'] })
  const cleared = filter({ selectedMatchdayIds: [] })
  assert.deepEqual(ids(selected), ['past'])
  assert.equal(ids(cleared).includes('past'), false)
})

test('Berlin-Tagesgrenze im Sommer verwendet nicht den UTC-Kalendertag', () => {
  assert.equal(
    isGamePastInBerlin(
      '2026-08-09T22:30:00Z',
      new Date('2026-08-10T20:00:00Z')
    ),
    false
  )
})

test('Berlin-Tagesgrenze im Winter verwendet nicht den UTC-Kalendertag', () => {
  assert.equal(
    isGamePastInBerlin(
      '2026-01-01T23:30:00Z',
      new Date('2026-01-02T12:00:00Z')
    ),
    false
  )
})

test('ungültige Startzeit wird nicht irrtümlich als vergangen entfernt', () => {
  const invalid = [{ id: 'invalid', start_time: 'invalid' }]
  assert.deepEqual(
    filterGamesByDashboardTime({ games: invalid, now: NOW }),
    invalid
  )
})

test('Reset stellt den Standard heute plus Zukunft wieder her', () => {
  assert.deepEqual(resetDashboardFilters(), {
    selectedCategory: 'all',
    selectedTeamIds: [],
    showPastGames: false,
    selectedMatchdayIds: [],
    selectedRoleNames: [],
    openSelectedRolesOnly: false
  })
})

test('Alle ohne Teams liefert alle relevanten Matchdays einschließlich Vergangenheit', () => {
  assert.deepEqual(
    getRelevantMatchdayGroups({ games, teams }).map(group => group.id),
    ['2026-08-08', '2026-08-10', '2026-08-11', '2026-09-12_2026-09-13', '2026-10-03']
  )
})

test('Kategorie Aktive liefert nur Matchdays mit mindestens einem Aktive-Spiel', () => {
  assert.deepEqual(
    getRelevantMatchdayGroups({
      games,
      teams,
      selectedCategory: 'Aktive'
    }).map(group => group.id),
    ['2026-08-08', '2026-08-10', '2026-08-11', '2026-09-12_2026-09-13']
  )
})

test('Kategorie Jugend liefert nur Matchdays mit mindestens einem Jugendspiel', () => {
  assert.deepEqual(
    getRelevantMatchdayGroups({
      games,
      teams,
      selectedCategory: 'Jugend'
    }).map(group => group.id),
    ['2026-09-12_2026-09-13', '2026-10-03']
  )
})

test('ein Team liefert nur seine tatsächlichen Matchdays', () => {
  assert.deepEqual(
    getRelevantMatchdayGroups({
      games,
      teams,
      selectedCategory: 'Aktive',
      selectedTeamIds: ['h1']
    }).map(group => group.id),
    ['2026-08-08', '2026-08-10', '2026-09-12_2026-09-13']
  )
})

test('mehrere Teams werden für relevante Matchdays mit OR verknüpft', () => {
  assert.deepEqual(
    getRelevantMatchdayGroups({
      games,
      teams,
      selectedCategory: 'Jugend',
      selectedTeamIds: ['md1', 'me']
    }).map(group => group.id),
    ['2026-09-12_2026-09-13', '2026-10-03']
  )
})

test('Rollen-, Offen- und Vergangenheitsfilter verändern relevante Matchdays nicht', () => {
  const base = {
    games,
    teams,
    selectedCategory: 'Aktive',
    selectedTeamIds: ['h1']
  }
  const expected = getRelevantMatchdayGroups(base).map(group => group.id)
  const downstream = getRelevantMatchdayGroups({
    ...base,
    selectedRoleNames: ['Wischer'],
    openSelectedRolesOnly: true,
    showPastGames: true
  }).map(group => group.id)
  assert.deepEqual(downstream, expected)
})

test('Kalender und Spieltag-Multiselect verwenden dieselbe Optionsmenge', () => {
  const filters = {
    games,
    teams,
    selectedCategory: 'Jugend',
    selectedTeamIds: ['md1']
  }
  assert.deepEqual(
    getRelevantMatchdayOptions(filters).map(option => option.value),
    getRelevantMatchdayGroups(filters).map(group => group.id)
  )
})

test('Kategorieänderung entfernt einen ungültig gewordenen Matchday', () => {
  const result = reconcileDashboardFilters({
    selectedCategory: 'Aktive',
    selectedMatchdayIds: ['2026-10-03']
  }, teams, roles, games)
  assert.deepEqual(result.selectedMatchdayIds, [])
})

test('Kategorieänderung erhält einen weiterhin relevanten Wochenend-Matchday', () => {
  const result = reconcileDashboardFilters({
    selectedCategory: 'Jugend',
    selectedMatchdayIds: ['2026-09-12_2026-09-13']
  }, teams, roles, games)
  assert.deepEqual(result.selectedMatchdayIds, ['2026-09-12_2026-09-13'])
})

test('Teamänderung entfernt eine ungültig gewordene Auswahl', () => {
  const result = reconcileDashboardFilters({
    selectedCategory: 'Jugend',
    selectedTeamIds: ['md1'],
    selectedMatchdayIds: ['2026-10-03']
  }, teams, roles, games)
  assert.deepEqual(result.selectedMatchdayIds, [])
})

test('Wochenend-ID bleibt bei nur einem relevanten Spiel stabil', () => {
  const groups = getRelevantMatchdayGroups({
    games,
    teams,
    selectedCategory: 'Jugend',
    selectedTeamIds: ['md1']
  })
  assert.equal(groups[0].id, '2026-09-12_2026-09-13')
  assert.deepEqual(ids(groups[0].games), ['youth-sun'])
})

test('bei einem relevanten Sonntag bleiben beide Wochenendtage markiert', () => {
  const groups = getRelevantMatchdayGroups({
    games,
    teams,
    selectedCategory: 'Jugend',
    selectedTeamIds: ['md1']
  })
  assert.deepEqual(
    [...getMatchdayByDate(groups).keys()],
    ['2026-09-12', '2026-09-13']
  )
  assert.deepEqual(
    [...getSelectedCalendarDates(groups, [groups[0].id])],
    ['2026-09-12', '2026-09-13']
  )
})

test('Reset macht wieder alle Matchdays verfügbar', () => {
  const options = getRelevantMatchdayOptions({
    games,
    teams,
    ...resetDashboardFilters()
  })
  assert.equal(options.length, 5)
})

test('Kategorie, Team und Zeit bleiben gruppenübergreifend AND', () => {
  assert.deepEqual(
    ids(filter({
      selectedCategory: 'Aktive',
      selectedTeamIds: ['h1']
    })),
    ['today-ended', 'active-sat']
  )
})

test('Kategorie, Team und historischer Matchday zeigen die gezielte Vergangenheit', () => {
  assert.deepEqual(
    ids(filter({
      selectedCategory: 'Aktive',
      selectedTeamIds: ['h1'],
      selectedMatchdayIds: ['2026-08-08']
    })),
    ['past']
  )
})

test('Kategorie, Team, Matchday, Rolle und Offenfilter bleiben gemeinsam wirksam', () => {
  assert.deepEqual(
    ids(filter({
      selectedCategory: 'Aktive',
      selectedTeamIds: ['h1'],
      selectedMatchdayIds: ['2026-09-12_2026-09-13'],
      selectedRoleNames: ['Wischer'],
      openSelectedRolesOnly: true
    })),
    ['active-sat']
  )
})
