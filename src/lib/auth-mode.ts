// Dev-only: permite rodar localmente sem configurar Clerk.
// Ativado apenas quando:
//   1. NEXT_PUBLIC_DISABLE_AUTH=1 (explicito)
//   2. NODE_ENV !== 'production' (seguranca dupla)
// Qualquer uma das duas falhar, auth fica ligada normalmente.

export const AUTH_DISABLED =
  process.env.NEXT_PUBLIC_DISABLE_AUTH === '1' &&
  process.env.NODE_ENV !== 'production'

// Usuario mockado usado enquanto a auth esta desativada.
// Aponta para o primeiro founder da Familia Silva (seed).
export const MOCK_CLERK_USER_ID = 'dev-roberto-silva'
export const MOCK_MEMBER_NAME = 'Roberto Silva (DEV)'
