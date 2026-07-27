export const IMPORT_STATUS = {
  READY: 'ready',
  UNMATCHED: 'unmatched',
  INVALID: 'invalid',
  DUPLICATE_EXISTING: 'duplicate-existing',
  NOT_HOME: 'not-home',
  DUPLICATE_FILE: 'duplicate-file'
}

export const IMPORT_STATUS_LABELS = {
  [IMPORT_STATUS.READY]: 'Bereit',
  [IMPORT_STATUS.UNMATCHED]: 'Team nicht zugeordnet',
  [IMPORT_STATUS.INVALID]: 'Ungültig',
  [IMPORT_STATUS.DUPLICATE_EXISTING]: 'Bereits vorhanden',
  [IMPORT_STATUS.NOT_HOME]: 'Kein Heimspiel',
  [IMPORT_STATUS.DUPLICATE_FILE]: 'Doppelt in Datei'
}

const REQUIRED_COLUMNS = ['Mannschaft', 'GAST', 'Datum', 'Anwurf']
const HEADER_ALIASES = {
  homeAway: ['H/A', 'HA', 'HEIM/AUSWÄRTS', 'HEIM/AUSWAERTS'],
  importTeamName: ['MANNSCHAFT'],
  homeTeam: ['HEIM'],
  opponent: ['GAST'],
  date: ['DATUM'],
  time: ['ANWURF']
}

export class GameImportError extends Error {
  constructor(code, message, details = {}) {
    super(message)
    this.name = 'GameImportError'
    this.code = code
    this.details = details
  }
}

export function validateImportFile(file) {
  if (!file) {
    throw new GameImportError(
      'NO_FILE',
      'Bitte wählen Sie eine Excel-Datei aus.'
    )
  }

  const normalizedName = String(file.name ?? '').trim().toLocaleLowerCase('de-DE')

  if (!normalizedName.endsWith('.xlsx')) {
    throw new GameImportError(
      'INVALID_FILE_TYPE',
      'Bitte wählen Sie eine Datei im Format .xlsx aus.'
    )
  }
}

export function normalizeImportText(value) {
  return String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ')
}

export function normalizeComparisonText(value) {
  return normalizeImportText(value).toLocaleLowerCase('de-DE')
}

function normalizeHeader(value) {
  return normalizeImportText(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '')
    .toUpperCase()
}

function isEmptyRow(row) {
  return !Array.isArray(row) || row.every(value => normalizeImportText(value) === '')
}

function findColumnIndex(headers, aliases) {
  const normalizedAliases = aliases.map(normalizeHeader)
  return headers.findIndex(header => normalizedAliases.includes(normalizeHeader(header)))
}

function getHeaderLayout(rows) {
  const searchLimit = Math.min(rows.length, 20)

  for (let rowIndex = 0; rowIndex < searchLimit; rowIndex += 1) {
    const row = rows[rowIndex]

    if (isEmptyRow(row)) {
      continue
    }

    const indexes = Object.fromEntries(
      Object.entries(HEADER_ALIASES).map(([field, aliases]) => [
        field,
        findColumnIndex(row, aliases)
      ])
    )
    const hasRequiredColumns = [
      indexes.importTeamName,
      indexes.opponent,
      indexes.date,
      indexes.time
    ].every(index => index >= 0)
    const hasHomeEvidence = indexes.homeAway >= 0 || indexes.homeTeam >= 0

    if (hasRequiredColumns && hasHomeEvidence) {
      return { rowIndex, headers: row, indexes }
    }
  }

  const firstNonEmptyIndex = rows.findIndex(row => !isEmptyRow(row))

  if (firstNonEmptyIndex < 0) {
    throw new GameImportError(
      'EMPTY_SHEET',
      'Das Tabellenblatt enthält keine Daten.'
    )
  }

  const headers = rows[firstNonEmptyIndex]
  const indexes = Object.fromEntries(
    Object.entries(HEADER_ALIASES).map(([field, aliases]) => [
      field,
      findColumnIndex(headers, aliases)
    ])
  )
  const missingColumns = REQUIRED_COLUMNS.filter(column => {
    const field = {
      Mannschaft: 'importTeamName',
      GAST: 'opponent',
      Datum: 'date',
      Anwurf: 'time'
    }[column]

    return indexes[field] < 0
  })

  if (indexes.homeAway < 0 && indexes.homeTeam < 0) {
    missingColumns.push('H/A oder HEIM')
  }

  throw new GameImportError(
    'MISSING_COLUMNS',
    `Pflichtspalten fehlen: ${missingColumns.join(', ')}.`,
    { missingColumns }
  )
}

function isValidDateParts(year, month, day) {
  const date = new Date(Date.UTC(year, month - 1, day))

  return (
    date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day
  )
}

function normalizeYear(year) {
  if (year >= 100) {
    return year
  }

  return year >= 70 ? 1900 + year : 2000 + year
}

function parseDateValue(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return {
      year: value.getUTCFullYear(),
      month: value.getUTCMonth() + 1,
      day: value.getUTCDate()
    }
  }

  const text = normalizeImportText(value)
  let match = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(text)

  if (match) {
    const [, year, month, day] = match.map(Number)
    return { year, month, day }
  }

  match = /^(\d{1,2})[./](\d{1,2})[./](\d{2}|\d{4})$/.exec(text)

  if (match) {
    const [, day, month, rawYear] = match.map(Number)
    return { year: normalizeYear(rawYear), month, day }
  }

  return null
}

function parseTimeValue(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return {
      hour: value.getUTCHours(),
      minute: value.getUTCMinutes()
    }
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    const fraction = value - Math.floor(value)
    const totalMinutes = Math.round(fraction * 24 * 60)

    if (totalMinutes >= 0 && totalMinutes < 24 * 60) {
      return {
        hour: Math.floor(totalMinutes / 60),
        minute: totalMinutes % 60
      }
    }
  }

  const match = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(
    normalizeImportText(value)
  )

  if (!match) {
    return null
  }

  const hour = Number(match[1])
  const minute = Number(match[2])

  return hour <= 23 && minute <= 59 ? { hour, minute } : null
}

function pad(value) {
  return String(value).padStart(2, '0')
}

function buildStartTime(dateParts, timeParts) {
  if (
    !dateParts
    || !timeParts
    || !isValidDateParts(dateParts.year, dateParts.month, dateParts.day)
  ) {
    return null
  }

  const localDate = new Date(
    dateParts.year,
    dateParts.month - 1,
    dateParts.day,
    timeParts.hour,
    timeParts.minute,
    0,
    0
  )

  if (
    localDate.getFullYear() !== dateParts.year
    || localDate.getMonth() !== dateParts.month - 1
    || localDate.getDate() !== dateParts.day
    || localDate.getHours() !== timeParts.hour
    || localDate.getMinutes() !== timeParts.minute
  ) {
    return null
  }

  return localDate.toISOString()
}

function detectHomeGame(homeAwayValue, homeTeamValue) {
  const homeAway = normalizeHeader(homeAwayValue)

  if (['LOCAL', 'HEIM', 'HOME', 'H', '1'].includes(homeAway)) {
    return true
  }

  if (['AWAY', 'AUSWARTS', 'GAST', 'VISITOR', 'A', '0'].includes(homeAway)) {
    return false
  }

  if (homeAway) {
    return null
  }

  const homeTeam = normalizeComparisonText(homeTeamValue)

  if (homeTeam.startsWith('tv homburg') || homeTeam.startsWith('tvh')) {
    return true
  }

  return homeTeam ? false : null
}

function getCell(row, index) {
  return index >= 0 ? row[index] : null
}

function parseDataRow(row, rowNumber, indexes) {
  const importTeamName = normalizeImportText(getCell(row, indexes.importTeamName))
  const opponent = normalizeImportText(getCell(row, indexes.opponent))
  const dateParts = parseDateValue(getCell(row, indexes.date))
  const timeParts = parseTimeValue(getCell(row, indexes.time))
  const isHome = detectHomeGame(
    getCell(row, indexes.homeAway),
    getCell(row, indexes.homeTeam)
  )
  const messages = []

  if (!importTeamName) {
    messages.push('Die Mannschaft fehlt.')
  }

  if (!opponent) {
    messages.push('Die Gastmannschaft fehlt.')
  }

  if (!dateParts || !isValidDateParts(dateParts.year, dateParts.month, dateParts.day)) {
    messages.push('Das Datum ist ungültig.')
  }

  if (!timeParts) {
    messages.push('Die Anwurfzeit ist ungültig.')
  }

  const startTime = buildStartTime(dateParts, timeParts)

  return {
    rowNumber,
    importTeamName,
    matchedTeamId: null,
    matchedTeamName: null,
    opponent,
    date: dateParts && isValidDateParts(
      dateParts.year,
      dateParts.month,
      dateParts.day
    )
      ? `${dateParts.year}-${pad(dateParts.month)}-${pad(dateParts.day)}`
      : null,
    time: timeParts ? `${pad(timeParts.hour)}:${pad(timeParts.minute)}` : null,
    startTime,
    isHome,
    status: null,
    messages,
    duplicateGameId: null
  }
}

export function parseImportSheet(rows, sheetName = 'Unbekanntes Blatt') {
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new GameImportError(
      'EMPTY_SHEET',
      'Das Tabellenblatt enthält keine Daten.'
    )
  }

  const { rowIndex, headers, indexes } = getHeaderLayout(rows)
  const dataRows = rows
    .slice(rowIndex + 1)
    .map((row, index) => ({
      row,
      rowNumber: rowIndex + index + 2
    }))
    .filter(({ row }) => !isEmptyRow(row))
    .map(({ row, rowNumber }) => parseDataRow(row, rowNumber, indexes))

  if (dataRows.length === 0) {
    throw new GameImportError(
      'EMPTY_SHEET',
      'Das Tabellenblatt enthält keine Datenzeilen.'
    )
  }

  return {
    sheetName,
    columns: headers.map(normalizeImportText).filter(Boolean),
    rows: dataRows
  }
}

function getAutomaticTeam(importTeamName, teams) {
  const normalizedImportName = normalizeComparisonText(importTeamName)
  const importNameMatches = teams.filter(
    team => normalizeComparisonText(team.import_name) === normalizedImportName
  )

  if (importNameMatches.length === 1) {
    return { team: importNameMatches[0], source: 'import_name' }
  }

  const nameMatches = teams.filter(
    team => normalizeComparisonText(team.name) === normalizedImportName
  )

  return nameMatches.length === 1
    ? { team: nameMatches[0], source: 'name' }
    : null
}

function findManualTeam(importTeamName, teams, manualMappings) {
  const teamId = manualMappings[normalizeComparisonText(importTeamName)]

  const team = teams.find(team => String(team.id) === String(teamId)) ?? null

  return team ? { team, source: 'manual' } : null
}

function getDuplicateKey(teamId, startTime, opponent) {
  const timestamp = new Date(startTime).getTime()

  if (!teamId || Number.isNaN(timestamp)) {
    return null
  }

  return [
    String(teamId),
    String(timestamp),
    normalizeComparisonText(opponent)
  ].join('|')
}

export function analyzeImportRows(
  parsedRows,
  teams = [],
  existingGames = [],
  manualMappings = {}
) {
  const existingGamesByKey = new Map(
    existingGames
      .map(game => [
        getDuplicateKey(game.team_id, game.start_time, game.opponent),
        game
      ])
      .filter(([key]) => key)
  )
  const seenFileKeys = new Set()

  return parsedRows.map(parsedRow => {
    const messages = [...parsedRow.messages]
    const match =
      findManualTeam(parsedRow.importTeamName, teams, manualMappings)
      ?? getAutomaticTeam(parsedRow.importTeamName, teams)
    const matchedTeam = match?.team ?? null
    const row = {
      ...parsedRow,
      matchedTeamId: matchedTeam?.id ?? null,
      matchedTeamName: matchedTeam?.name ?? null,
      mappingSource: match?.source ?? null,
      messages,
      duplicateGameId: null
    }

    if (parsedRow.isHome !== true) {
      row.status = IMPORT_STATUS.NOT_HOME
      messages.push(
        'Die Zeile ist nicht eindeutig als Heimspiel des TV Homburg erkennbar.'
      )
      return row
    }

    if (messages.length > 0 || !parsedRow.startTime) {
      row.status = IMPORT_STATUS.INVALID
      return row
    }

    if (!matchedTeam) {
      row.status = IMPORT_STATUS.UNMATCHED
      messages.push('Für die Excel-Mannschaft ist kein Team zugeordnet.')
      return row
    }

    const duplicateKey = getDuplicateKey(
      matchedTeam.id,
      parsedRow.startTime,
      parsedRow.opponent
    )
    const existingGame = existingGamesByKey.get(duplicateKey)

    if (existingGame) {
      row.status = IMPORT_STATUS.DUPLICATE_EXISTING
      row.duplicateGameId = existingGame.id
      messages.push('Dieses Spiel ist bereits in Supabase vorhanden.')
      return row
    }

    if (seenFileKeys.has(duplicateKey)) {
      row.status = IMPORT_STATUS.DUPLICATE_FILE
      messages.push('Dieses Spiel kommt in der Excel-Datei mehrfach vor.')
      return row
    }

    seenFileKeys.add(duplicateKey)
    row.status = IMPORT_STATUS.READY
    messages.push('Die Zeile ist für den Import in Sprint 2B vorbereitet.')
    return row
  })
}

export function getImportSummary(rows) {
  const count = status => rows.filter(row => row.status === status).length

  return {
    total: rows.length,
    ready: count(IMPORT_STATUS.READY),
    unmatched: count(IMPORT_STATUS.UNMATCHED),
    invalid: count(IMPORT_STATUS.INVALID),
    duplicates:
      count(IMPORT_STATUS.DUPLICATE_EXISTING)
      + count(IMPORT_STATUS.DUPLICATE_FILE),
    skipped: count(IMPORT_STATUS.NOT_HOME)
  }
}
