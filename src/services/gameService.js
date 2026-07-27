import { supabase } from '../lib/supabase'

const GAME_FIELDS = 'id, team_id, start_time, opponent, is_home'
const TEAM_FIELDS = 'id, name, category'

export class GameServiceError extends Error {
  constructor(code, message, cause) {
    super(message, { cause })
    this.name = 'GameServiceError'
    this.code = code
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
