
import { supabase } from '../lib/supabase'

export async function createAssignment(payload) {

  const { error } = await supabase
    .from('helper_assignments')
    .insert([payload])

  if (error) {
    console.error(error)
    return false
  }

  return true
}

export async function deleteAssignment(id) {

  const { error } = await supabase
    .from('helper_assignments')
    .delete()
    .eq('id', id)

  if (error) {
    console.error(error)
    return false
  }

  return true
}
