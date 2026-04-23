import assetClassesJson from '../../../prisma/fixtures/asset-classes.json'
import profilesJson from '../../../prisma/fixtures/profiles.json'
import historicalReturnsJson from '../../../prisma/fixtures/historical-returns.json'

export type BucketId =
  | 'br_cash_fi'
  | 'br_equities'
  | 'br_alts'
  | 'br_re'
  | 'int_cash_fi'
  | 'int_equities'
  | 'int_alts'
  | 'int_re'

export const BUCKET_IDS: readonly BucketId[] = [
  'br_cash_fi',
  'br_equities',
  'br_alts',
  'br_re',
  'int_cash_fi',
  'int_equities',
  'int_alts',
  'int_re',
] as const

export interface AssetClass {
  id: BucketId
  label: string
  region: 'brasil' | 'internacional'
  category: 'cash_fi' | 'equities' | 'alternatives' | 'real_estate'
  constituents: string[]
}

export interface Profile {
  id: string
  region: string
  level: string
  weights: Record<BucketId, number>
  total: number
}

export interface HistoricalPoint {
  date: string
  returns: Record<BucketId, number>
}

// JSON imports sao tipados literalmente pelo TS (strings em vez de literais).
// Cast via `unknown` e a unica maneira segura de forcar os tipos corretos.
export const assetClasses = assetClassesJson as unknown as AssetClass[]
export const profiles = profilesJson as unknown as Profile[]
export const historicalReturns = historicalReturnsJson as unknown as HistoricalPoint[]

export function getProfile(id: string): Profile | undefined {
  return profiles.find((p) => p.id === id)
}

export function getBucket(id: BucketId): AssetClass | undefined {
  return assetClasses.find((b) => b.id === id)
}
