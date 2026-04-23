import { BUCKET_IDS, type BucketId, historicalReturns } from './data'

export interface BucketStats {
  bucket: BucketId
  monthsObserved: number
  meanMonthly: number
  stdMonthly: number
  meanAnnual: number
  stdAnnual: number
  sharpeAnnualVsZero: number
}

export interface Covariance {
  buckets: BucketId[]
  matrix: number[][]
}

export function mean(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((a, b) => a + b, 0) / values.length
}

export function stdDev(values: number[], avg?: number): number {
  if (values.length === 0) return 0
  const m = avg ?? mean(values)
  const sumSq = values.reduce((s, v) => s + (v - m) ** 2, 0)
  return Math.sqrt(sumSq / values.length)
}

export function covariance(xs: number[], ys: number[]): number {
  if (xs.length !== ys.length || xs.length === 0) return 0
  const mx = mean(xs)
  const my = mean(ys)
  let sum = 0
  for (let i = 0; i < xs.length; i++) sum += (xs[i] - mx) * (ys[i] - my)
  return sum / xs.length
}

export function annualizeReturn(monthly: number): number {
  return Math.pow(1 + monthly, 12) - 1
}

export function annualizeVol(monthly: number): number {
  return monthly * Math.sqrt(12)
}

export function bucketSeries(id: BucketId): number[] {
  return historicalReturns
    .map((p) => p.returns[id])
    .filter((v): v is number => typeof v === 'number')
}

export function computeBucketStats(id: BucketId): BucketStats {
  const series = bucketSeries(id)
  const m = mean(series)
  const sd = stdDev(series, m)
  const meanA = annualizeReturn(m)
  const stdA = annualizeVol(sd)
  return {
    bucket: id,
    monthsObserved: series.length,
    meanMonthly: m,
    stdMonthly: sd,
    meanAnnual: meanA,
    stdAnnual: stdA,
    sharpeAnnualVsZero: stdA > 0 ? meanA / stdA : 0,
  }
}

export function allBucketStats(): BucketStats[] {
  return BUCKET_IDS.map(computeBucketStats)
}

export function covarianceMatrix(): Covariance {
  const series = BUCKET_IDS.map(bucketSeries)
  const n = BUCKET_IDS.length
  const matrix: number[][] = Array.from({ length: n }, () => Array(n).fill(0))
  for (let i = 0; i < n; i++) {
    for (let j = i; j < n; j++) {
      const cov = covariance(series[i], series[j])
      matrix[i][j] = cov
      matrix[j][i] = cov
    }
  }
  return { buckets: [...BUCKET_IDS], matrix }
}

export function correlationMatrix(): Covariance {
  const cov = covarianceMatrix()
  const n = cov.buckets.length
  const stds = cov.buckets.map((_, i) => Math.sqrt(cov.matrix[i][i]))
  const matrix: number[][] = Array.from({ length: n }, () => Array(n).fill(0))
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const denom = stds[i] * stds[j]
      matrix[i][j] = denom > 0 ? cov.matrix[i][j] / denom : 0
    }
  }
  return { buckets: cov.buckets, matrix }
}

export function portfolioStats(weightsByBucket: Record<BucketId, number>): {
  expectedAnnualReturn: number
  annualVol: number
  sharpe: number
} {
  const w = BUCKET_IDS.map((id) => weightsByBucket[id] ?? 0)
  const stats = allBucketStats()
  const cov = covarianceMatrix()

  const rMonthly = stats.reduce((acc, s, i) => acc + w[i] * s.meanMonthly, 0)

  let varMonthly = 0
  for (let i = 0; i < w.length; i++) {
    for (let j = 0; j < w.length; j++) {
      varMonthly += w[i] * w[j] * cov.matrix[i][j]
    }
  }
  const volMonthly = Math.sqrt(Math.max(varMonthly, 0))
  const rAnnual = annualizeReturn(rMonthly)
  const volAnnual = annualizeVol(volMonthly)
  return {
    expectedAnnualReturn: rAnnual,
    annualVol: volAnnual,
    sharpe: volAnnual > 0 ? rAnnual / volAnnual : 0,
  }
}

// Decomposicao de Cholesky: L * L^T = Cov. Usada no MC correlacionado.
export function cholesky(cov: number[][]): number[][] {
  const n = cov.length
  const L: number[][] = Array.from({ length: n }, () => Array(n).fill(0))
  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      let sum = 0
      for (let k = 0; k < j; k++) sum += L[i][k] * L[j][k]
      if (i === j) {
        const diag = cov[i][i] - sum
        L[i][j] = Math.sqrt(Math.max(diag, 1e-12))
      } else {
        L[i][j] = L[j][j] > 0 ? (cov[i][j] - sum) / L[j][j] : 0
      }
    }
  }
  return L
}
