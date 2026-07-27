import { supabase } from '../lib/supabase'

export const getGames=()=>supabase.from('games').select('*').order('date')
export const createGame=(g)=>supabase.from('games').insert(g)
export const updateGame=(id,g)=>supabase.from('games').update(g).eq('id',id)
export const deleteGame=(id)=>supabase.from('games').delete().eq('id',id)
