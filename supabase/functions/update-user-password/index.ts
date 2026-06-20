import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

type UpdateUserPasswordPayload = {
  auth_user_id?: string
  password?: string
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

function validatePayload(payload: UpdateUserPasswordPayload) {
  const authUserId = payload.auth_user_id?.trim()
  const password = payload.password

  if (!authUserId) {
    return { error: 'Usuário é obrigatório.' }
  }

  if (!password) {
    return { error: 'Nova senha é obrigatória.' }
  }

  if (password.length < 6) {
    return { error: 'Senha precisa ter no mínimo 6 caracteres.' }
  }

  return {
    value: {
      authUserId,
      password,
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
  const supabaseServiceRoleKey =
    Deno.env.get('SERVICE_ROLE_KEY') ??
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

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
    return jsonResponse({ error: 'Sem permissão para trocar senha.' }, 403)
  }

  let payload: UpdateUserPasswordPayload

  try {
    payload = await req.json()
  } catch {
    return jsonResponse({ error: 'JSON inválido.' }, 400)
  }

  const validation = validatePayload(payload)

  if ('error' in validation) {
    return jsonResponse({ error: validation.error }, 400)
  }

  const { authUserId, password } = validation.value

  const { data: targetProfile, error: targetProfileError } = await adminClient
    .from('profiles')
    .select('id')
    .eq('auth_user_id', authUserId)
    .maybeSingle()

  if (targetProfileError) {
    return jsonResponse({ error: targetProfileError.message }, 500)
  }

  if (!targetProfile) {
    return jsonResponse({ error: 'Usuário não encontrado.' }, 404)
  }

  const { error: updatePasswordError } =
    await adminClient.auth.admin.updateUserById(authUserId, {
      password,
    })

  if (updatePasswordError) {
    return jsonResponse({ error: updatePasswordError.message }, 400)
  }

  return jsonResponse({ message: 'Senha atualizada com sucesso.' })
})
