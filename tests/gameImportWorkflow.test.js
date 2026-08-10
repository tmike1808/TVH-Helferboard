import assert from 'node:assert/strict'
import test from 'node:test'
import { IMPORT_STATUS } from '../src/services/gameImportParser.js'
import {
  GameImportValidationError,
  buildImportPayload
} from '../src/services/gameImportModel.js'
import {
  createImportController,
  executeGameImport
} from '../src/services/gameImportWorkflow.js'

const TEAM = {
  id: 'team-1',
  name: 'Herren 1',
  category: 'Aktive',
  import_name: 'Herren 1'
}

function parsedRow({
  rowNumber = 2,
  importTeamName = 'Herren 1',
  opponent = 'Testgegner',
  startTime = '2027-06-01T18:30:00.000Z',
  isHome = true,
  messages = []
} = {}) {
  return {
    rowNumber,
    importTeamName,
    opponent,
    startTime,
    date: '2027-06-01',
    time: '20:30',
    isHome,
    messages
  }
}

function readyRow(overrides = {}) {
  const row = parsedRow(overrides)

  return {
    ...row,
    matchedTeamId: TEAM.id,
    matchedTeamName: TEAM.name,
    status: IMPORT_STATUS.READY
  }
}

function successfulInsert(rows, options = {}) {
  const successful = rows.map((row, index) => {
    options.onProgress?.({
      processed: index + 1,
      total: rows.length
    })

    return {
      rowNumber: row.rowNumber,
      id: `game-${row.rowNumber}`
    }
  })

  return Promise.resolve({ successful, failed: [] })
}

test('Import-Payload enthält ausschließlich erlaubte Felder und Heimspiel true', () => {
  const payload = buildImportPayload({
    ...readyRow(),
    ignoredExcelColumn: 'wird nicht gespeichert',
    isHome: true
  })

  assert.deepEqual(payload, {
    team_id: TEAM.id,
    start_time: '2027-06-01T18:30:00.000Z',
    opponent: 'Testgegner',
    is_home: true
  })
  assert.deepEqual(Object.keys(payload), [
    'team_id',
    'start_time',
    'opponent',
    'is_home'
  ])
  assert.throws(
    () => buildImportPayload({
      ...readyRow(),
      isHome: false
    }),
    error =>
      error instanceof GameImportValidationError
      && error.code === 'HOME_GAME_REQUIRED'
  )
})

test('nur beim Recheck weiterhin bereite Zeilen werden importiert', async () => {
  const inserted = []
  const result = await executeGameImport({
    parsedRows: [
      parsedRow(),
      parsedRow({
        rowNumber: 3,
        importTeamName: 'Unbekannt',
        opponent: 'Unbekannter Gegner'
      }),
      parsedRow({
        rowNumber: 4,
        opponent: 'Auswärtsgegner',
        isHome: false
      })
    ],
    teams: [TEAM],
    loadGames: async () => [],
    insertGames: async rows => {
      inserted.push(...rows)
      return successfulInsert(rows)
    }
  })

  assert.equal(inserted.length, 1)
  assert.equal(inserted[0].rowNumber, 2)
  assert.equal(result.summary.imported, 1)
  assert.equal(result.summary.unmatched, 1)
  assert.equal(result.summary.notHome, 1)
})

test('Remote-Duplikate werden unmittelbar vor dem Import erneut erkannt', async () => {
  let insertCalls = 0
  const result = await executeGameImport({
    parsedRows: [parsedRow()],
    teams: [TEAM],
    loadGames: async () => [{
      id: 'existing-game',
      team_id: TEAM.id,
      start_time: '2027-06-01T18:30:00.000Z',
      opponent: '  TESTGEGNER '
    }],
    insertGames: async () => {
      insertCalls += 1
      return { successful: [], failed: [] }
    }
  })

  assert.equal(insertCalls, 0)
  assert.equal(result.summary.imported, 0)
  assert.equal(result.summary.alreadyExisting, 1)
})

test('derselbe Import erzeugt beim zweiten Lauf kein weiteres Spiel', async () => {
  const games = []
  const controller = createImportController()
  const options = {
    confirmed: true,
    parsedRows: [parsedRow()],
    teams: [TEAM],
    loadGames: async () => [...games],
    insertGames: async rows => {
      const result = await successfulInsert(rows)
      games.push(...rows.map((row, index) => ({
        id: `remote-${games.length + index}`,
        team_id: row.matchedTeamId,
        start_time: row.startTime,
        opponent: row.opponent,
        is_home: true
      })))
      return result
    }
  }

  const first = await controller.execute(options)
  const second = await controller.execute(options)

  assert.equal(first.summary.imported, 1)
  assert.equal(second.summary.imported, 0)
  assert.equal(second.summary.alreadyExisting, 1)
  assert.equal(games.length, 1)
})

test('Mehrfachauslösung wird während eines laufenden Imports verhindert', async () => {
  let releaseInsert
  let signalStarted
  const started = new Promise(resolve => {
    signalStarted = resolve
  })
  const gate = new Promise(resolve => {
    releaseInsert = resolve
  })
  const controller = createImportController()
  const options = {
    confirmed: true,
    parsedRows: [parsedRow()],
    teams: [TEAM],
    loadGames: async () => [],
    insertGames: async rows => {
      signalStarted()
      await gate
      return successfulInsert(rows)
    }
  }

  const firstPromise = controller.execute(options)
  await started
  const second = await controller.execute(options)
  releaseInsert()
  const first = await firstPromise

  assert.equal(second.status, 'already-running')
  assert.equal(second.started, false)
  assert.equal(first.summary.imported, 1)
})

test('vollständiger Erfolg erzeugt korrekte Statistik und Refresh', async () => {
  let dashboardRefreshes = 0
  let loadCalls = 0
  const result = await executeGameImport({
    parsedRows: [
      parsedRow(),
      parsedRow({
        rowNumber: 3,
        opponent: 'Zweiter Gegner',
        startTime: '2027-06-02T18:30:00.000Z'
      })
    ],
    teams: [TEAM],
    loadGames: async () => {
      loadCalls += 1
      return []
    },
    insertGames: successfulInsert,
    refreshDashboard: async () => {
      dashboardRefreshes += 1
    }
  })

  assert.equal(result.status, 'completed')
  assert.equal(result.summary.total, 2)
  assert.equal(result.summary.imported, 2)
  assert.equal(result.summary.failed, 0)
  assert.equal(loadCalls, 2)
  assert.equal(dashboardRefreshes, 1)
})

test('Teilfehler bleibt zeilenbezogen und verfälscht Erfolge nicht', async () => {
  const result = await executeGameImport({
    parsedRows: [
      parsedRow(),
      parsedRow({
        rowNumber: 3,
        opponent: 'Fehlergegner',
        startTime: '2027-06-02T18:30:00.000Z'
      })
    ],
    teams: [TEAM],
    loadGames: async () => [],
    insertGames: async rows => ({
      successful: [{
        rowNumber: rows[0].rowNumber,
        id: 'created-game'
      }],
      failed: [{
        rowNumber: rows[1].rowNumber,
        message: 'Excel-Zeile 3 konnte nicht gespeichert werden.'
      }]
    }),
    refreshDashboard: async () => {}
  })

  assert.equal(result.status, 'partial')
  assert.equal(result.summary.imported, 1)
  assert.equal(result.summary.failed, 1)
  assert.equal(result.failed[0].rowNumber, 3)
  assert.match(result.failed[0].message, /Excel-Zeile 3/)
})

test('ohne ausdrückliche Bestätigung findet keine Mutation statt', async () => {
  let loadCalls = 0
  let insertCalls = 0
  const controller = createImportController()
  const result = await controller.execute({
    confirmed: false,
    parsedRows: [parsedRow()],
    teams: [TEAM],
    loadGames: async () => {
      loadCalls += 1
      return []
    },
    insertGames: async () => {
      insertCalls += 1
      return { successful: [], failed: [] }
    }
  })

  assert.equal(result.status, 'cancelled')
  assert.equal(result.started, false)
  assert.equal(loadCalls, 0)
  assert.equal(insertCalls, 0)
})

test('manuelles Alias wird nur nach ausdrücklicher Auswahl gespeichert', async () => {
  const saved = []
  const baseOptions = {
    parsedRows: [parsedRow({ importTeamName: 'Neuer Alias' })],
    teams: [TEAM],
    manualMappings: { 'neuer alias': TEAM.id },
    loadGames: async () => [],
    insertGames: successfulInsert,
    saveTeamImportName: async (teamId, importName) => {
      saved.push({ teamId, importName })
      return { ...TEAM, import_name: importName }
    }
  }

  await executeGameImport({
    ...baseOptions,
    rememberedMappings: {}
  })
  assert.equal(saved.length, 0)

  const rememberedResult = await executeGameImport({
    ...baseOptions,
    rememberedMappings: { 'neuer alias': true }
  })

  assert.deepEqual(saved, [{
    teamId: TEAM.id,
    importName: 'Neuer Alias'
  }])
  assert.equal(rememberedResult.aliases.successful.length, 1)
})

test('Alias-Konflikt wird verständlich behandelt und blockiert Spiele nicht', async () => {
  const result = await executeGameImport({
    parsedRows: [parsedRow({ importTeamName: 'Konflikt Alias' })],
    teams: [TEAM],
    manualMappings: { 'konflikt alias': TEAM.id },
    rememberedMappings: { 'konflikt alias': true },
    loadGames: async () => [],
    insertGames: successfulInsert,
    saveTeamImportName: async () => {
      throw new Error(
        'Dieser Excel-Mannschaftsname ist bereits einem anderen Team zugeordnet.'
      )
    }
  })

  assert.equal(result.summary.imported, 1)
  assert.equal(result.aliases.successful.length, 0)
  assert.equal(result.aliases.failed.length, 1)
  assert.match(result.aliases.failed[0].message, /anderen Team/)
})
