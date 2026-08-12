import assert from 'node:assert/strict'
import test from 'node:test'
import {
  canExportDashboardGames,
  createDashboardExportFilename,
  createDashboardExportModel,
  createRoleExportValue,
  DASHBOARD_EXPORT_COLUMNS
} from '../src/utils/dashboardExportModel.js'
import { filterDashboardGames } from '../src/utils/dashboardFilters.js'
import { createDashboardWorkbook } from '../src/services/dashboardExport.js'

const teams = [
  { id: 'h1', name: 'Herren 1', category: 'Aktive' },
  { id: 'h2', name: 'Herren 2', category: 'Aktive' },
  { id: 'me', name: 'mE', category: 'Jugend' },
  { id: 'wd', name: 'wD', category: 'Jugend' }
]

const roles = [
  ['a-time', 'Zeitnehmer', 'Aktive', 1, 1],
  ['a-secretary', 'Sekretär', 'Aktive', 1, 1],
  ['a-wiper', 'Wischer', 'Aktive', 2, 2],
  ['a-steward', 'Ordner', 'Aktive', 4, 3],
  ['a-sales', 'Verkauf', 'Aktive', 4, 3],
  ['j-time', 'Zeitnehmer', 'Jugend', 1, 1],
  ['j-secretary', 'Sekretär', 'Jugend', 1, 1],
  ['j-referee', 'Schiri', 'Jugend', 1, 1],
  ['j-sales', 'Verkauf', 'Jugend', 2, 2],
  ['j-cake', 'Kuchen', 'Jugend', 3, 3],
  ['j-pretzels', 'Brezeln / Sonstiges', 'Jugend', 1, 1],
  ['j-shirts', 'Trikots', 'Jugend', 1, 1]
].map(([id, name, category, slots, minimum_staff]) => ({
  id,
  name,
  category,
  slots,
  minimum_staff
}))

const games = [
  {
    id: 'past-h1',
    team_id: 'h1',
    start_time: '2026-08-15T14:00:00.000Z',
    opponent: 'Testgegner Vergangenheit',
    is_home: true
  },
  {
    id: 'active-h1',
    team_id: 'h1',
    start_time: '2026-09-12T09:30:00.000Z',
    opponent: 'Testgegner A',
    is_home: true
  },
  {
    id: 'youth-me',
    team_id: 'me',
    start_time: '2026-09-13T08:00:00.000Z',
    opponent: 'Testgegner B',
    is_home: true
  },
  {
    id: 'active-h2',
    team_id: 'h2',
    start_time: '2026-09-19T13:00:00.000Z',
    opponent: 'Testgegner C',
    is_home: true
  },
  {
    id: 'youth-wd',
    team_id: 'wd',
    start_time: '2026-09-20T10:00:00.000Z',
    opponent: 'Testgegner D',
    is_home: true
  }
]

const assignments = [
  helper('active-time', 'active-h1', 'a-time', 'Testperson Zeit'),
  helper('sales-2', 'active-h1', 'a-sales', 'Testperson Zwei', '2026-08-02T10:00:00Z'),
  helper('sales-1', 'active-h1', 'a-sales', 'Testperson Eins', '2026-08-01T10:00:00Z'),
  helper('youth-time', 'youth-me', 'j-time', 'Testperson Jugend')
]

const FILTER_NOW = new Date('2026-09-01T10:00:00.000Z')

function helper(
  id,
  gameId,
  roleId,
  helperName,
  createdAt = '2026-08-01T09:00:00Z'
) {
  return {
    id,
    game_id: gameId,
    role_id: roleId,
    helper_name: helperName,
    created_at: createdAt
  }
}

function createModel(selectedGames = games, selectedAssignments = assignments) {
  return createDashboardExportModel({
    games: selectedGames,
    teams,
    roles,
    assignments: selectedAssignments
  })
}

function exportValue(model, rowIndex, header) {
  const columnIndex = DASHBOARD_EXPORT_COLUMNS.findIndex(
    column => column.header === header
  )
  return model.rows[rowIndex][columnIndex]
}

function assertExportMatches(filters = {}) {
  const filteredGames = filterDashboardGames({
    games,
    teams,
    roles,
    assignments,
    now: FILTER_NOW,
    ...filters
  })
  const model = createModel(filteredGames)

  assert.deepEqual(
    model.rows.map(row => row[3]),
    filteredGames.map(game => game.opponent)
  )
}

test('ein Spiel erzeugt genau eine Exportzeile', () => {
  assert.equal(createModel([games[1]]).rows.length, 1)
})

test('mehrere Spiele werden chronologisch nach start_time sortiert', () => {
  const model = createModel([games[4], games[1], games[2]])
  assert.deepEqual(
    model.rows.map(row => row[3]),
    ['Testgegner A', 'Testgegner B', 'Testgegner D']
  )
})

test('Datum und Uhrzeit werden in Europe/Berlin formatiert', () => {
  const model = createModel([games[1]])
  assert.equal(model.rows[0][0], '12.09.2026')
  assert.equal(model.rows[0][1], '11:30')
})

test('sichtbarer Teamname und Gegner werden korrekt ausgegeben', () => {
  const model = createModel([games[2]])
  assert.equal(model.rows[0][2], 'mE')
  assert.equal(model.rows[0][3], 'Testgegner B')
})

test('der Export besitzt exakt die 13 festgelegten Spalten', () => {
  assert.deepEqual(
    DASHBOARD_EXPORT_COLUMNS.map(column => column.header),
    [
      'Datum',
      'Zeit',
      'Heim',
      'Gegner',
      'Zeitnehmer',
      'Sekretär',
      'Schiri',
      'Wischer',
      'Ordner',
      'Verkauf',
      'Kuchen',
      'Brezeln / Sonstiges',
      'Trikots'
    ]
  )
  assert.equal(createModel([games[1]]).rows[0].length, 13)
})

test('Aktive enthält Zeitnehmer, Sekretär, Wischer, Ordner und Verkauf', () => {
  const model = createModel([games[1]])
  assert.equal(exportValue(model, 0, 'Zeitnehmer'), 'Testperson Zeit')
  assert.equal(exportValue(model, 0, 'Sekretär'), 'FREI')
  assert.equal(exportValue(model, 0, 'Wischer'), 'FREI\nFREI')
  assert.equal(exportValue(model, 0, 'Ordner'), 'FREI\nFREI\nFREI\nFREI')
  assert.equal(
    exportValue(model, 0, 'Verkauf'),
    'Testperson Eins\nTestperson Zwei\nFREI\nFREI'
  )
})

test('bei Aktive sind die vier nicht vorgesehenen Jugendrollen exakt Bindestrich', () => {
  const model = createModel([games[1]])

  for (const header of ['Schiri', 'Kuchen', 'Brezeln / Sonstiges', 'Trikots']) {
    assert.equal(exportValue(model, 0, header), '-')
  }
})

test('Jugend enthält alle sieben vorgesehenen Rollen', () => {
  const model = createModel([games[2]])
  assert.equal(exportValue(model, 0, 'Zeitnehmer'), 'Testperson Jugend')
  assert.equal(exportValue(model, 0, 'Sekretär'), 'FREI')
  assert.equal(exportValue(model, 0, 'Schiri'), 'FREI')
  assert.equal(exportValue(model, 0, 'Verkauf'), 'FREI\nFREI')
  assert.equal(exportValue(model, 0, 'Kuchen'), 'FREI\nFREI\nFREI')
  assert.equal(exportValue(model, 0, 'Brezeln / Sonstiges'), 'FREI')
  assert.equal(exportValue(model, 0, 'Trikots'), 'FREI')
})

test('bei Jugend sind Wischer und Ordner exakt Bindestrich', () => {
  const model = createModel([games[2]])
  assert.equal(exportValue(model, 0, 'Wischer'), '-')
  assert.equal(exportValue(model, 0, 'Ordner'), '-')
})

test('eine Rolle mit einem belegten Slot gibt nur den Namen aus', () => {
  assert.equal(
    createRoleExportValue({ slots: 1 }, [
      helper('one', 'game', 'role', 'Testperson A')
    ]),
    'Testperson A'
  )
})

test('eine Rolle mit einem freien Slot gibt FREI aus', () => {
  assert.equal(createRoleExportValue({ slots: 1 }, []), 'FREI')
})

test('zwei von vier Slots geben zwei Namen und zweimal FREI aus', () => {
  assert.equal(
    createRoleExportValue({ slots: 4 }, [
      helper('one', 'game', 'role', 'Testperson A'),
      helper('two', 'game', 'role', 'Testperson B')
    ]),
    'Testperson A\nTestperson B\nFREI\nFREI'
  )
})

test('minimum_staff 3 ändert bei drei von vier Slots nicht die FREI-Zeile', () => {
  assert.equal(
    createRoleExportValue({ slots: 4, minimum_staff: 3 }, [
      helper('one', 'game', 'role', 'Testperson A'),
      helper('two', 'game', 'role', 'Testperson B'),
      helper('three', 'game', 'role', 'Testperson C')
    ]),
    'Testperson A\nTestperson B\nTestperson C\nFREI'
  )
})

test('vier von vier Slots geben vier Namen ohne FREI aus', () => {
  const helpers = ['A', 'B', 'C', 'D'].map(letter => (
    helper(letter, 'game', 'role', `Testperson ${letter}`)
  ))

  assert.equal(
    createRoleExportValue({ slots: 4 }, helpers),
    'Testperson A\nTestperson B\nTestperson C\nTestperson D'
  )
})

test('null von vier Slots gibt viermal FREI aus', () => {
  assert.equal(
    createRoleExportValue({ slots: 4 }, []),
    'FREI\nFREI\nFREI\nFREI'
  )
})

test('Helfernamen werden deterministisch nach created_at sortiert', () => {
  assert.equal(
    createRoleExportValue({ slots: 2 }, [
      helper('later', 'game', 'role', 'Testperson Später', '2026-08-02T10:00:00Z'),
      helper('earlier', 'game', 'role', 'Testperson Früher', '2026-08-01T10:00:00Z')
    ]),
    'Testperson Früher\nTestperson Später'
  )
})

test('Dateiname verwendet das lokale Berliner Datum ohne Sonderzeichen', () => {
  assert.equal(
    createDashboardExportFilename(new Date('2026-08-11T22:30:00.000Z')),
    'TVH_Helferplan_2026-08-12.xlsx'
  )
})

test('ungefilterter aktuell sichtbarer Bestand entspricht der zentralen Filterung', () => {
  assertExportMatches()
})

test('Kategorie Aktive entspricht der zentralen Filterung', () => {
  assertExportMatches({ selectedCategory: 'Aktive' })
})

test('Kategorie Jugend entspricht der zentralen Filterung', () => {
  assertExportMatches({ selectedCategory: 'Jugend' })
})

test('ein Mannschaftsfilter entspricht der zentralen Filterung', () => {
  assertExportMatches({ selectedTeamIds: ['h1'] })
})

test('mehrere Mannschaften entsprechen der zentralen Filterung', () => {
  assertExportMatches({ selectedTeamIds: ['h1', 'wd'] })
})

test('ein Spieltag entspricht der zentralen Filterung', () => {
  assertExportMatches({ selectedMatchdayIds: ['2026-09-12_2026-09-13'] })
})

test('mehrere Spieltage entsprechen der zentralen Filterung', () => {
  assertExportMatches({
    selectedMatchdayIds: [
      '2026-09-12_2026-09-13',
      '2026-09-19_2026-09-20'
    ]
  })
})

test('ein Rollenfilter bestimmt nur die zentrale Spielmenge', () => {
  assertExportMatches({ selectedRoleNames: ['Wischer'] })
})

test('der Offenfilter bestimmt nur die zentrale Spielmenge', () => {
  assertExportMatches({
    selectedRoleNames: ['Zeitnehmer'],
    openSelectedRolesOnly: true
  })
})

test('Vergangenheit AUS entspricht der zentralen Filterung', () => {
  assertExportMatches({ showPastGames: false })
})

test('Vergangenheit AN entspricht der zentralen Filterung', () => {
  assertExportMatches({ showPastGames: true })
})

test('eine kombinierte Filterauswahl entspricht der zentralen Filterung', () => {
  assertExportMatches({
    selectedCategory: 'Jugend',
    selectedTeamIds: ['me', 'wd'],
    selectedMatchdayIds: ['2026-09-12_2026-09-13'],
    selectedRoleNames: ['Kuchen'],
    openSelectedRolesOnly: true,
    showPastGames: true
  })
})

test('ein Rollenfilter verändert weder Spalten noch übrige Rollenzellen', () => {
  const filteredGames = filterDashboardGames({
    games,
    teams,
    roles,
    assignments,
    selectedRoleNames: ['Zeitnehmer'],
    now: FILTER_NOW
  })
  const model = createModel(filteredGames)

  assert.equal(model.columns.length, 13)
  assert.equal(exportValue(model, 0, 'Verkauf').includes('Testperson Eins'), true)
})

test('bei null Spielen bleibt das Exportmodell leer und die Aktion gesperrt', () => {
  const model = createModel([])
  assert.deepEqual(model.rows, [])
  assert.equal(canExportDashboardGames([]), false)
})

test('bei einem Spiel ist die Exportaktion freigegeben', () => {
  assert.equal(canExportDashboardGames([games[0]]), true)
})

test('XLSX-Arbeitsmappe hebt die Kopfzeile hervor und friert sie ein', () => {
  const workbook = createDashboardWorkbook(createModel([games[1]]))

  assert.equal(workbook.data[0].length, 13)
  assert.equal(workbook.data[0][0].fontWeight, 'bold')
  assert.equal(workbook.data[0][0].backgroundColor, '#8B1E2D')
  assert.equal(workbook.sheetOptions.stickyRowsCount, 1)
})

test('XLSX-Arbeitsmappe übernimmt Spaltenbreiten und mehrzeilige Rollenzellen', () => {
  const workbook = createDashboardWorkbook(createModel([games[1]]))
  const exportRow = workbook.data[1]

  assert.equal(workbook.sheetOptions.columns.length, 13)
  assert.equal(workbook.sheetOptions.columns[3].width, 32)
  assert.equal(exportRow[9].value.split('\n').length, 4)
  assert.equal(exportRow[9].wrap, true)
  assert.equal(exportRow[9].verticalAlign, 'top')
  assert.equal(exportRow[9].height, 69)
})
