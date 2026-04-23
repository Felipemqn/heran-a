import { describe, it, expect } from 'vitest'
import { fmtMoney, fmtPct, fmtDelta } from './format'

describe('fmtMoney', () => {
  it('formats BRL', () => {
    expect(fmtMoney(100_000_000)).toMatch(/R\$\s?100\.000\.000/)
  })
  it('compacts millions', () => {
    expect(fmtMoney(42_500_000, { compact: true })).toBe('R$ 42.5M')
  })
  it('compacts billions', () => {
    expect(fmtMoney(1_200_000_000, { compact: true })).toBe('R$ 1.2B')
  })
})

describe('fmtPct', () => {
  it('uses comma decimal', () => {
    expect(fmtPct(5.2)).toBe('5,2%')
  })
})

describe('fmtDelta', () => {
  it('adds positive sign', () => {
    expect(fmtDelta(3.1)).toBe('+3,1%')
  })
  it('keeps negative sign', () => {
    expect(fmtDelta(-2.4)).toBe('-2,4%')
  })
})
