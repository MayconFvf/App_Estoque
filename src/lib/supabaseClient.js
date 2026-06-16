import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const rememberSessionKey = 'app_estoque_remember_session'

function hasBrowserStorage() {
  return typeof window !== 'undefined' && window.localStorage && window.sessionStorage
}

export function getRememberSession() {
  if (!hasBrowserStorage()) {
    return true
  }

  return window.localStorage.getItem(rememberSessionKey) !== 'false'
}

export function setRememberSession(rememberSession) {
  if (!hasBrowserStorage()) {
    return
  }

  window.localStorage.setItem(
    rememberSessionKey,
    rememberSession ? 'true' : 'false',
  )
}

const authStorage = {
  getItem(key) {
    if (!hasBrowserStorage()) {
      return null
    }

    return window.localStorage.getItem(key) ?? window.sessionStorage.getItem(key)
  },
  setItem(key, value) {
    if (!hasBrowserStorage()) {
      return
    }

    const targetStorage = getRememberSession()
      ? window.localStorage
      : window.sessionStorage
    const staleStorage = getRememberSession()
      ? window.sessionStorage
      : window.localStorage

    targetStorage.setItem(key, value)
    staleStorage.removeItem(key)
  },
  removeItem(key) {
    if (!hasBrowserStorage()) {
      return
    }

    window.localStorage.removeItem(key)
    window.sessionStorage.removeItem(key)
  },
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: authStorage,
  },
})
