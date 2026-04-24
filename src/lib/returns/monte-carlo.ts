import { BUCKET_IDS, type BucketId } from './data'
import {
  allBucketStats,
  covarianceMatrix,
  cholesky,
} from './statistics'

// RNG deterministico (mulberry32) — permite reproducibilidade dos testes.
function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Box-Muller: par de amostras N(0,1) a partir de 2 uniformes [0,1).
function boxMullerPair(rand: () => number): [number, number] {
  let u1 = rand()
  const u2 = rand()
  if (u1 < 1e-12) u1 = 1e-12
  const mag = Math.sqrt(-2 * Math.log(u1))
  const theta = 2 * Math.PI * u2
  return [mag * Math.cos(theta), mag * Math.sin(theta)]
}

export function normalDraws(n: number, rand: () => number): number[] {
  const out = new Array<number>(n)
  for (let i = 0; i < n; i += 2) {
    const [a, b] = boxMullerPair(rand)
    out[i] = a
    if (i + 1 < n) out[i + 1] = b
  }
  return out
}

// Produto matriz (m x n) . vetor (n) = vetor (m)
function matVec(M: number[][], v: number[]): number[] {
  const m = M.length
  const n = v.length
  const out = new Array<number>(m).fill(0)
  for (let i = 0; i < m; i++) {
    let sum = 0
    for (let j = 0; j < n; j++) sum += M[i][j] * v[j]
    out[i] = sum
  }
  return out
}

export interface MonteCarloInput {
  weights: Record<BucketId, number>
  initialBrl: number
  years: number
  sims?: number
  seed?: number
}

export interface FanPoint {
  year: number
  p10: number
  p25: number
  p50: number
  p75: number
  p90: number
  mean: number
}

export interface MonteCarloResult {
  byYear: FanPoint[]
  metrics: {
    finalMedian: number
    finalP10: number
    finalP90: number
    probLossNominal: number
    probDoubling: number
  }
  sims: number
}

// Simulacao correlacionada.
// Gera, pra cada ano: 12 shocks mensais de N(0,1) -> Cholesky -> aplica ao
// vetor de medias mensais -> composição do portfolio com pesos do usuario.
export function runMonteCarlo(input: MonteCarloInput): MonteCarloResult {
  const sims = input.sims ?? 500
  const years = input.years
  const initial = input.initialBrl
  const rand = mulberry32(input.seed ?? 42)

  const stats = allBucketStats()
  const means = stats.map((s) => s.meanMonthly)
  const L = cholesky(covarianceMatrix().matrix)
  const weights = BUCKET_IDS.map((id) => input.weights[id] ?? 0)

  const nBuckets = BUCKET_IDS.length
  // paths[sim] = array de valores ao final de cada ano (length = years+1, começa com initial)
  const paths: number[][] = Array.from({ length: sims }, () => {
    const p = new Array<number>(years + 1)
    p[0] = initial
    return p
  })

  for (let s = 0; s < sims; s++) {
    let value = initial
    for (let y = 1; y <= years; y++) {
      let yearGrowth = 1
      for (let m = 0; m < 12; m++) {
        const z = normalDraws(nBuckets, rand)
        const shocks = matVec(L, z)
        let portMonthly = 0
        for (let i = 0; i < nBuckets; i++) {
          const r = means[i] + shocks[i]
          portMonthly += weights[i] * r
        }
        yearGrowth *= 1 + portMonthly
      }
      value *= yearGrowth
      paths[s][y] = value
    }
  }

  const byYear: FanPoint[] = []
  for (let y = 0; y <= years; y++) {
    const vals = paths.map((p) => p[y]).sort((a, b) => a - b)
    byYear.push({
      year: y,
      p10: quantile(vals, 0.1),
      p25: quantile(vals, 0.25),
      p50: quantile(vals, 0.5),
      p75: quantile(vals, 0.75),
      p90: quantile(vals, 0.9),
      mean: mean(vals),
    })
  }

  const finals = paths.map((p) => p[years])
  const loss = finals.filter((v) => v < initial).length / sims
  const doubled = finals.filter((v) => v >= 2 * initial).length / sims

  return {
    byYear,
    metrics: {
      finalMedian: byYear[byYear.length - 1].p50,
      finalP10: byYear[byYear.length - 1].p10,
      finalP90: byYear[byYear.length - 1].p90,
      probLossNominal: loss,
      probDoubling: doubled,
    },
    sims,
  }
}

function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return 0
  const idx = (sorted.length - 1) * q
  const lo = Math.floor(idx)
  const hi = Math.ceil(idx)
  if (lo === hi) return sorted[lo]
  const w = idx - lo
  return sorted[lo] * (1 - w) + sorted[hi] * w
}

function mean(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((a, b) => a + b, 0) / values.length
}

export const __internals = { boxMullerPair, mulberry32, quantile }
