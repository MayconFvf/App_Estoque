import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { AuthContext } from './authContext'
import { setRememberSession, supabase } from '../lib/supabaseClient'

const PROFILE_NOT_FOUND_MESSAGE = 'Perfil de usuário não encontrado.'
const INACTIVE_USER_MESSAGE = 'Usuário inativo.'

function getAuthErrorMessage(error) {
  if (!error) {
    return 'Não foi possível fazer login.'
  }

  if (error.message === 'Invalid login credentials') {
    return 'E-mail ou senha inválidos.'
  }

  return error.message || 'Não foi possível fazer login.'
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async (authUserId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, auth_user_id, name, email, role, active')
      .eq('auth_user_id', authUserId)
      .maybeSingle()

    if (error) {
      throw new Error(error.message)
    }

    if (!data) {
      await supabase.auth.signOut()
      throw new Error(PROFILE_NOT_FOUND_MESSAGE)
    }

    if (!data.active) {
      await supabase.auth.signOut()
      throw new Error(INACTIVE_USER_MESSAGE)
    }

    setProfile(data)
    return data
  }, [])

  useEffect(() => {
    let isMounted = true

    async function loadSession() {
      setLoading(true)

      const { data, error } = await supabase.auth.getSession()

      if (!isMounted) {
        return
      }

      if (error || !data.session?.user) {
        setSession(null)
        setUser(null)
        setProfile(null)
        setLoading(false)
        return
      }

      setSession(data.session)
      setUser(data.session.user)

      try {
        await fetchProfile(data.session.user.id)
      } catch {
        if (isMounted) {
          setProfile(null)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!isMounted) {
        return
      }

      setSession(nextSession)
      setUser(nextSession?.user ?? null)

      if (!nextSession?.user) {
        setProfile(null)
        setLoading(false)
        return
      }

      setLoading(true)
      fetchProfile(nextSession.user.id)
        .catch(() => {
          if (isMounted) {
            setProfile(null)
          }
        })
        .finally(() => {
          if (isMounted) {
            setLoading(false)
          }
        })
    })

    loadSession()

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [fetchProfile])

  const signIn = useCallback(
    async ({ email, password, rememberMe = true }) => {
      setLoading(true)
      setRememberSession(rememberMe)

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setLoading(false)
        throw new Error(getAuthErrorMessage(error))
      }

      try {
        const validProfile = await fetchProfile(data.user.id)
        setSession(data.session)
        setUser(data.user)
        setProfile(validProfile)
        return validProfile
      } finally {
        setLoading(false)
      }
    },
    [fetchProfile],
  )

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setSession(null)
    setUser(null)
    setProfile(null)
  }, [])

  const value = useMemo(
    () => ({
      session,
      user,
      profile,
      loading,
      signIn,
      signOut,
    }),
    [loading, profile, session, signIn, signOut, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
