import type Anthropic from '@anthropic-ai/sdk'
import { db } from '@/lib/db'
import { assetClassLabel, type AssetClass } from '@/types/domain'

// Tool schemas expostos ao modelo.
// input_schema tem `additionalProperties: false` para evitar campos livres.

export const allocationTools: Anthropic.Messages.Tool[] = [
  {
    name: 'getCurrentAllocation',
    description:
      'Retorna a alocação patrimonial atual da família por classe de ativo ' +
      '(renda fixa, renda variável, imóveis, alternativos, caixa). ' +
      'Use quando o usuário perguntar sobre composição, distribuição ou alocação atual.',
    input_schema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: 'projectWealth',
    description:
      'Projeta o patrimônio total daqui N anos, aplicando retorno esperado ' +
      'ponderado pela alocação informada. Use para perguntas de projeção ' +
      'como "quanto terei em 10 anos" ou "quanto meu patrimônio cresce com essa alocação".',
    input_schema: {
      type: 'object',
      properties: {
        allocation: {
          type: 'object',
          description:
            'Percentuais (0-100) por classe. A soma deve totalizar 100. ' +
            'Se o usuário não especificar, chame getCurrentAllocation primeiro.',
          properties: {
            fixed_income: { type: 'number', minimum: 0, maximum: 100 },
            equities: { type: 'number', minimum: 0, maximum: 100 },
            real_estate: { type: 'number', minimum: 0, maximum: 100 },
            alternatives: { type: 'number', minimum: 0, maximum: 100 },
            cash: { type: 'number', minimum: 0, maximum: 100 },
          },
          required: ['fixed_income', 'equities', 'real_estate', 'alternatives', 'cash'],
          additionalProperties: false,
        },
        years: {
          type: 'integer',
          minimum: 1,
          maximum: 50,
          description: 'Horizonte de projeção em anos (1 a 50).',
        },
      },
      required: ['allocation', 'years'],
      additionalProperties: false,
    },
  },
]

// Retornos esperados anuais baseline (ponto de partida; calibrar via research).
const expectedReturnByClass: Record<AssetClass, number> = {
  fixed_income: 0.095,
  equities: 0.12,
  real_estate: 0.08,
  alternatives: 0.11,
  cash: 0.09,
}

export type ToolName = 'getCurrentAllocation' | 'projectWealth'

export async function runAllocationTool(
  name: string,
  input: Record<string, unknown>,
  familyId: string
): Promise<string> {
  switch (name) {
    case 'getCurrentAllocation':
      return JSON.stringify(await getCurrentAllocation(familyId))
    case 'projectWealth':
      return JSON.stringify(
        await projectWealth(
          familyId,
          input.allocation as Record<AssetClass, number>,
          input.years as number
        )
      )
    default:
      return JSON.stringify({ error: `tool desconhecida: ${name}` })
  }
}

async function getCurrentAllocation(familyId: string) {
  const snapshots = await db.allocation.findMany({
    where: { familyId },
    orderBy: { snapshotDate: 'desc' },
    take: 5,
  })
  const latestDate = snapshots[0]?.snapshotDate
  if (!latestDate) {
    return { error: 'Sem snapshot de alocação para esta família' }
  }
  const latest = snapshots.filter(
    (s) => s.snapshotDate.getTime() === latestDate.getTime()
  )
  const totalValue = latest.reduce((sum, s) => sum + Number(s.valueBrl), 0)
  return {
    snapshotDate: latestDate.toISOString(),
    totalBrl: totalValue,
    items: latest.map((s) => ({
      class: s.class,
      label: assetClassLabel[s.class as AssetClass],
      percentage: Number(s.percentage),
      valueBrl: Number(s.valueBrl),
    })),
  }
}

export interface ProjectionResult {
  initialBrl: number
  years: number
  expectedAnnualReturn: number
  finalBrl: number
  growthMultiple: number
  byYear: Array<{ year: number; valueBrl: number }>
}

async function projectWealth(
  familyId: string,
  allocation: Record<AssetClass, number>,
  years: number
): Promise<ProjectionResult | { error: string }> {
  const total = Object.values(allocation).reduce((a, b) => a + b, 0)
  if (Math.abs(total - 100) > 0.5) {
    return { error: `Alocação soma ${total}%, esperado 100%` }
  }

  const snapshots = await db.allocation.findMany({
    where: { familyId },
    orderBy: { snapshotDate: 'desc' },
    take: 5,
  })
  const latestDate = snapshots[0]?.snapshotDate
  const initialBrl = latestDate
    ? snapshots
        .filter((s) => s.snapshotDate.getTime() === latestDate.getTime())
        .reduce((sum, s) => sum + Number(s.valueBrl), 0)
    : 0

  return computeProjection(initialBrl, allocation, years)
}

export function computeProjection(
  initialBrl: number,
  allocation: Record<AssetClass, number>,
  years: number
): ProjectionResult {
  const weightedReturn = Object.entries(allocation).reduce((acc, [klass, pct]) => {
    const rate = expectedReturnByClass[klass as AssetClass] ?? 0
    return acc + (pct / 100) * rate
  }, 0)

  const byYear: Array<{ year: number; valueBrl: number }> = []
  let current = initialBrl
  for (let y = 1; y <= years; y++) {
    current = current * (1 + weightedReturn)
    byYear.push({ year: y, valueBrl: Math.round(current) })
  }

  return {
    initialBrl,
    years,
    expectedAnnualReturn: weightedReturn,
    finalBrl: Math.round(current),
    growthMultiple: initialBrl > 0 ? current / initialBrl : 0,
    byYear,
  }
}
