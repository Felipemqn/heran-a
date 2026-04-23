// Tipos de domínio derivados do schema Prisma + enums de negócio.
// Expandir na Sessão 1 (schema de dados).

export type GenerationTier = 'founder' | 'heir' | 'grandheir'

export type MemberRole = 'founder' | 'heir' | 'observer' | 'advisor'

export type AssetClass = 'fixed_income' | 'equities' | 'real_estate' | 'alternatives'

export type DecisionStatus = 'pending_review' | 'approved' | 'rejected' | 'archived'

export interface Family {
  id: string
  name: string
  createdAt: Date
  updatedAt: Date
}

export interface Member {
  id: string
  familyId: string
  name: string
  role: MemberRole
  generation: GenerationTier
  clerkUserId: string | null
  createdAt: Date
  updatedAt: Date
}
