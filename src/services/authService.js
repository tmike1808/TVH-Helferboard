import { supabase } from '../lib/supabase'

export async function getCurrentSession() {
  const { data, error } = await supabase.auth.getSession()

  if (error) {
    throw error
  }

  return data.session
}

export function subscribeToAuthChanges(onSessionChange) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    onSessionChange(session)
  })

  return data.subscription
}

export async function signInWithPassword(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (error) {
    throw error
  }

  return data.session
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()

  if (error) {
    throw error
  }
}

export async function isCurrentUserAdmin() {
  const { data, error } = await supabase.rpc('is_admin')

  if (error) {
    throw error
  }

  return data === true
}
