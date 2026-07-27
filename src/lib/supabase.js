
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase ist nicht konfiguriert. Bitte VITE_SUPABASE_URL und ' +
    'VITE_SUPABASE_ANON_KEY in einer lokalen .env.local setzen.'
  )
}

export const supabase = createClient(
  supabaseUrl || 'https://example.invalid',
  supabaseAnonKey || 'missing-anon-key'
)
