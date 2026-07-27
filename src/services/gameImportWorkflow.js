import {
  IMPORT_STATUS,
  analyzeImportRows,
  normalizeComparisonText
} from './gameImportParser.js'
import { buildImportResultSummary } from './gameImportModel.js'

function getRememberedAliases(
  parsedRows,
  manualMappings,
  rememberedMappings
) {
  const aliases = []

  for (const [normalizedName, shouldRemember] of Object.entries(
    rememberedMappings
  )) {
    if (!shouldRemember) {
      continue
    }

    const teamId = manualMappings[normalizedName]
    const row = parsedRows.find(
      candidate =>
        normalizeComparisonText(candidate.importTeamName) === normalizedName
    )

    if (teamId && row?.importTeamName) {
      aliases.push({
        teamId,
        importName: row.importTeamName
      })
    }
  }

  return aliases
}

async function saveRememberedAliases(
  aliases,
  saveTeamImportName
) {
  const successful = []
  const failed = []

  if (typeof saveTeamImportName !== 'function') {
    return { successful, failed }
  }

  for (const alias of aliases) {
    try {
      const savedTeam = await saveTeamImportName(
        alias.teamId,
        alias.importName
      )
      successful.push({ ...alias, team: savedTeam })
    } catch (error) {
      failed.push({
        ...alias,
        error,
        message:
          error?.message
          || 'Die Mannschaftszuordnung konnte nicht gespeichert werden.'
      })
    }
  }

  return { successful, failed }
}

function getSkippedRows(rows) {
  return rows
    .filter(row => row.status !== IMPORT_STATUS.READY)
    .map(row => ({
      rowNumber: row.rowNumber,
      status: row.status,
      message: row.messages.join(' ')
    }))
}

export async function executeGameImport({
  parsedRows,
  teams,
  manualMappings = {},
  rememberedMappings = {},
  loadGames,
  insertGames,
  saveTeamImportName,
  refreshDashboard,
  onProgress
}) {
  const latestGames = await loadGames(teams)
  const recheckedRows = analyzeImportRows(
    parsedRows,
    teams,
    latestGames,
    manualMappings
  )
  const readyRows = recheckedRows.filter(
    row => row.status === IMPORT_STATUS.READY
  )
  const aliases = getRememberedAliases(
    parsedRows,
    manualMappings,
    rememberedMappings
  )
  const aliasResult = await saveRememberedAliases(
    aliases,
    saveTeamImportName
  )
  const importResult = readyRows.length > 0
    ? await insertGames(readyRows, { onProgress })
    : { successful: [], failed: [] }
  const refreshWarnings = []
  let refreshedGames = latestGames

  if (importResult.successful.length > 0) {
    const [gamesResult, dashboardResult] = await Promise.allSettled([
      loadGames(teams),
      typeof refreshDashboard === 'function'
        ? refreshDashboard()
        : Promise.resolve()
    ])

    if (gamesResult.status === 'fulfilled') {
      refreshedGames = gamesResult.value
    } else {
      refreshWarnings.push(
        'Die Admin-Spieleliste konnte nicht vollständig aktualisiert werden.'
      )
    }

    if (dashboardResult.status === 'rejected') {
      refreshWarnings.push(
        'Das Dashboard konnte nicht vollständig aktualisiert werden.'
      )
    }
  }

  const summary = buildImportResultSummary(
    recheckedRows,
    importResult.successful,
    importResult.failed
  )

  return {
    status:
      importResult.failed.length > 0
        ? importResult.successful.length > 0
          ? 'partial'
          : 'failed'
        : 'completed',
    rows: recheckedRows,
    refreshedGames,
    summary,
    successful: importResult.successful,
    failed: importResult.failed,
    skipped: getSkippedRows(recheckedRows),
    aliases: aliasResult,
    refreshWarnings
  }
}

export function createImportController() {
  let running = false

  return {
    isRunning() {
      return running
    },

    async execute({ confirmed = false, ...options }) {
      if (!confirmed) {
        return {
          status: 'cancelled',
          started: false
        }
      }

      if (running) {
        return {
          status: 'already-running',
          started: false
        }
      }

      running = true

      try {
        const result = await executeGameImport(options)
        return {
          ...result,
          started: true
        }
      } finally {
        running = false
      }
    }
  }
}
