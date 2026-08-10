import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createCalendarMonth,
  formatCalendarMonth,
  getBerlinDateKey,
  getCalendarMatchdayGroups,
  getCalendarSelection,
  getInitialCalendarMonth,
  getMatchdayByDate,
  getSelectedCalendarDates,
  shiftCalendarMonth
} from '../src/utils/matchdayCalendar.js'
import { filterDashboardGames } from '../src/utils/dashboardFilters.js'

function game(id, localDate, teamId = 'team') {
  return {
    id,
    team_id: teamId,
    is_home: true,
    start_time: `${localDate}T10:00:00+02:00`
  }
}

const weekendGames = [
  game('sat', '2026-09-12'),
  game('sun', '2026-09-13')
]
const weekendGroups = getCalendarMatchdayGroups(weekendGames)

test('Initialmonat ist der nächste zukünftige Spieltag', () => {
  const groups = getCalendarMatchdayGroups([
    game('past', '2026-08-29'),
    game('next', '2026-09-05'),
    game('later', '2026-10-03')
  ])

  assert.equal(
    getInitialCalendarMonth(groups, new Date('2026-08-30T12:00:00Z')),
    '2026-09'
  )
})

test('Initialmonat fällt ohne zukünftigen Spieltag auf den letzten zurück', () => {
  const groups = getCalendarMatchdayGroups([
    game('first', '2026-08-29'),
    game('last', '2027-05-08')
  ])

  assert.equal(
    getInitialCalendarMonth(groups, new Date('2027-06-01T12:00:00Z')),
    '2027-05'
  )
})

test('Initialmonat ohne Spiele verwendet den aktuellen Berlin-Monat', () => {
  assert.equal(
    getInitialCalendarMonth([], new Date('2026-08-31T22:30:00Z')),
    '2026-09'
  )
})

test('Monatsmatrix beginnt montags und endet sonntags', () => {
  const cells = createCalendarMonth('2026-09', [])
  const firstDateIndex = cells.findIndex(cell => cell.dateKey === '2026-09-01')

  assert.equal(firstDateIndex, 1)
  assert.equal(cells.length % 7, 0)
  assert.equal(cells[0].dateKey, null)
  assert.equal(cells.at(-1).dateKey, null)
})

test('ein einzelner Spieltag markiert genau sein Datum', () => {
  const groups = getCalendarMatchdayGroups([game('only', '2026-09-05')])
  const marked = createCalendarMonth('2026-09', groups)
    .filter(cell => cell.matchday)

  assert.deepEqual(marked.map(cell => cell.dateKey), ['2026-09-05'])
})

test('Samstag/Sonntag-Gruppe markiert beide Tage mit derselben ID', () => {
  const marked = createCalendarMonth('2026-09', weekendGroups)
    .filter(cell => cell.matchday)

  assert.deepEqual(marked.map(cell => cell.dateKey), [
    '2026-09-12',
    '2026-09-13'
  ])
  assert.equal(marked[0].matchday.id, marked[1].matchday.id)
})

test('Tag ohne Spiel besitzt keine Matchday-ID', () => {
  assert.equal(getMatchdayByDate(weekendGroups).get('2026-09-14'), undefined)
})

test('Kalenderauswahl setzt genau einen Spieltag', () => {
  assert.deepEqual(
    getCalendarSelection(['2026-08-29', '2026-09-05'], weekendGroups[0].id),
    [weekendGroups[0].id]
  )
})

test('erneuter Klick auf denselben einzelnen Spieltag leert die Auswahl', () => {
  assert.deepEqual(
    getCalendarSelection([weekendGroups[0].id], weekendGroups[0].id),
    []
  )
})

test('bestehende Multiselect-Mehrfachauswahl bleibt unverändert abbildbar', () => {
  const groups = getCalendarMatchdayGroups([
    game('august', '2026-08-29'),
    ...weekendGames
  ])
  const selected = getSelectedCalendarDates(groups, groups.map(group => group.id))

  assert.deepEqual([...selected], [
    '2026-08-29',
    '2026-09-12',
    '2026-09-13'
  ])
})

test('Kategorie-, Team- und Rollenfilter verändern Kalendergruppen nicht', () => {
  const games = [
    game('active', '2026-08-29', 'active'),
    ...weekendGames.map(item => ({ ...item, team_id: 'youth' }))
  ]
  const teams = [
    { id: 'active', category: 'Aktive' },
    { id: 'youth', category: 'Jugend' }
  ]
  const roles = [
    { id: 'sale', name: 'Verkauf', category: 'Jugend', slots: 2 }
  ]
  const calendarIds = getCalendarMatchdayGroups(games).map(group => group.id)

  filterDashboardGames({
    games,
    teams,
    roles,
    assignments: [],
    selectedCategory: 'Jugend',
    selectedTeamIds: ['youth'],
    selectedRoleNames: ['Verkauf']
  })

  assert.deepEqual(
    getCalendarMatchdayGroups(games).map(group => group.id),
    calendarIds
  )
})

test('kombinierte AND-Filterung mit Kalenderauswahl bleibt korrekt', () => {
  const games = weekendGames.map(item => ({ ...item, team_id: 'youth' }))
  const result = filterDashboardGames({
    games,
    teams: [{ id: 'youth', category: 'Jugend' }],
    roles: [{ id: 'sale', name: 'Verkauf', category: 'Jugend', slots: 2 }],
    assignments: [],
    selectedCategory: 'Jugend',
    selectedTeamIds: ['youth'],
    selectedMatchdayIds: [weekendGroups[0].id],
    selectedRoleNames: ['Verkauf'],
    openSelectedRolesOnly: true
  })

  assert.deepEqual(result.map(item => item.id), ['sat', 'sun'])
})

test('Monatswechsel Dezember zu Januar und Januar zu Dezember ist korrekt', () => {
  assert.equal(shiftCalendarMonth('2026-12', 1), '2027-01')
  assert.equal(shiftCalendarMonth('2027-01', -1), '2026-12')
})

test('Schaltjahr-Februar enthält 29 Tage', () => {
  const cells = createCalendarMonth('2028-02', [])
    .filter(cell => cell.dateKey)

  assert.equal(cells.length, 29)
  assert.equal(cells.at(-1).dateKey, '2028-02-29')
})

test('Europe/Berlin bestimmt den heutigen Kalendertag', () => {
  assert.equal(
    getBerlinDateKey(new Date('2026-08-31T22:30:00Z')),
    '2026-09-01'
  )
})

test('ungültige start_time verursacht keinen Crash und keine Markierung', () => {
  const groups = getCalendarMatchdayGroups([
    { id: 'invalid', start_time: 'kein Datum' },
    { id: 'missing', start_time: null }
  ])

  assert.deepEqual(groups, [])
  assert.equal(createCalendarMonth('2026-09', groups).some(cell => cell.matchday), false)
})

test('deutsche Monatsbeschriftung wird erzeugt', () => {
  assert.equal(formatCalendarMonth('2026-09'), 'September 2026')
})
