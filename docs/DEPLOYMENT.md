# Deploy e operação — Jera Horizonte

Guia operacional curto para o time de engenharia.

## Ambientes

| Ambiente | URL | Branch | Banco |
|---|---|---|---|
| Produção | `horizonte.jeracapital.com` | `main` | Supabase prod |
| Preview | `*.vercel.app` (efêmera) | qualquer PR | Supabase preview |
| Local | `localhost:3000` | qualquer | Postgres local ou Supabase dev |

## Pipeline

1. PR para `main` dispara `.github/workflows/ci.yml` — type-check, lint, tests, build.
2. CI verde + review obrigatório → squash merge.
3. Merge em `main` → Vercel faz deploy automático em produção.
4. Sentry monitora por 30 min; se erro > 10/min ou LCP > 2,5s, rollback manual.

## Variáveis de ambiente no Vercel

Todas as chaves do `.env.example` precisam estar definidas no dashboard da Vercel, separadas entre **Production** e **Preview**:

- `DATABASE_URL`, `DIRECT_URL`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SECRET`
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `HUBSPOT_PRIVATE_APP_TOKEN`
- `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN`

⚠ `SENTRY_AUTH_TOKEN` é secret, não aparece no bundle.

## Health check

`GET /api/health` retorna:

```json
{ "ok": true, "uptime": 123.4, "dbLatencyMs": 12, "env": "production", "commit": "abc1234" }
```

- 200 ok ⇒ app respondendo + DB reachable
- 503 ⇒ DB inacessível (Supabase fora, connection pool esgotado, etc.)

Monitorar com Uptime Kuma, Better Stack ou similar a cada 30s.

## Deploy manual de emergência

```bash
# A partir da sua máquina, commit limpo em main
npm install
npm run type-check && npm test && npm run build
vercel --prod
```

Só usar se o pipeline GitHub Actions + Vercel estiver com problema. **Requer** aprovação de um segundo engenheiro.

## Rollback

```bash
# Via Vercel dashboard → Deployments → achar último deploy verde → "Promote to Production"
# Ou via CLI:
vercel rollback <deployment-url>
```

Rollback é reversível. Prefira sempre rollback a hotfix às pressas.

## Métricas no Sentry

- Projeto: `horizonte` na org Jera
- Alertas configurados:
  - HTTP 5xx > 10/min (crítico)
  - Error rate > 1% em 5min (alto)
  - LCP p75 > 2,5s (médio)
- Canal Slack: `#horizonte-alerts`

## Migrations de banco

**Nunca** rodar migration direto em produção sem:

1. Migration aplicada e testada em Supabase preview primeiro
2. Backup manual do Supabase (Dashboard → Database → Backups)
3. Janela de manutenção comunicada se migration for destrutiva

Ordem das operações:

```bash
# 1. Em ambiente de preview:
DATABASE_URL=$SUPABASE_PREVIEW_URL npx prisma migrate deploy

# 2. Validar app roda contra o novo schema
# 3. Em produção:
DATABASE_URL=$SUPABASE_PROD_URL npx prisma migrate deploy
```

## RLS policies

`prisma/rls.sql` precisa ser aplicado manualmente no Supabase (SQL editor) após cada migration que adiciona tabela com `familyId`. Prisma não gerencia RLS.

## Logs

- **Vercel**: runtime logs por deployment no dashboard
- **Sentry**: exceções + performance
- **Supabase**: logs do Postgres e Auth no dashboard
- **Clerk**: logs de auth no dashboard Clerk

## Contatos de plantão

| Serviço | Dashboard | Canal |
|---|---|---|
| Vercel | vercel.com/jera-capital | `#eng-infra` |
| Supabase | supabase.com/dashboard | `#eng-infra` |
| Sentry | sentry.io/jera-capital | `#horizonte-alerts` |
| Clerk | dashboard.clerk.com | `#eng-infra` |
