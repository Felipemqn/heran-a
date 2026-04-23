// Tipos de dominio do Jera Horizonte.
// Espelham os enums de prisma/schema.prisma. Quando o migration rodar,
// substituir por `import type { ... } from '@prisma/client'`.

export type GenerationTier = 'founder' | 'heir' | 'grandheir'

export type MemberRole = 'founder' | 'heir' | 'observer' | 'advisor'

export type AssetClass =
  | 'fixed_income'
  | 'equities'
  | 'real_estate'
  | 'alternatives'
  | 'cash'

export type AssetSubclass =
  | 'government_bonds'
  | 'corporate_bonds'
  | 'stocks_brazil'
  | 'stocks_global'
  | 'real_estate_funds'
  | 'direct_real_estate'
  | 'private_equity'
  | 'hedge_funds'
  | 'commodities'
  | 'cash_brl'
  | 'cash_usd'

export type DecisionStatus = 'pending_review' | 'approved' | 'rejected' | 'archived'

export type Liquidity = 'immediate' | 'short_term' | 'medium_term' | 'long_term' | 'illiquid'

export type ScenarioKind = 'deterministic' | 'monte_carlo'

export type InvestmentHorizon = 'short' | 'medium' | 'long' | 'generational'

export type RiskTolerance = 'conservative' | 'moderate' | 'balanced' | 'growth' | 'aggressive'

export const assetClassLabel: Record<AssetClass, string> = {
  fixed_income: 'Renda Fixa',
  equities: 'Renda Variavel',
  real_estate: 'Imoveis',
  alternatives: 'Alternativos',
  cash: 'Caixa',
}

export const roleLabel: Record<MemberRole, string> = {
  founder: 'Fundador',
  heir: 'Herdeiro',
  observer: 'Observador',
  advisor: 'Consultor',
}

export const generationLabel: Record<GenerationTier, string> = {
  founder: 'Fundadores',
  heir: 'Herdeiros',
  grandheir: 'Netos',
}

export interface Family {
  id: string
  name: string
  slug: string
  createdAt: Date
  updatedAt: Date
}

export interface Member {
  id: string
  familyId: string
  name: string
  role: MemberRole
  generation: GenerationTier
  birthDate: Date | null
  email: string | null
  clerkUserId: string | null
}

export interface AllocationSnapshot {
  class: AssetClass
  percentage: number
  valueBrl: number
  snapshotDate: Date
}

export interface HistoricalPoint {
  recordedAt: Date
  valueBrl: number
}
