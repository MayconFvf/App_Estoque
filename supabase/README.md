# Supabase Edge Functions

## Função `create-user`

A criação de usuários passa pela Edge Function `create-user` para manter a `service_role` somente no ambiente do Supabase. O frontend chama a função autenticado com o JWT do admin logado.

## Função `update-user-password`

A troca de senha de usuários passa pela Edge Function `update-user-password`. O frontend envia o JWT do admin logado, o `auth_user_id` do usuário alvo e a nova senha.

A função valida que quem chamou é um `admin` ativo em `public.profiles` e só então usa a Admin API do Supabase para atualizar a senha no Supabase Auth.

A `service_role` deve ficar somente nos secrets das Edge Functions. Não use essa chave no frontend.

## Configurar secrets

No Supabase hospedado, `SUPABASE_URL`, `SUPABASE_ANON_KEY` e a chave de service role normalmente ficam disponíveis para Edge Functions. A função `update-user-password` reutiliza `SERVICE_ROLE_KEY` e também aceita `SUPABASE_SERVICE_ROLE_KEY` como fallback.

Se precisar configurar manualmente:

```bash
supabase secrets set SERVICE_ROLE_KEY=sua-service-role-key
```

Se o projeto já usa o nome antigo:

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
supabase functions serve update-user-password --env-file .env.local
```

## Deploy

Faça login, conecte o projeto e publique as funções:

```bash
supabase login
supabase link --project-ref seu-project-ref
supabase functions deploy create-user
supabase functions deploy update-user-password
```

Para publicar somente a troca de senha:

```bash
npx supabase functions deploy update-user-password
```

## Teste rápido

1. Faça login no sistema com um usuário `admin` ativo.
2. Acesse `/usuarios`.
3. Cadastre um usuário com nome, e-mail, senha e perfil.
4. Confirme no Supabase Auth que o usuário foi criado.
5. Confirme em `public.profiles` que o profile foi criado com `active = true`.
6. Abra o menu de três pontinhos de um usuário e clique em `Trocar senha`.
7. Informe uma nova senha com pelo menos 6 caracteres e confirme.
8. Faça logout e valide que o usuário entra com a nova senha.
9. Valide que a senha antiga não funciona mais.
10. Teste também com um usuário `seller`: ele não deve acessar `/usuarios` nem chamar `update-user-password` com sucesso.
