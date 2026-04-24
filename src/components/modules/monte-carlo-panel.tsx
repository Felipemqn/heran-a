'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Panel } from '@/components/ui/panel'
import { Card } from '@/components/ui/card'
import { Stat } from '@/components/ui/stat'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import FanChart, { type FanPoint } from '@/components/charts/fan-chart'
import { fmtMoney, fmtPct } from '@/lib/format'
import type { BucketId } from '@/lib/returns/data'

interface BacktestResponse {
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
}

interface MonteCarloResponse {
  monteCarlo: {
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
  backtest: BacktestResponse
  computeMs: number
}

interface Props {
  weights: Record<BucketId, number>
  initialBrl: number
  years: number
}

export default function MonteCarloPanel({ weights, initialBrl, years }: Props) {
  const [data, setData] = useState<MonteCarloResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sims, setSims] = useState(500)
  const lastParamsRef = useRef<string>('')

  const run = useCallback(
    async (simsOverride?: number) => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch('/api/monte-carlo', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            weights,
            initialBrl,
            years,
            sims: simsOverride ?? sims,
            seed: 42,
          }),
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: res.statusText }))
          throw new Error(err.error ?? `HTTP ${res.status}`)
        }
        const json: MonteCarloResponse = await res.json()
        setData(json)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'falha')
      } finally {
        setLoading(false)
      }
    },
    [weights, initialBrl, years, sims]
  )

  // Auto-run quando pesos/params mudam (com debounce simples via key).
  useEffect(() => {
    const key = JSON.stringify({ weights, initialBrl, years, sims })
    if (key === lastParamsRef.current) return
    lastParamsRef.current = key
    const t = setTimeout(() => run(), 400)
    return () => clearTimeout(t)
  }, [weights, initialBrl, years, sims, run])

  const mc = data?.monteCarlo
  const bt = data?.backtest

  return (
    <div className="flex flex-col gap-6">
      <Panel
        title="Projeção estocástica (Monte Carlo)"
        description={
          mc
            ? `${mc.sims} simulações, ${years} anos, correlação via Cholesky`
            : 'Cenários com shocks correlacionados sobre a série real 2012–2026'
        }
        action={
          <div className="flex items-center gap-2">
            <select
              value={sims}
              onChange={(e) => setSims(Number(e.target.value))}
              disabled={loading}
              className="h-8 px-2 rounded-lg bg-jera-night border border-jera-off/10 text-xs"
            >
              <option value={100}>100 sims</option>
              <option value={500}>500 sims</option>
              <option value={2000}>2000 sims</option>
            </select>
            <Button size="sm" variant="ghost" onClick={() => run()} disabled={loading}>
              {loading ? '…' : 'Rodar'}
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-300">
              {error}
            </div>
          )}
          {loading && !mc && <Skeleton className="h-[320px]" />}
          {mc && <FanChart data={mc.byYear} />}

          {mc && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card>
                <Stat
                  label={`Mediana em ${years}a`}
                  value={fmtMoney(mc.metrics.finalMedian, { compact: true })}
                />
              </Card>
              <Card>
                <Stat
                  label="P10 (cauda ruim)"
                  value={fmtMoney(mc.metrics.finalP10, { compact: true })}
                  hint={`P90: ${fmtMoney(mc.metrics.finalP90, { compact: true })}`}
                />
              </Card>
              <Card>
                <Stat
                  label="Prob. de perda nominal"
                  value={fmtPct(mc.metrics.probLossNominal * 100)}
                  deltaTone={
                    mc.metrics.probLossNominal > 0.2
                      ? 'negative'
                      : 'positive'
                  }
                  delta={
                    mc.metrics.probLossNominal > 0.2 ? 'elevada' : 'baixa'
                  }
                />
              </Card>
              <Card>
                <Stat
                  label="Prob. de dobrar"
                  value={fmtPct(mc.metrics.probDoubling * 100)}
                  hint={`em ${years}a`}
                />
              </Card>
            </div>
          )}
        </div>
      </Panel>

      <Panel
        title="Backtest histórico"
        description={
          bt
            ? `Replay da alocação em ${bt.startDate.slice(0, 7)} → ${bt.endDate.slice(0, 7)}`
            : 'Se essa alocação tivesse valido nos 14 anos reais'
        }
      >
        {loading && !bt && <Skeleton className="h-24" />}
        {bt && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card>
              <Stat
                label="CAGR realizado"
                value={fmtPct(bt.cagr * 100, 2)}
                hint={`${bt.months} meses`}
              />
            </Card>
            <Card>
              <Stat
                label="Max drawdown"
                value={fmtPct(bt.maxDrawdown * 100, 1)}
                hint={`${bt.maxDrawdownStart.slice(0, 7)} → ${bt.maxDrawdownEnd.slice(0, 7)}`}
                deltaTone="negative"
              />
            </Card>
            <Card>
              <Stat
                label="Pior janela 12m"
                value={fmtPct(bt.worstRolling12m * 100, 1)}
                hint="retorno total"
                deltaTone="negative"
              />
            </Card>
            <Card>
              <Stat
                label="Pior janela 60m (a.a.)"
                value={fmtPct(bt.worstRolling60mAnnualized * 100, 1)}
                hint="CAGR no pior 5a"
                deltaTone={
                  bt.worstRolling60mAnnualized < 0 ? 'negative' : 'positive'
                }
              />
            </Card>
          </div>
        )}
      </Panel>

      {data && (
        <div className="text-xs text-jera-off/40 text-right">
          Computado em {data.computeMs}ms ·{' '}
          <Badge variant="neutral">sem cache</Badge>
        </div>
      )}
    </div>
  )
}
