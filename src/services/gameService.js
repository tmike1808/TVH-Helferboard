import { supabase } from '../lib/supabase'

const GAME_FIELDS = 'id, team_id, start_time, opponent, is_home'
const TEAM_FIELDS = 'id, name, category'

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
  const payload = {
    team_id: game.team_id,
    start_time: game.start_time,
    opponent: game.opponent,
    is_home: game.is_home
  }

  const { error } = await supabase
    .from('games')
    .insert(payload)

  if (error) {
    throw error
  }

  return payload
}

export const updateGame=(id,g)=>supabase.from('games').update(g).eq('id',id)
export const deleteGame=(id)=>supabase.from('games').delete().eq('id',id)
