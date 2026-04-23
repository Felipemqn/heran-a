# Jera Horizonte

Plataforma de gestao patrimonial para multi-family office da Jera Capital.

## Stack

- **Next.js 16** (App Router, Turbopack)
- **TypeScript** strict
- **TailwindCSS v4** com paleta Jera
- **shadcn/ui** (primitives Radix + customizacao Jera)
- **Prisma 7** + **Supabase** (PostgreSQL + RLS)
- **Clerk** (autenticacao)
- **Vitest** + **Playwright** (testes)

## Setup local

```bash
npm install
cp .env.example .env.local  # preencher com credenciais reais
npm run db:generate         # gera o Prisma Client (ver notas abaixo)
npm run db:migrate          # aplica migrations
npm run db:seed             # popula Familia Silva
npm run dev
```

Acesse `http://localhost:3000`.

### Credenciais obrigatorias no .env.local

| Variavel | Onde obter |
|---|---|
| `DATABASE_URL` / `DIRECT_URL` | Supabase project settings |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk dashboard |
| `CLERK_SECRET_KEY` | Clerk dashboard |
| `CLERK_WEBHOOK_SECRET` | Clerk webhook endpoint |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase API settings |

Sem essas variaveis o app sobe mas retorna 500 nas rotas (Clerk valida a publishable key no boot).

## Scripts

| Script | Acao |
|---|---|
| `npm run dev` | Next dev server (Turbopack) |
| `npm run build` | Build producao |
| `npm run type-check` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm test` | Vitest unit |
| `npm run e2e` | Playwright |
| `npm run db:generate` | Prisma Client generate |
| `npm run db:migrate` | Prisma migrations |
| `npm run db:seed` | Seed da Familia Silva |

## Estrutura

```
src/
  app/                  Next.js App Router
    (app)/              rotas autenticadas (dashboard, etc.)
    (auth)/             sign-in, sign-up
    api/webhooks/clerk  sync de usuarios
    styleguide/         paleta + primitives demo
  components/
    ui/                 primitives Jera (Button, Card, Stat, Panel, Badge)
    charts/             Recharts wrappers (Sparkline)
    modules/            componentes de feature (AllocationBars, etc.)
  lib/                  helpers (format, db, current-member, utils)
  server/
    queries/            consultas Prisma tipadas
    integrations/       HubSpot, Fireflies, Sentry
  types/                tipos de dominio
prisma/
  schema.prisma         modelo completo
  seed.ts               Familia Silva
  rls.sql               RLS policies para Supabase
```

## Notas operacionais

### OneDrive e `prisma generate`

Se o repo esta dentro do OneDrive, `prisma generate` pode falhar com `EPERM`
no `schema-engine` binario. Causa: OneDrive mantem arquivos `.exe` como
placeholder "cloud-only". Solucoes:

1. Excluir `node_modules/` da sincronizacao OneDrive (recomendado)
2. Mover o projeto para fora do OneDrive
3. Rodar `attrib +P -U` no diretorio de cache com permissao de admin

Enquanto `prisma generate` nao roda, `src/lib/db.ts` e `prisma/seed.ts` usam
um fallback com tipos `any` para manter o `type-check` limpo. Depois do
generate, os tipos reais assumem automaticamente.

### Next 16: middleware vs proxy

Next 16 deprecou a convencao `middleware.ts`. O arquivo esta em `src/proxy.ts`.

## Convencoes

Ver `CLAUDE.md` para regras de codigo, commits e paleta.
