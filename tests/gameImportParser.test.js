import assert from 'node:assert/strict'
import test from 'node:test'
import {
  GameImportError,
  IMPORT_STATUS,
  analyzeImportRows,
  getImportSummary,
  parseImportSheet,
  validateImportFile
} from '../src/services/gameImportParser.js'

const HEADERS = [
  'H/A',
  'Altersklassen',
  'Wettbewerbe',
  'Staffelbezeichnung',
  'Mannschaft',
  'Bereich',
  'HEIM',
  'GAST',
  'Datum',
  'Anwurf'
]

const TEAMS = [
  {
    id: 'team-herren-1',
    name: 'Herren 1',
    category: 'Aktive',
    import_name: 'Herren 1'
  },
  {
    id: 'team-me',
    name: 'mE',
    category: 'Jugend',
    import_name: 'mE'
  }
]

const COMPACT_TEAMS = [
  ['team-h1', 'Herren 1', 'Aktive', 'Herren 1'],
  ['team-h2', 'Herren 2', 'Aktive', 'Herren 2'],
  ['team-md1', 'mD1', 'Jugend', 'mD1'],
  ['team-md2', 'mD2', 'Jugend', 'mD2'],
  ['team-me', 'mE', 'Jugend', 'mE'],
  ['team-wc', 'wC', 'Jugend', 'wC'],
  ['team-wd', 'wD', 'Jugend', 'wD'],
  ['team-we', 'wE', 'Jugend', 'wE']
].map(([id, name, category, importName]) => ({
  id,
  name,
  category,
  import_name: importName
}))

function createRow({
  homeAway = 'LOCAL',
  importTeamName = 'Herren 1',
  homeTeam = 'TV HOMBURG',
  opponent = 'Gastverein',
  date = new Date(Date.UTC(2026, 8, 12)),
  time = 18.5 / 24
} = {}) {
  return [
    homeAway,
    'ERWACHSENE',
    'LIGA',
    'STAFFEL',
    importTeamName,
    'Aktive',
    homeTeam,
    opponent,
    date,
    time
  ]
}

test('liest Excel-Datum und -Uhrzeit ohne Verschiebung der lokalen Hallenzeit', () => {
  const parsed = parseImportSheet(
    [HEADERS, createRow()],
    'Tabelle1'
  )
  const [row] = analyzeImportRows(parsed.rows, TEAMS, [])
  const localStartTime = new Date(row.startTime)

  assert.equal(parsed.sheetName, 'Tabelle1')
  assert.deepEqual(parsed.columns, HEADERS)
  assert.equal(row.date, '2026-09-12')
  assert.equal(row.time, '18:30')
  assert.equal(localStartTime.getFullYear(), 2026)
  assert.equal(localStartTime.getMonth(), 8)
  assert.equal(localStartTime.getDate(), 12)
  assert.equal(localStartTime.getHours(), 18)
  assert.equal(localStartTime.getMinutes(), 30)
  assert.equal(row.matchedTeamId, 'team-herren-1')
  assert.equal(row.status, IMPORT_STATUS.READY)
})

test('normalisiert Spaltenüberschriften sowie deutsche Textdaten', () => {
  const parsed = parseImportSheet([
    HEADERS.map(header => `  ${header.toLocaleLowerCase('de-DE')}  `),
    createRow({ date: '12.09.2026', time: '18:30' })
  ])
  const [row] = analyzeImportRows(parsed.rows, TEAMS, [])

  assert.equal(row.date, '2026-09-12')
  assert.equal(row.time, '18:30')
  assert.equal(row.status, IMPORT_STATUS.READY)
})

test('meldet fehlende Pflichtspalten einschließlich Heimspielnachweis', () => {
  assert.throws(
    () => parseImportSheet([
      ['Mannschaft', 'GAST'],
      ['Herren 1', 'Gastverein']
    ]),
    error => {
      assert.ok(error instanceof GameImportError)
      assert.equal(error.code, 'MISSING_COLUMNS')
      assert.deepEqual(
        error.details.missingColumns,
        ['Datum', 'Anwurf', 'H/A oder HEIM']
      )
      return true
    }
  )
})

test('weist ein leeres Tabellenblatt verständlich zurück', () => {
  assert.throws(
    () => parseImportSheet([]),
    error => error instanceof GameImportError && error.code === 'EMPTY_SHEET'
  )
})

test('weist einen falschen Dateityp verständlich zurück', () => {
  assert.throws(
    () => validateImportFile({ name: 'Spiele.csv' }),
    error =>
      error instanceof GameImportError
      && error.code === 'INVALID_FILE_TYPE'
  )
  assert.doesNotThrow(() => validateImportFile({ name: 'Spiele.xlsx' }))
})

test('markiert ungültiges Datum und ungültige Uhrzeit', () => {
  const parsed = parseImportSheet([
    HEADERS,
    createRow({ date: '31.02.2027', time: '25:90' })
  ])
  const [row] = analyzeImportRows(parsed.rows, TEAMS, [])

  assert.equal(row.status, IMPORT_STATUS.INVALID)
  assert.ok(row.messages.includes('Das Datum ist ungültig.'))
  assert.ok(row.messages.includes('Die Anwurfzeit ist ungültig.'))
})

test('markiert unbekannte Mannschaft und Auswärtsspiel getrennt', () => {
  const parsed = parseImportSheet([
    HEADERS,
    createRow({ importTeamName: 'Unbekannt' }),
    createRow({ homeAway: 'AWAY', importTeamName: 'mE' })
  ])
  const rows = analyzeImportRows(parsed.rows, TEAMS, [])

  assert.equal(rows[0].status, IMPORT_STATUS.UNMATCHED)
  assert.equal(rows[1].status, IMPORT_STATUS.NOT_HOME)
})

test('erkennt vorhandene und dateiinterne Duplikate normalisiert', () => {
  const parsed = parseImportSheet([
    HEADERS,
    createRow({ opponent: 'Gastverein' }),
    createRow({ opponent: '  GASTVEREIN  ' }),
    createRow({ importTeamName: 'mE', opponent: 'Anderer Verein' }),
    createRow({ importTeamName: 'mE', opponent: 'anderer verein' })
  ])
  const existingGames = [{
    id: 'existing-game',
    team_id: 'team-herren-1',
    start_time: parsed.rows[0].startTime,
    opponent: ' gastverein '
  }]
  const rows = analyzeImportRows(parsed.rows, TEAMS, existingGames)

  assert.equal(rows[0].status, IMPORT_STATUS.DUPLICATE_EXISTING)
  assert.equal(rows[0].duplicateGameId, 'existing-game')
  assert.equal(rows[1].status, IMPORT_STATUS.DUPLICATE_EXISTING)
  assert.equal(rows[2].status, IMPORT_STATUS.READY)
  assert.equal(rows[3].status, IMPORT_STATUS.DUPLICATE_FILE)
  assert.deepEqual(getImportSummary(rows), {
    total: 4,
    ready: 1,
    unmatched: 0,
    invalid: 0,
    duplicates: 3,
    skipped: 0
  })
})

test('wendet ein manuelles Mapping auf alle gleichen Excel-Namen an', () => {
  const parsed = parseImportSheet([
    HEADERS,
    createRow({ importTeamName: 'mD2', opponent: 'Verein A' }),
    createRow({ importTeamName: 'mD2', opponent: 'Verein B' })
  ])
  const rows = analyzeImportRows(
    parsed.rows,
    TEAMS,
    [],
    { md2: 'team-me' }
  )

  assert.deepEqual(
    rows.map(row => row.matchedTeamId),
    ['team-me', 'team-me']
  )
  assert.deepEqual(
    rows.map(row => row.status),
    [IMPORT_STATUS.READY, IMPORT_STATUS.READY]
  )
})

test('ordnet alle acht Excel-Mannschaften trotz kompakter Teamnamen über import_name zu', () => {
  const importNames = COMPACT_TEAMS.map(team => team.import_name)
  const parsed = parseImportSheet([
    HEADERS,
    ...importNames.map((importTeamName, index) => createRow({
      importTeamName,
      opponent: `Gastverein ${index + 1}`
    }))
  ])
  const rows = analyzeImportRows(parsed.rows, COMPACT_TEAMS, [])

  assert.deepEqual(
    rows.map(row => row.matchedTeamId),
    COMPACT_TEAMS.map(team => team.id)
  )
  assert.deepEqual(
    rows.map(row => row.status),
    Array(COMPACT_TEAMS.length).fill(IMPORT_STATUS.READY)
  )
})
