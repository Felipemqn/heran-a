// Seed script. Requer `npm run db:generate` antes de rodar em ambiente real.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require('@prisma/client') as {
  PrismaClient: new () => any
}

const prisma: any = new PrismaClient()

async function main() {
  console.log('Seeding Familia Silva...')

  const family = await prisma.family.upsert({
    where: { slug: 'familia-silva' },
    update: {},
    create: {
      name: 'Familia Silva',
      slug: 'familia-silva',
    },
  })

  // Members idempotentes: identificados por (familyId, name).
  const members = [
    { name: 'Roberto Silva', role: 'founder', generation: 'founder', birthDate: new Date('1955-03-12'), email: 'roberto@familiasilva.example' },
    { name: 'Marina Silva', role: 'founder', generation: 'founder', birthDate: new Date('1958-08-04'), email: 'marina@familiasilva.example' },
    { name: 'Pedro Silva', role: 'heir', generation: 'heir', birthDate: new Date('1985-01-22'), email: null },
    { name: 'Ana Silva', role: 'heir', generation: 'heir', birthDate: new Date('1988-06-17'), email: null },
    { name: 'Lucas Silva', role: 'observer', generation: 'grandheir', birthDate: new Date('2015-11-02'), email: null },
  ]
  for (const m of members) {
    const existing = await prisma.member.findFirst({
      where: { familyId: family.id, name: m.name },
    })
    if (!existing) {
      await prisma.member.create({ data: { ...m, familyId: family.id } })
    }
  }

  const allocations: Array<{ class: 'fixed_income' | 'equities' | 'real_estate' | 'alternatives' | 'cash'; pct: number; value: number }> = [
    { class: 'fixed_income', pct: 42, value: 42_000_000 },
    { class: 'equities', pct: 28, value: 28_000_000 },
    { class: 'real_estate', pct: 18, value: 18_000_000 },
    { class: 'alternatives', pct: 10, value: 10_000_000 },
    { class: 'cash', pct: 2, value: 2_000_000 },
  ]

  // Snapshot do dia: remove allocations de hoje antes de inserir.
  const today = new Date()
  const startOfDay = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()))
  await prisma.allocation.deleteMany({
    where: { familyId: family.id, snapshotDate: { gte: startOfDay } },
  })
  for (const a of allocations) {
    await prisma.allocation.create({
      data: {
        familyId: family.id,
        class: a.class,
        percentage: a.pct,
        valueBrl: a.value,
        snapshotDate: startOfDay,
      },
    })
  }

  // Assets idempotentes: limpa e recria (seed fixture, nao user data).
  await prisma.asset.deleteMany({ where: { familyId: family.id } })
  await prisma.asset.createMany({
    data: [
      { familyId: family.id, name: 'Tesouro IPCA+ 2035', class: 'fixed_income', subclass: 'government_bonds', liquidity: 'medium_term', valueBrl: 22_000_000, institution: 'Tesouro Direto' },
      { familyId: family.id, name: 'Carteira CDBs high-grade', class: 'fixed_income', subclass: 'corporate_bonds', liquidity: 'short_term', valueBrl: 20_000_000 },
      { familyId: family.id, name: 'Portfolio acoes Brasil', class: 'equities', subclass: 'stocks_brazil', liquidity: 'immediate', valueBrl: 18_000_000 },
      { familyId: family.id, name: 'Fundo global diversificado', class: 'equities', subclass: 'stocks_global', liquidity: 'short_term', valueBrl: 10_000_000, currency: 'USD' },
      { familyId: family.id, name: 'Imovel comercial Paulista', class: 'real_estate', subclass: 'direct_real_estate', liquidity: 'illiquid', valueBrl: 12_000_000 },
      { familyId: family.id, name: 'FIIs diversificados', class: 'real_estate', subclass: 'real_estate_funds', liquidity: 'immediate', valueBrl: 6_000_000 },
      { familyId: family.id, name: 'Private equity BR', class: 'alternatives', subclass: 'private_equity', liquidity: 'long_term', valueBrl: 10_000_000 },
      { familyId: family.id, name: 'Caixa operacional', class: 'cash', subclass: 'cash_brl', liquidity: 'immediate', valueBrl: 2_000_000 },
    ],
  })

  // Historico idempotente: limpa antes de recriar.
  await prisma.historicalValue.deleteMany({ where: { familyId: family.id } })
  const baseYear = new Date().getUTCFullYear() - 5
  for (let i = 0; i < 6; i++) {
    const year = baseYear + i
    const growth = 80_000_000 * Math.pow(1.05, i)
    await prisma.historicalValue.create({
      data: {
        familyId: family.id,
        valueBrl: Math.round(growth),
        recordedAt: new Date(Date.UTC(year, 11, 31)),
      },
    })
  }

  // IPS v1 via upsert no par unico (familyId, version).
  await prisma.ipsVersion.upsert({
    where: { familyId_version: { familyId: family.id, version: 1 } },
    update: {},
    create: {
      familyId: family.id,
      version: 1,
      horizon: 'generational',
      riskTolerance: 'balanced',
      minLiquidityMonths: 18,
      restrictions: 'Sem exposicao a tabaco, armas ou jogos de azar.',
      reviewCadence: 'semestral',
      targetAllocation: {
        fixed_income: 40,
        equities: 30,
        real_estate: 20,
        alternatives: 8,
        cash: 2,
      },
    },
  })

  console.log('Seed concluido.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
