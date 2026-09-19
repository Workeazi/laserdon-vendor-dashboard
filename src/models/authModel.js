import { supabase } from './supabaseClient'

export async function signInWithEmail(email, password) {
  // 1. Call our edge function to forcefully confirm the user's email if they have valid credentials
  const { data, error } = await supabase.functions.invoke('custom-login', {
    body: { email, password }
  })

  if (error || data?.error) {
    return { error: error || new Error(data.error) }
  }

  // 2. Now that their email is confirmed on the backend, standard Supabase Auth will work perfectly!
  return await supabase.auth.signInWithPassword({ email, password })
}

export async function signOut() {
  return await supabase.auth.signOut()
}

export async function getSession() {
  return await supabase.auth.getSession()
}

export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange(callback)
}
