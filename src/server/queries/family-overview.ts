import type { AllocationSnapshot, HistoricalPoint, Family, Member } from '@/types/domain'

export interface FamilyOverview {
  family: Pick<Family, 'id' | 'name'>
  totalBrl: number
  ytdDelta: number
  heirsCount: number
  liquidBrl: number
  allocations: AllocationSnapshot[]
  historical: HistoricalPoint[]
  members: Pick<Member, 'id' | 'name' | 'role' | 'generation'>[]
}

// Fallback/mock para dev sem banco. Substituir por query real a partir da Sessao 1.
export function getMockOverview(): FamilyOverview {
  const historical: HistoricalPoint[] = Array.from({ length: 6 }).map((_, i) => ({
    recordedAt: new Date(2020 + i, 11, 31),
    valueBrl: Math.round(80_000_000 * Math.pow(1.05, i)),
  }))

  return {
    family: { id: 'silva', name: 'Familia Silva' },
    totalBrl: 100_000_000,
    ytdDelta: 5.2,
    heirsCount: 3,
    liquidBrl: 26_000_000,
    allocations: [
      { class: 'fixed_income', percentage: 42, valueBrl: 42_000_000, snapshotDate: new Date() },
      { class: 'equities', percentage: 28, valueBrl: 28_000_000, snapshotDate: new Date() },
      { class: 'real_estate', percentage: 18, valueBrl: 18_000_000, snapshotDate: new Date() },
      { class: 'alternatives', percentage: 10, valueBrl: 10_000_000, snapshotDate: new Date() },
      { class: 'cash', percentage: 2, valueBrl: 2_000_000, snapshotDate: new Date() },
    ],
    historical,
    members: [
      { id: '1', name: 'Roberto Silva', role: 'founder', generation: 'founder' },
      { id: '2', name: 'Marina Silva', role: 'founder', generation: 'founder' },
      { id: '3', name: 'Pedro Silva', role: 'heir', generation: 'heir' },
      { id: '4', name: 'Ana Silva', role: 'heir', generation: 'heir' },
      { id: '5', name: 'Lucas Silva', role: 'observer', generation: 'grandheir' },
    ],
  }
}
