# Contexto Jera Horizonte

Produto: Jera Horizonte — plataforma de patrimônio para multi-family office.
Stack: Next.js 15+ App Router · TypeScript strict · Supabase · Prisma · Clerk · TailwindCSS v4

Leia `node_modules/next/dist/docs/` antes de escrever qualquer rota ou server action.

## Convenções duras

- **Linguagem**: PT-BR para UI, logs, mensagens de erro ao usuário. EN para código, comentários, commits.
- **Commits**: Conventional Commits — feat, fix, chore, refactor, test, docs.
- **Branches**: `feat/<scope>`, `fix/<scope>`, `chore/<scope>`.
- **PRs**: título imperativo em inglês; descrição em PT-BR explicando contexto de negócio.
- **TypeScript**: strict mode ativo. Nenhum `any` sem comentário `// reason:`.
- **Tests**: Vitest para unit, Playwright para e2e. Coverage mínimo 70% em `src/lib/`.
- **Imports**: absoluto via `@/`. Ordem: externos → internos → tipos → estilos.
- **Componentes React**: um por arquivo, default export, tipado via `ComponentProps`.

## Nomes de dados

- Família padrão para dev: **"Família Teste"**
- Tabelas: inglês singular (`family`, `asset`, `allocation`, `member`)
- Componentes: PascalCase (`FamilyCard`, `AllocationChart`)
- Server actions: camelCase com verbo (`createFamily`, `updateAllocation`)
- Arquivos: kebab-case (`family-card.tsx`, `use-current-member.ts`)

## Paleta Jera

Definida como custom properties em `src/app/globals.css` e mapeada no `@theme`:

```
jera-black: #070A0C  — fundo principal
jera-night: #0D1B22  — superfícies secundárias
jera-deep:  #052B38  — painéis e cards
jera-teal:  #0B7A6E  — accent principal
jera-off:   #F0EDE6  — texto claro
jera-mint:  #B7F1E6  — highlight / números hero
```

Tipografia: `font-serif` = Fraunces (números hero, títulos H1). `font-sans` = Instrument Sans (corpo).
Border-radius máximo: 16px. Nunca usar cores fora desta paleta.

## Stack fixa

- Next.js (App Router) — verificar versão em package.json, pode ser 15 ou 16
- TypeScript 5.4+ strict
- Supabase (PostgreSQL + RLS)
- Prisma (ORM)
- Clerk (auth)
- TailwindCSS v4 + shadcn/ui (customizado Jera)
- Recharts para dashboards
- Zod para validação de inputs
- Vitest + Playwright
- Vercel (deploy)
- Sentry (monitoring — instalar na Sessão 6)

## O que NUNCA fazer sem permissão explícita

- Rodar migration em produção
- Alterar RLS policies sem security review
- Deploy direto (sempre via PR + preview Vercel)
- Criar usuário admin ou service account
- Commitar qualquer secret ou key
- Refatorar código fora do escopo da sessão atual
