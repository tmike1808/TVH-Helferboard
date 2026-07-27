import { supabase } from '../lib/supabase'

export async function getGames() {
  // Das bestehende Dashboard verwendet start_time; ein Feld date ist im
  // nachweisbaren Datenmodell außerhalb des bisherigen Services nicht belegt.
  const [gamesResult, teamsResult] = await Promise.all([
    supabase
      .from('games')
      .select('id, team_id, start_time, opponent, is_home')
      .order('start_time', { ascending: true, nullsFirst: false }),
    supabase
      .from('teams')
      .select('id, name, category')
  ])

  if (gamesResult.error) {
    throw gamesResult.error
  }

  if (teamsResult.error) {
    throw teamsResult.error
  }

  const teamsById = new Map(
    (teamsResult.data ?? []).map(team => [
      String(team.id),
      team
    ])
  )

  return (gamesResult.data ?? []).map(game => ({
    ...game,
    team: teamsById.get(String(game.team_id)) ?? null
  }))
}

export const createGame=(g)=>supabase.from('games').insert(g)
export const updateGame=(id,g)=>supabase.from('games').update(g).eq('id',id)
export const deleteGame=(id)=>supabase.from('games').delete().eq('id',id)
