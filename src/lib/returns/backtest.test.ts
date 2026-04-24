import { describe, it, expect } from 'vitest'
import { backtest, __internals } from './backtest'
import { profiles, type BucketId } from './data'

const { worstRolling } = __internals

describe('worstRolling', () => {
  it('retorna null se serie menor que janela', () => {
    expect(worstRolling([0.01, 0.02], 12)).toBeNull()
  })
  it('janela=1 em [0.1, -0.2, 0.05] -> -0.2', () => {
    expect(worstRolling([0.1, -0.2, 0.05], 1)).toBeCloseTo(-0.2, 6)
  })
  it('janela=2 composta escolhe pior par: [(-0.2),(0.05)] -> 0.84-1 = -0.16', () => {
    const w = worstRolling([0.1, -0.2, 0.05], 2)
    // Pares: (1.1)(0.8)-1 = -0.12 ; (0.8)(1.05)-1 = -0.16
    // Pior = -0.16
    expect(w).toBeCloseTo(0.84 - 1, 6)
  })
})

describe('backtest', () => {
  const moderado = profiles.find((p) => p.id === 'br_intl_moderado')!

  it('equity curve tem month+1 pontos (inclui inicial)', () => {
    const r = backtest(moderado.weights as Record<BucketId, number>, 100_000_000)
    expect(r.equityCurve.length).toBe(r.months + 1)
    expect(r.equityCurve[0].value).toBe(100_000_000)
  })

  it('max drawdown e negativo e consistente', () => {
    const r = backtest(moderado.weights as Record<BucketId, number>, 100_000_000)
    expect(r.maxDrawdown).toBeLessThanOrEqual(0)
    expect(r.maxDrawdown).toBeGreaterThan(-1)
  })

  it('agressivo tem maxDD maior (pior) que suavizado em internacional', () => {
    const sua = profiles.find((p) => p.id === 'internacional_suavizado')!
    const agg = profiles.find((p) => p.id === 'internacional_agressivo')!
    const rS = backtest(sua.weights as Record<BucketId, number>, 1)
    const rA = backtest(agg.weights as Record<BucketId, number>, 1)
    expect(rA.maxDrawdown).toBeLessThan(rS.maxDrawdown)
  })

  it('cagr do moderado positivo e menor que 1 (razoavel)', () => {
    const r = backtest(moderado.weights as Record<BucketId, number>, 1)
    expect(r.cagr).toBeGreaterThan(0)
    expect(r.cagr).toBeLessThan(1)
  })

  it('worst rolling windows presentes e ordenados por severidade', () => {
    const r = backtest(moderado.weights as Record<BucketId, number>, 1)
    // Worst 12m e total (magnitude ~ de unica crise tipo COVID)
    expect(r.worstRolling12m).toBeLessThan(0)
    // Janelas maiores anualizadas tendem a ser MENOS severas em magnitude
    // (diluicao da crise entre anos com recuperacao).
    expect(r.worstRolling36mAnnualized).toBeGreaterThan(r.worstRolling12m)
    expect(r.worstRolling60mAnnualized).toBeGreaterThan(
      r.worstRolling36mAnnualized - 0.01
    )
  })
})
