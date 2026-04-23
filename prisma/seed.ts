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

  await prisma.member.createMany({
    skipDuplicates: true,
    data: [
      {
        familyId: family.id,
        name: 'Roberto Silva',
        role: 'founder',
        generation: 'founder',
        birthDate: new Date('1955-03-12'),
        email: 'roberto@familiasilva.example',
      },
      {
        familyId: family.id,
        name: 'Marina Silva',
        role: 'founder',
        generation: 'founder',
        birthDate: new Date('1958-08-04'),
        email: 'marina@familiasilva.example',
      },
      {
        familyId: family.id,
        name: 'Pedro Silva',
        role: 'heir',
        generation: 'heir',
        birthDate: new Date('1985-01-22'),
      },
      {
        familyId: family.id,
        name: 'Ana Silva',
        role: 'heir',
        generation: 'heir',
        birthDate: new Date('1988-06-17'),
      },
      {
        familyId: family.id,
        name: 'Lucas Silva',
        role: 'observer',
        generation: 'grandheir',
        birthDate: new Date('2015-11-02'),
      },
    ],
  })

  const allocations: Array<{ class: 'fixed_income' | 'equities' | 'real_estate' | 'alternatives' | 'cash'; pct: number; value: number }> = [
    { class: 'fixed_income', pct: 42, value: 42_000_000 },
    { class: 'equities', pct: 28, value: 28_000_000 },
    { class: 'real_estate', pct: 18, value: 18_000_000 },
    { class: 'alternatives', pct: 10, value: 10_000_000 },
    { class: 'cash', pct: 2, value: 2_000_000 },
  ]

  const today = new Date()
  for (const a of allocations) {
    await prisma.allocation.create({
      data: {
        familyId: family.id,
        class: a.class,
        percentage: a.pct,
        valueBrl: a.value,
        snapshotDate: today,
      },
    })
  }

  await prisma.asset.createMany({
    skipDuplicates: true,
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

  const baseYear = new Date().getFullYear() - 5
  for (let i = 0; i < 6; i++) {
    const year = baseYear + i
    const growth = 80_000_000 * Math.pow(1.05, i)
    await prisma.historicalValue.create({
      data: {
        familyId: family.id,
        valueBrl: Math.round(growth),
        recordedAt: new Date(year, 11, 31),
      },
    })
  }

  await prisma.iPSVersion.create({
    data: {
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
