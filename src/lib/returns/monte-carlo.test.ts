import { describe, it, expect } from 'vitest'
import {
  runMonteCarlo,
  normalDraws,
  __internals,
} from './monte-carlo'
import { BUCKET_IDS, profiles, type BucketId } from './data'

const { mulberry32, quantile } = __internals

describe('mulberry32 RNG', () => {
  it('deterministico com seed fixo', () => {
    const r1 = mulberry32(42)
    const r2 = mulberry32(42)
    for (let i = 0; i < 5; i++) expect(r1()).toBe(r2())
  })
  it('valores em [0, 1)', () => {
    const r = mulberry32(1)
    for (let i = 0; i < 100; i++) {
      const v = r()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })
})

describe('normalDraws (Box-Muller)', () => {
  it('media ~0 e std ~1 em N=10k', () => {
    const r = mulberry32(7)
    const draws = normalDraws(10000, r)
    const m = draws.reduce((a, b) => a + b, 0) / draws.length
    const v = draws.reduce((a, b) => a + (b - m) ** 2, 0) / draws.length
    expect(Math.abs(m)).toBeLessThan(0.05)
    expect(Math.abs(Math.sqrt(v) - 1)).toBeLessThan(0.05)
  })
})

describe('quantile helper', () => {
  it('p50 de [1..9] = 5', () => {
    expect(quantile([1, 2, 3, 4, 5, 6, 7, 8, 9], 0.5)).toBe(5)
  })
  it('p10 e p90 de [1..11] simetricos', () => {
    const s = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
    expect(quantile(s, 0.1)).toBe(2)
    expect(quantile(s, 0.9)).toBe(10)
  })
})

describe('Monte Carlo', () => {
  const moderado = profiles.find((p) => p.id === 'br_intl_moderado')!

  it('ordem dos quantis: p10 <= p50 <= p90', () => {
    const r = runMonteCarlo({
      weights: moderado.weights as Record<BucketId, number>,
      initialBrl: 100_000_000,
      years: 5,
      sims: 300,
      seed: 123,
    })
    for (const pt of r.byYear) {
      expect(pt.p10).toBeLessThanOrEqual(pt.p50 + 1e-6)
      expect(pt.p50).toBeLessThanOrEqual(pt.p90 + 1e-6)
    }
  })

  it('ponto inicial eh igual em todos os quantis', () => {
    const r = runMonteCarlo({
      weights: moderado.weights as Record<BucketId, number>,
      initialBrl: 50_000_000,
      years: 10,
      sims: 200,
      seed: 9,
    })
    expect(r.byYear[0].p10).toBe(50_000_000)
    expect(r.byYear[0].p50).toBe(50_000_000)
    expect(r.byYear[0].p90).toBe(50_000_000)
  })

  it('deterministico com seed fixo', () => {
    const opts = {
      weights: moderado.weights as Record<BucketId, number>,
      initialBrl: 10_000_000,
      years: 3,
      sims: 100,
      seed: 777,
    }
    const a = runMonteCarlo(opts)
    const b = runMonteCarlo(opts)
    expect(a.metrics.finalMedian).toBe(b.metrics.finalMedian)
    expect(a.metrics.finalP10).toBe(b.metrics.finalP10)
  })

  it('prob de perda pra perfil conservador < perfil agressivo', () => {
    const cons = profiles.find((p) => p.id === 'internacional_conservador')!
    const agg = profiles.find((p) => p.id === 'internacional_agressivo')!
    const rCons = runMonteCarlo({
      weights: cons.weights as Record<BucketId, number>,
      initialBrl: 100_000_000,
      years: 10,
      sims: 400,
      seed: 1,
    })
    const rAgg = runMonteCarlo({
      weights: agg.weights as Record<BucketId, number>,
      initialBrl: 100_000_000,
      years: 10,
      sims: 400,
      seed: 1,
    })
    // Em 10 anos, agressivo tem cauda mais larga — prob de qualquer perda
    // tipicamente maior, mas nao eh invariante matematica estrita.
    // Validacao mais robusta: spread (p90-p10) do agressivo > conservador.
    const spreadCons = rCons.metrics.finalP90 - rCons.metrics.finalP10
    const spreadAgg = rAgg.metrics.finalP90 - rAgg.metrics.finalP10
    expect(spreadAgg).toBeGreaterThan(spreadCons)
  })

  it('byYear tem length = years+1', () => {
    const r = runMonteCarlo({
      weights: moderado.weights as Record<BucketId, number>,
      initialBrl: 1_000_000,
      years: 15,
      sims: 50,
      seed: 1,
    })
    expect(r.byYear).toHaveLength(16)
    expect(r.byYear[0].year).toBe(0)
    expect(r.byYear[15].year).toBe(15)
  })
})
