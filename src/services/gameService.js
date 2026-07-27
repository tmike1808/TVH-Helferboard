import { supabase } from '../lib/supabase'
import { buildImportPayload } from './gameImportModel'
import { normalizeComparisonText } from './gameImportParser'

const GAME_FIELDS = 'id, team_id, start_time, opponent, is_home'
const TEAM_FIELDS = 'id, name, category, import_name'

export class GameServiceError extends Error {
  constructor(code, message, cause, details = {}) {
    super(message, { cause })
    this.name = 'GameServiceError'
    this.code = code
    this.details = details
  }
}

function buildGamePayload(game) {
  return {
    team_id: game.team_id,
    start_time: game.start_time,
    opponent: game.opponent,
    is_home: game.is_home
  }
}

function requireGameId(id) {
  if (typeof id !== 'string' || !id.trim()) {
    throw new GameServiceError(
      'INVALID_GAME_ID',
      'Für die Spielaktion fehlt eine gültige Spiel-ID.'
    )
  }

  return id.trim()
}

function requireTeamId(id) {
  if (typeof id !== 'string' || !id.trim()) {
    throw new GameServiceError(
      'INVALID_TEAM_ID',
      'Für die Mannschaftszuordnung fehlt eine gültige Team-ID.'
    )
  }

  return id.trim()
}

export async function getTeams() {
  const { data, error } = await supabase
    .from('teams')
    .select(TEAM_FIELDS)

  if (error) {
    throw error
  }

  return (data ?? []).sort((firstTeam, secondTeam) =>
    (firstTeam.name ?? '').localeCompare(secondTeam.name ?? '', 'de')
  )
}

export async function getGames(knownTeams) {
  // Das bestehende Dashboard verwendet start_time; ein Feld date ist im
  // nachweisbaren Datenmodell außerhalb des bisherigen Services nicht belegt.
  const gamesQuery = supabase
    .from('games')
    .select(GAME_FIELDS)
    .order('start_time', { ascending: true, nullsFirst: false })

  const [gamesResult, teams] = Array.isArray(knownTeams)
    ? [await gamesQuery, knownTeams]
    : await Promise.all([gamesQuery, getTeams()])

  if (gamesResult.error) {
    throw gamesResult.error
  }

  const teamsById = new Map(
    teams.map(team => [
      String(team.id),
      team
    ])
  )

  return (gamesResult.data ?? []).map(game => ({
    ...game,
    team: teamsById.get(String(game.team_id)) ?? null
  }))
}

export async function createGame(game) {
  const payload = buildGamePayload(game)

  const { error } = await supabase
    .from('games')
    .insert(payload)

  if (error) {
    throw new GameServiceError(
      'CREATE_FAILED',
      'Das Spiel konnte nicht angelegt werden.',
      error
    )
  }

  return payload
}

export async function importGames(rows, { onProgress } = {}) {
  const candidates = Array.isArray(rows) ? rows : []
  const successful = []
  const failed = []

  for (let index = 0; index < candidates.length; index += 1) {
    const row = candidates[index]
    let payload

    try {
      payload = buildImportPayload(row)
    } catch (error) {
      failed.push({
        rowNumber: row?.rowNumber ?? null,
        message: error.message,
        error
      })
      onProgress?.({
        processed: index + 1,
        total: candidates.length
      })
      continue
    }

    let data = null
    let error = null

    try {
      const result = await supabase
        .from('games')
        .insert(payload)
        .select('id')
        .maybeSingle()

      data = result.data
      error = result.error
    } catch (requestError) {
      error = requestError
    }

    if (error || !data) {
      const serviceError = new GameServiceError(
        'IMPORT_ROW_FAILED',
        'Das Spiel konnte nicht gespeichert werden.',
        error,
        { rowNumber: row.rowNumber }
      )

      failed.push({
        rowNumber: row.rowNumber,
        message:
          `Excel-Zeile ${row.rowNumber} konnte nicht gespeichert werden. `
          + 'Bitte prüfen Sie die Zeile und versuchen Sie es erneut.',
        error: serviceError
      })
    } else {
      successful.push({
        rowNumber: row.rowNumber,
        id: data.id
      })
    }

    onProgress?.({
      processed: index + 1,
      total: candidates.length
    })
  }

  return { successful, failed }
}

export async function saveTeamImportName(teamId, importName) {
  const normalizedTeamId = requireTeamId(teamId)
  const value = String(importName ?? '').trim()

  if (!value || value.length > 120) {
    throw new GameServiceError(
      'IMPORT_NAME_INVALID',
      'Der Excel-Mannschaftsname ist ungültig.'
    )
  }

  let teams
  let loadError

  try {
    const result = await supabase
      .from('teams')
      .select(TEAM_FIELDS)

    teams = result.data
    loadError = result.error
  } catch (requestError) {
    loadError = requestError
  }

  if (loadError) {
    throw new GameServiceError(
      'IMPORT_NAME_CHECK_FAILED',
      'Die Mannschaftszuordnung konnte nicht geprüft werden.',
      loadError
    )
  }

  const normalizedValue = normalizeComparisonText(value)
  const targetTeam = (teams ?? []).find(
    team => String(team.id) === normalizedTeamId
  )
  const conflictingTeam = (teams ?? []).find(
    team =>
      String(team.id) !== normalizedTeamId
      && team.import_name
      && normalizeComparisonText(team.import_name) === normalizedValue
  )

  if (!targetTeam) {
    throw new GameServiceError(
      'TEAM_NOT_FOUND',
      'Das ausgewählte Team wurde nicht gefunden.'
    )
  }

  if (conflictingTeam) {
    throw new GameServiceError(
      'IMPORT_NAME_CONFLICT',
      'Dieser Excel-Mannschaftsname ist bereits einem anderen Team zugeordnet.'
    )
  }

  if (targetTeam.import_name) {
    if (
      normalizeComparisonText(targetTeam.import_name) === normalizedValue
    ) {
      return targetTeam
    }

    throw new GameServiceError(
      'IMPORT_NAME_ALREADY_SET',
      'Das ausgewählte Team besitzt bereits einen anderen Importnamen.'
    )
  }

  let data
  let error

  try {
    const result = await supabase
      .from('teams')
      .update({ import_name: value })
      .eq('id', normalizedTeamId)
      .is('import_name', null)
      .select(TEAM_FIELDS)
      .maybeSingle()

    data = result.data
    error = result.error
  } catch (requestError) {
    error = requestError
  }

  if (error?.code === '23505') {
    throw new GameServiceError(
      'IMPORT_NAME_CONFLICT',
      'Dieser Excel-Mannschaftsname ist bereits einem anderen Team zugeordnet.',
      error
    )
  }

  if (error) {
    throw new GameServiceError(
      'IMPORT_NAME_SAVE_FAILED',
      'Die Mannschaftszuordnung konnte nicht gespeichert werden.',
      error
    )
  }

  if (!data) {
    throw new GameServiceError(
      'IMPORT_NAME_CHANGED',
      'Die Mannschaftszuordnung wurde zwischenzeitlich geändert. '
      + 'Bitte laden Sie die Daten erneut.'
    )
  }

  return data
}

export async function updateGame(id, game) {
  const gameId = requireGameId(id)
  const payload = buildGamePayload(game)
  const { data, error } = await supabase
    .from('games')
    .update(payload)
    .eq('id', gameId)
    .select(GAME_FIELDS)
    .maybeSingle()

  if (error) {
    throw new GameServiceError(
      'UPDATE_FAILED',
      'Das Spiel konnte nicht aktualisiert werden.',
      error
    )
  }

  if (!data) {
    throw new GameServiceError(
      'GAME_NOT_FOUND',
      'Das Spiel wurde nicht gefunden oder darf nicht bearbeitet werden.'
    )
  }

  return data
}

export async function deleteGame(id) {
  const gameId = requireGameId(id)
  const { data, error } = await supabase
    .from('games')
    .delete()
    .eq('id', gameId)
    .select('id')
    .maybeSingle()

  if (error?.code === '23503') {
    throw new GameServiceError(
      'GAME_DELETE_BLOCKED',
      'Das Spiel wird noch von abhängigen Datensätzen verwendet.',
      error
    )
  }

  if (error) {
    throw new GameServiceError(
      'DELETE_FAILED',
      'Das Spiel konnte nicht gelöscht werden.',
      error
    )
  }

  if (!data) {
    throw new GameServiceError(
      'GAME_NOT_FOUND',
      'Das Spiel wurde nicht gefunden oder darf nicht gelöscht werden.'
    )
  }

  return data
}
