import { IMPORT_STATUS } from './gameImportParser.js'

export class GameImportValidationError extends Error {
  constructor(code, message) {
    super(message)
    this.name = 'GameImportValidationError'
    this.code = code
  }
}

export function buildImportPayload(row) {
  const teamId = String(row?.matchedTeamId ?? '').trim()
  const opponent = String(row?.opponent ?? '').trim()
  const startTime = new Date(row?.startTime ?? '')

  if (row?.status !== IMPORT_STATUS.READY) {
    throw new GameImportValidationError(
      'ROW_NOT_READY',
      'Nur vollständig geprüfte Zeilen mit Status „Bereit“ dürfen importiert werden.'
    )
  }

  if (!teamId) {
    throw new GameImportValidationError(
      'TEAM_REQUIRED',
      'Für den Import fehlt die zugeordnete TVH-Mannschaft.'
    )
  }

  if (Number.isNaN(startTime.getTime())) {
    throw new GameImportValidationError(
      'START_TIME_REQUIRED',
      'Für den Import fehlt ein gültiger Spieltermin.'
    )
  }

  if (!opponent || opponent.length > 120) {
    throw new GameImportValidationError(
      'OPPONENT_INVALID',
      'Für den Import fehlt ein gültiger Gegnername.'
    )
  }

  if (row?.isHome !== true) {
    throw new GameImportValidationError(
      'HOME_GAME_REQUIRED',
      'Es dürfen ausschließlich bestätigte Heimspiele importiert werden.'
    )
  }

  return {
    team_id: teamId,
    start_time: startTime.toISOString(),
    opponent,
    is_home: true
  }
}

function countStatus(rows, status) {
  return rows.filter(row => row.status === status).length
}

export function buildImportResultSummary(
  rows,
  successful = [],
  failed = []
) {
  const alreadyExisting = countStatus(
    rows,
    IMPORT_STATUS.DUPLICATE_EXISTING
  )
  const duplicateFile = countStatus(rows, IMPORT_STATUS.DUPLICATE_FILE)
  const invalid = countStatus(rows, IMPORT_STATUS.INVALID)
  const unmatched = countStatus(rows, IMPORT_STATUS.UNMATCHED)
  const notHome = countStatus(rows, IMPORT_STATUS.NOT_HOME)

  return {
    total: rows.length,
    ready: countStatus(rows, IMPORT_STATUS.READY),
    imported: successful.length,
    alreadyExisting,
    duplicateFile,
    invalid,
    unmatched,
    notHome,
    failed: failed.length,
    skipped:
      alreadyExisting
      + duplicateFile
      + invalid
      + unmatched
      + notHome
  }
}
