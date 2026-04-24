import { BUCKET_IDS, historicalReturns, type BucketId } from './data'

export interface BacktestResult {
  startDate: string
  endDate: string
  months: number
  finalValue: number
  cagr: number
  maxDrawdown: number
  maxDrawdownStart: string
  maxDrawdownEnd: string
  worstRolling12m: number
  worstRolling36mAnnualized: number
  worstRolling60mAnnualized: number
  equityCurve: Array<{ date: string; value: number }>
}

// Replay da alocacao sobre a serie historica.
// Rebalanceia mensalmente (voltando aos pesos alvo a cada mes).
export function backtest(
  weights: Record<BucketId, number>,
  initialBrl: number
): BacktestResult {
  const w = BUCKET_IDS.map((id) => weights[id] ?? 0)

  let value = initialBrl
  const equityCurve: Array<{ date: string; value: number }> = [
    { date: historicalReturns[0].date, value: initialBrl },
  ]
  const monthlyPortReturns: number[] = []

  for (const point of historicalReturns) {
    const rs = BUCKET_IDS.map((id) => point.returns[id] ?? 0)
    let portMonthly = 0
    for (let i = 0; i < w.length; i++) portMonthly += w[i] * rs[i]
    value *= 1 + portMonthly
    monthlyPortReturns.push(portMonthly)
    equityCurve.push({ date: point.date, value })
  }

  // Max drawdown: peak-to-trough no equity curve.
  let peak = equityCurve[0].value
  let peakDate = equityCurve[0].date
  let maxDD = 0
  let ddStart = peakDate
  let ddEnd = peakDate
  for (const pt of equityCurve) {
    if (pt.value > peak) {
      peak = pt.value
      peakDate = pt.date
    }
    const dd = peak > 0 ? (pt.value - peak) / peak : 0
    if (dd < maxDD) {
      maxDD = dd
      ddStart = peakDate
      ddEnd = pt.date
    }
  }

  // Janelas rolling sobre retornos compostos.
  const worst12 = worstRolling(monthlyPortReturns, 12)
  const worst36 = worstRolling(monthlyPortReturns, 36)
  const worst60 = worstRolling(monthlyPortReturns, 60)

  const months = historicalReturns.length
  const cagr = months > 0 ? Math.pow(value / initialBrl, 12 / months) - 1 : 0

  return {
    startDate: historicalReturns[0].date,
    endDate: historicalReturns[historicalReturns.length - 1].date,
    months,
    finalValue: value,
    cagr,
    maxDrawdown: maxDD,
    maxDrawdownStart: ddStart,
    maxDrawdownEnd: ddEnd,
    worstRolling12m: worst12 ?? 0,
    worstRolling36mAnnualized:
      worst36 !== null ? Math.pow(1 + worst36, 12 / 36) - 1 : 0,
    worstRolling60mAnnualized:
      worst60 !== null ? Math.pow(1 + worst60, 12 / 60) - 1 : 0,
    equityCurve,
  }
}

// Pior retorno composto numa janela de N meses consecutivos.
function worstRolling(monthly: number[], window: number): number | null {
  if (monthly.length < window) return null
  let worst = Infinity
  for (let i = 0; i + window <= monthly.length; i++) {
    let prod = 1
    for (let j = 0; j < window; j++) prod *= 1 + monthly[i + j]
    const total = prod - 1
    if (total < worst) worst = total
  }
  return worst === Infinity ? null : worst
}

export const __internals = { worstRolling }
