import { supabase } from '../lib/supabaseClient'

const PROFILE_COLUMNS =
  'id, auth_user_id, name, email, role, active, created_at, updated_at'

function getUserErrorMessage(error) {
  const message = error?.message || ''

  if (message.toLowerCase().includes('duplicate')) {
    return 'Já existe um usuário com este e-mail.'
  }

  return message || 'Não foi possível salvar o usuário.'
}

async function getFunctionErrorMessage(error) {
  if (error?.context) {
    try {
      const body = await error.context.json()
      return body.error || body.message || getUserErrorMessage(error)
    } catch {
      return getUserErrorMessage(error)
    }
  }

  return getUserErrorMessage(error)
}

export async function listUsers(searchTerm = '') {
  const search = searchTerm.trim()
  let query = supabase
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .order('name', { ascending: true })

  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(getUserErrorMessage(error))
  }

  return data || []
}

export async function createUser({ name, email, password, role }) {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.access_token) {
    throw new Error('Sessão expirada. Faça login novamente.')
  }

  const { data, error } = await supabase.functions.invoke('create-user', {
    body: {
      name: name.trim(),
      email: email.trim(),
      password,
      role,
    },
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  })

  if (error) {
    throw new Error(await getFunctionErrorMessage(error))
  }

  return data
}

export async function updateUserPassword({ authUserId, password }) {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.access_token) {
    throw new Error('Sessão expirada. Faça login novamente.')
  }

  const { data, error } = await supabase.functions.invoke(
    'update-user-password',
    {
      body: {
        auth_user_id: authUserId,
        password,
      },
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    },
  )

  if (error) {
    throw new Error(await getFunctionErrorMessage(error))
  }

  return data
}

export async function updateUser(userId, { name, role, active }) {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      name: name.trim(),
      role,
      active: Boolean(active),
    })
    .eq('id', userId)
    .select(PROFILE_COLUMNS)
    .single()

  if (error) {
    throw new Error(getUserErrorMessage(error))
  }

  return data
}

export async function setUserActive(userId, active) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ active })
    .eq('id', userId)
    .select(PROFILE_COLUMNS)
    .single()

  if (error) {
    throw new Error(getUserErrorMessage(error))
  }

  return data
}
