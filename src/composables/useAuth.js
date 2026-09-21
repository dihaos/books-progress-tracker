import { ref } from 'vue'
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase.js'

const user = ref(null)
const loading = ref(isSupabaseConfigured)
const authError = ref(null)

let initialized = false

export function useAuth() {
  async function initAuth() {
    if (!isSupabaseConfigured || initialized) {
      loading.value = false
      return user.value
    }

    const supabase = getSupabase()
    if (!supabase) {
      loading.value = false
      return null
    }

    loading.value = true
    authError.value = null

    const { data, error } = await supabase.auth.getSession()
    if (error) {
      authError.value = error.message
    } else {
      user.value = data.session?.user ?? null
    }

    if (!initialized) {
      supabase.auth.onAuthStateChange((_event, session) => {
        user.value = session?.user ?? null
      })
      initialized = true
    }

    loading.value = false
    return user.value
  }

  async function signUp(email, password) {
    const supabase = getSupabase()
    if (!supabase) throw new Error('Supabase не настроен')

    authError.value = null
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error

    if (data.session) {
      user.value = data.session.user
    }

    return data
  }

  async function signIn(email, password) {
    const supabase = getSupabase()
    if (!supabase) throw new Error('Supabase не настроен')

    authError.value = null
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error

    user.value = data.session?.user ?? null
    return data
  }

  async function signOut() {
    const supabase = getSupabase()
    if (!supabase) return

    authError.value = null
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    user.value = null
  }

  return {
    user,
    loading,
    authError,
    initAuth,
    signUp,
    signIn,
    signOut
  }
}
