import { describe, it, expect } from 'vitest'
import { computeProjection } from './allocation-tools'

describe('computeProjection', () => {
  const balanced = {
    fixed_income: 40,
    equities: 30,
    real_estate: 20,
    alternatives: 8,
    cash: 2,
  }

  it('preserva principal quando years=0 caso a caso é irrelevante — verifica 1 ano', () => {
    const r = computeProjection(1_000_000, balanced, 1)
    expect(r.finalBrl).toBeGreaterThan(1_000_000)
    expect(r.byYear).toHaveLength(1)
  })

  it('retorno ponderado cresce composto', () => {
    const r = computeProjection(100_000_000, balanced, 10)
    // 0.4*0.095 + 0.3*0.12 + 0.2*0.08 + 0.08*0.11 + 0.02*0.09 = 0.1006
    expect(r.expectedAnnualReturn).toBeCloseTo(0.1006, 3)
    expect(r.finalBrl).toBeGreaterThan(100_000_000 * Math.pow(1.095, 10) * 0.9)
  })

  it('mantém array byYear com N entradas', () => {
    const r = computeProjection(10_000_000, balanced, 20)
    expect(r.byYear).toHaveLength(20)
    expect(r.byYear[0].year).toBe(1)
    expect(r.byYear[19].year).toBe(20)
  })

  it('growthMultiple = 0 quando inicial = 0', () => {
    const r = computeProjection(0, balanced, 5)
    expect(r.growthMultiple).toBe(0)
    expect(r.finalBrl).toBe(0)
  })

  it('alocação 100% caixa usa apenas taxa de caixa', () => {
    const allCash = { fixed_income: 0, equities: 0, real_estate: 0, alternatives: 0, cash: 100 }
    const r = computeProjection(1_000_000, allCash, 1)
    expect(r.expectedAnnualReturn).toBeCloseTo(0.09, 3)
  })
})
