import { describe, it, expect } from 'vitest'
import {
  mean,
  stdDev,
  covariance,
  annualizeReturn,
  annualizeVol,
  computeBucketStats,
  covarianceMatrix,
  correlationMatrix,
  portfolioStats,
  cholesky,
} from './statistics'
import { BUCKET_IDS, profiles } from './data'

describe('statistics primitives', () => {
  it('mean de sequencia', () => {
    expect(mean([1, 2, 3, 4, 5])).toBe(3)
  })
  it('stdDev population', () => {
    // var = ((1-3)^2+(2-3)^2+(3-3)^2+(4-3)^2+(5-3)^2)/5 = 2
    expect(stdDev([1, 2, 3, 4, 5])).toBeCloseTo(Math.sqrt(2), 6)
  })
  it('covariance(x,x) = variance', () => {
    const xs = [1, 2, 3, 4, 5]
    expect(covariance(xs, xs)).toBeCloseTo(stdDev(xs) ** 2, 6)
  })
  it('anualizacao de retorno composto', () => {
    expect(annualizeReturn(0.01)).toBeCloseTo(Math.pow(1.01, 12) - 1, 6)
  })
  it('anualizacao de vol: sqrt(12)', () => {
    expect(annualizeVol(0.01)).toBeCloseTo(0.01 * Math.sqrt(12), 6)
  })
})

describe('bucket stats (dados reais)', () => {
  it('cada bucket tem 170 meses observados', () => {
    for (const b of BUCKET_IDS) {
      expect(computeBucketStats(b).monthsObserved).toBe(170)
    }
  })
  it('br_equities tem mean e vol plausiveis', () => {
    const s = computeBucketStats('br_equities')
    // Historico 2012-2026 de RV BR: retorno anual moderado, vol alta
    expect(s.meanAnnual).toBeGreaterThan(-0.2)
    expect(s.meanAnnual).toBeLessThan(0.5)
    expect(s.stdAnnual).toBeGreaterThan(0.1)
    expect(s.stdAnnual).toBeLessThan(0.5)
  })
  it('cash_fi tem vol menor que equities', () => {
    const cash = computeBucketStats('br_cash_fi')
    const eq = computeBucketStats('br_equities')
    expect(cash.stdAnnual).toBeLessThan(eq.stdAnnual)
  })
})

describe('covariance matrix', () => {
  it('eh 8x8 simetrica', () => {
    const cov = covarianceMatrix()
    expect(cov.buckets).toHaveLength(8)
    expect(cov.matrix).toHaveLength(8)
    for (let i = 0; i < 8; i++) {
      expect(cov.matrix[i]).toHaveLength(8)
      for (let j = 0; j < 8; j++) {
        expect(cov.matrix[i][j]).toBeCloseTo(cov.matrix[j][i], 10)
      }
    }
  })
  it('diagonal = variancia, positiva', () => {
    const cov = covarianceMatrix()
    for (let i = 0; i < 8; i++) {
      expect(cov.matrix[i][i]).toBeGreaterThan(0)
    }
  })
})

describe('correlation matrix', () => {
  it('diagonal = 1', () => {
    const corr = correlationMatrix()
    for (let i = 0; i < 8; i++) {
      expect(corr.matrix[i][i]).toBeCloseTo(1, 6)
    }
  })
  it('valores em [-1, 1]', () => {
    const corr = correlationMatrix()
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        expect(corr.matrix[i][j]).toBeGreaterThanOrEqual(-1.001)
        expect(corr.matrix[i][j]).toBeLessThanOrEqual(1.001)
      }
    }
  })
})

describe('portfolio stats', () => {
  it('perfil br_intl_moderado tem retorno e vol positivos', () => {
    const p = profiles.find((x) => x.id === 'br_intl_moderado')!
    const stats = portfolioStats(p.weights)
    expect(stats.expectedAnnualReturn).toBeGreaterThan(0)
    expect(stats.annualVol).toBeGreaterThan(0)
    expect(stats.sharpe).toBeGreaterThan(0)
  })
  it('internacional: agressivo > moderado > suavizado em vol', () => {
    const sua = profiles.find((x) => x.id === 'internacional_suavizado')!
    const mod = profiles.find((x) => x.id === 'internacional_moderado')!
    const agg = profiles.find((x) => x.id === 'internacional_agressivo')!
    const vSua = portfolioStats(sua.weights).annualVol
    const vMod = portfolioStats(mod.weights).annualVol
    const vAgg = portfolioStats(agg.weights).annualVol
    expect(vMod).toBeGreaterThan(vSua)
    expect(vAgg).toBeGreaterThan(vMod)
  })
  it('br_intl_agressivo tem retorno esperado positivo e coerente', () => {
    const p = profiles.find((x) => x.id === 'br_intl_agressivo')!
    const s = portfolioStats(p.weights)
    // Historico 2012-2026 mixto Br+Intl agressivo: retorno anual tipicamente 5-10%
    expect(s.expectedAnnualReturn).toBeGreaterThan(0.03)
    expect(s.expectedAnnualReturn).toBeLessThan(0.15)
  })
})

describe('cholesky', () => {
  it('L * L^T = matriz original (identidade simples)', () => {
    const id3 = [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ]
    const L = cholesky(id3)
    expect(L[0][0]).toBeCloseTo(1, 6)
    expect(L[1][1]).toBeCloseTo(1, 6)
    expect(L[2][2]).toBeCloseTo(1, 6)
  })
  it('decomposicao de matriz 2x2 conhecida', () => {
    // [[4,2],[2,3]] -> L = [[2,0],[1,sqrt(2)]]
    const L = cholesky([
      [4, 2],
      [2, 3],
    ])
    expect(L[0][0]).toBeCloseTo(2, 6)
    expect(L[1][0]).toBeCloseTo(1, 6)
    expect(L[1][1]).toBeCloseTo(Math.sqrt(2), 6)
  })
  it('aplicado a matriz de covariancia real, gera L triangular', () => {
    const cov = covarianceMatrix()
    const L = cholesky(cov.matrix)
    // Triangular inferior: L[i][j] = 0 para j > i
    for (let i = 0; i < 8; i++) {
      for (let j = i + 1; j < 8; j++) {
        expect(L[i][j]).toBe(0)
      }
    }
  })
})
