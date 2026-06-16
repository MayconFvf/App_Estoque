# Supabase Edge Functions

## Função `create-user`

A criação de usuários passa pela Edge Function `create-user` para manter a `service_role` somente no ambiente do Supabase. O frontend chama a função autenticado com o JWT do admin logado.

## Configurar secrets

No Supabase hospedado, `SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` normalmente já ficam disponíveis para Edge Functions. Se precisar configurar manualmente:

```bash
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
```

Para conferir secrets remotos:

```bash
supabase secrets list
```

Para desenvolvimento local, crie `supabase/functions/.env` ou use:

```bash
supabase functions serve create-user --env-file .env.local
```

## Deploy

Faça login, conecte o projeto e publique a função:

```bash
supabase login
supabase link --project-ref seu-project-ref
supabase functions deploy create-user
```

## Teste rápido

1. Faça login no sistema com um usuário `admin` ativo.
2. Acesse `/usuarios`.
3. Cadastre um usuário com nome, e-mail, senha e perfil.
4. Confirme no Supabase Auth que o usuário foi criado.
5. Confirme em `public.profiles` que o profile foi criado com `active = true`.
6. Faça logout e entre com o novo usuário.
7. Teste também com um usuário `seller`: ele não deve acessar `/usuarios` nem chamar a função com sucesso.
