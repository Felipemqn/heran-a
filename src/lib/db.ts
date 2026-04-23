// Singleton do Prisma Client. Requer `npm run db:generate` (prisma generate).
// Enquanto o generate nao roda (ex: OneDrive bloqueando o binario schema-engine),
// os tipos ficam como `any`. Depois de gerar, tipos reais assumem automaticamente.

// eslint-disable-next-line @typescript-eslint/no-require-imports
const prismaModule = require('@prisma/client') as {
  PrismaClient: new () => unknown
}

type PrismaClientLike = Record<string, any>

declare global {
  var prismaGlobal: PrismaClientLike | undefined
}

export const db: PrismaClientLike =
  globalThis.prismaGlobal ?? (new prismaModule.PrismaClient() as PrismaClientLike)

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = db
}
