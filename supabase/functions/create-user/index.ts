import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

type CreateUserPayload = {
  name?: string
  email?: string
  password?: string
  role?: string
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  })
}

function validatePayload(payload: CreateUserPayload) {
  const name = payload.name?.trim()
  const email = payload.email?.trim().toLowerCase()
  const password = payload.password
  const role = payload.role

  if (!name) {
    return { error: 'Nome é obrigatório.' }
  }

  if (!email) {
    return { error: 'E-mail é obrigatório.' }
  }

  if (!password) {
    return { error: 'Senha é obrigatória.' }
  }

  if (password.length < 6) {
    return { error: 'Senha precisa ter no mínimo 6 caracteres.' }
  }

  if (!role || !['admin', 'seller'].includes(role)) {
    return { error: 'Perfil inválido.' }
  }

  return {
    value: {
      name,
      email,
      password,
      role,
    },
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Método não permitido.' }, 405)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
    return jsonResponse(
      { error: 'Variáveis de ambiente do Supabase não configuradas.' },
      500,
    )
  }

  const authorization = req.headers.get('Authorization')

  if (!authorization?.startsWith('Bearer ')) {
    return jsonResponse({ error: 'Usuário não autenticado.' }, 401)
  }

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: authorization,
      },
    },
  })

  const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  const {
    data: { user },
    error: authError,
  } = await userClient.auth.getUser()

  if (authError || !user) {
    return jsonResponse({ error: 'Usuário não autenticado.' }, 401)
  }

  const { data: callerProfile, error: profileError } = await adminClient
    .from('profiles')
    .select('id, role, active')
    .eq('auth_user_id', user.id)
    .maybeSingle()

  if (profileError) {
    return jsonResponse({ error: profileError.message }, 500)
  }

  if (
    !callerProfile ||
    callerProfile.role !== 'admin' ||
    callerProfile.active !== true
  ) {
    return jsonResponse({ error: 'Acesso negado.' }, 403)
  }

  let payload: CreateUserPayload

  try {
    payload = await req.json()
  } catch {
    return jsonResponse({ error: 'JSON inválido.' }, 400)
  }

  const validation = validatePayload(payload)

  if ('error' in validation) {
    return jsonResponse({ error: validation.error }, 400)
  }

  const { name, email, password, role } = validation.value

  const { data: createdUser, error: createUserError } =
    await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        role,
      },
    })

  if (createUserError || !createdUser.user) {
    const message = createUserError?.message || 'Não foi possível criar usuário.'
    return jsonResponse({ error: message }, 400)
  }

  const { data: profile, error: insertProfileError } = await adminClient
    .from('profiles')
    .insert({
      auth_user_id: createdUser.user.id,
      name,
      email,
      role,
      active: true,
    })
    .select('id, auth_user_id, name, email, role, active, created_at, updated_at')
    .single()

  if (insertProfileError) {
    await adminClient.auth.admin.deleteUser(createdUser.user.id)

    return jsonResponse({ error: insertProfileError.message }, 400)
  }

  return jsonResponse({ profile }, 201)
})
