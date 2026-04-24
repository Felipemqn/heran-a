'use client'

import { useState, useTransition, useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { Save, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Stat } from '@/components/ui/stat'
import { Panel } from '@/components/ui/panel'
import { Badge } from '@/components/ui/badge'
import { fmtMoney, fmtPct } from '@/lib/format'
import { saveScenario } from '@/server/actions/scenario'
import {
  assetClasses,
  profiles,
  type AssetClass,
  type Profile,
  type BucketId,
} from '@/lib/returns/data'
import { portfolioStats } from '@/lib/returns/statistics'
import MonteCarloPanel from './monte-carlo-panel'

interface Props {
  defaultProfileId: string
}

const BUCKET_COLORS: Record<BucketId, string> = {
  br_cash_fi: '#b7f1e6',
  br_equities: '#0b7a6e',
  br_alts: '#a78bfa',
  br_re: '#fbbf24',
  int_cash_fi: '#67e8f9',
  int_equities: '#0891b2',
  int_alts: '#c084fc',
  int_re: '#f59e0b',
}

function normalizeTo100(weights: Record<BucketId, number>): Record<BucketId, number> {
  const total = Object.values(weights).reduce((a, b) => a + b, 0)
  if (total === 0) return weights
  const scale = 100 / total
  const result = { ...weights }
  for (const k of Object.keys(result) as BucketId[]) {
    result[k] = Math.round(result[k] * scale * 10) / 10
  }
  return result
}

export default function AllocationSliders({ defaultProfileId }: Props) {
  const defaultProfile: Profile =
    (profiles as Profile[]).find((p: Profile) => p.id === defaultProfileId) ?? profiles[0]
  const initialWeights: Record<BucketId, number> = Object.fromEntries(
    (assetClasses as AssetClass[]).map<[BucketId, number]>((c: AssetClass) => [
      c.id,
      (defaultProfile.weights[c.id] ?? 0) * 100,
    ])
  ) as Record<BucketId, number>

  const [weights, setWeights] = useState<Record<BucketId, number>>(initialWeights)
  const [selectedProfileId, setSelectedProfileId] = useState<string>(defaultProfileId)
  const [initialBrl, setInitialBrl] = useState(100_000_000)
  const [years, setYears] = useState(20)
  const [name, setName] = useState('')
  const [saveState, setSaveState] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const total = Object.values(weights).reduce((a, b) => a + b, 0)

  const stats = useMemo(() => {
    const normalized = normalizeTo100(weights)
    const asFraction = Object.fromEntries(
      Object.entries(normalized).map(([k, v]) => [k, v / 100])
    ) as Record<BucketId, number>
    return portfolioStats(asFraction)
  }, [weights])

  const projectedFinal = initialBrl * Math.pow(1 + stats.expectedAnnualReturn, years)

  function setWeight(id: BucketId, value: number) {
    const delta = value - weights[id]
    const others: BucketId[] = (assetClasses as AssetClass[])
      .map((c: AssetClass) => c.id)
      .filter((k: BucketId) => k !== id)
    const otherTotal = others.reduce((acc: number, k: BucketId) => acc + weights[k], 0)

    const next: Record<BucketId, number> = { ...weights, [id]: value }
    if (otherTotal > 0 && delta !== 0) {
      for (const k of others) {
        const share = weights[k] / otherTotal
        next[k] = Math.max(0, Math.round((weights[k] - delta * share) * 10) / 10)
      }
    }
    setWeights(next)
    setSelectedProfileId('custom')
  }

  function applyProfile(profileId: string) {
    const p = (profiles as Profile[]).find((x: Profile) => x.id === profileId)
    if (!p) return
    const entries = (assetClasses as AssetClass[]).map<[BucketId, number]>(
      (c: AssetClass) => [c.id, (p.weights[c.id] ?? 0) * 100]
    )
    const next = Object.fromEntries(entries) as Record<BucketId, number>
    setWeights(next)
    setSelectedProfileId(profileId)
  }

  async function handleSave() {
    if (!name.trim()) {
      setSaveState('Dê um nome ao cenário')
      return
    }
    setSaveState(null)
    startTransition(async () => {
      const result = await saveScenario({
        name: name.trim(),
        weights: normalizeTo100(weights),
        initialBrl,
        years,
      })
      if (result.ok) {
        setSaveState(`Salvo (id: ${result.scenarioId?.slice(0, 8)}…)`)
      } else {
        setSaveState(`Erro: ${result.error}`)
      }
    })
  }

  const pieData = (assetClasses as AssetClass[])
    .map((c: AssetClass) => ({ name: c.label, value: weights[c.id], id: c.id }))
    .filter((d: { value: number }) => d.value > 0.1)

  const normalizedFractions = useMemo(() => {
    const norm = normalizeTo100(weights)
    return Object.fromEntries(
      Object.entries(norm).map(([k, v]) => [k, v / 100])
    ) as Record<BucketId, number>
  }, [weights])

  return (
    <div className="flex flex-col gap-8">
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 flex flex-col gap-6">
        <Panel
          title="Perfil e alocação"
          description="Comece por um perfil Jera ou ajuste manualmente os sliders"
          action={
            <select
              value={selectedProfileId}
              onChange={(e) => applyProfile(e.target.value)}
              className="h-9 px-3 rounded-lg bg-jera-night border border-jera-off/10 text-sm"
            >
              <option value="custom">Personalizado</option>
              {(profiles as Profile[]).map((p: Profile) => (
                <option key={p.id} value={p.id}>
                  {p.id.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          }
        >
          <div className="flex flex-col gap-4">
            {(assetClasses as AssetClass[]).map((c: AssetClass) => (
              <div key={c.id} className="flex flex-col gap-1.5">
                <div className="flex items-baseline justify-between text-sm">
                  <span className="text-jera-off/90 flex items-center gap-2">
                    <span
                      className="inline-block size-2.5 rounded-full"
                      style={{ backgroundColor: BUCKET_COLORS[c.id] }}
                    />
                    {c.label}
                  </span>
                  <span className="font-mono text-jera-off/70 text-xs">
                    {fmtPct(weights[c.id])}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={0.5}
                  value={weights[c.id]}
                  onChange={(e) => setWeight(c.id, Number(e.target.value))}
                  className="w-full accent-jera-teal"
                  style={{ colorScheme: 'dark' }}
                />
              </div>
            ))}
            <div className="mt-2 flex items-center justify-between text-xs pt-2 border-t border-jera-off/10">
              <span className="text-jera-off/50">Total</span>
              <Badge variant={Math.abs(total - 100) < 1 ? 'mint' : 'warn'}>
                {fmtPct(total)}
              </Badge>
            </div>
          </div>
        </Panel>

        <Panel
          title="Parâmetros do cenário"
          description="Usados no cálculo de projeção"
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs uppercase tracking-wider text-jera-off/60">
                Patrimônio inicial (R$)
              </label>
              <input
                type="number"
                value={initialBrl}
                onChange={(e) => setInitialBrl(Number(e.target.value) || 0)}
                className="h-10 px-3 rounded-lg bg-jera-night border border-jera-off/10 text-sm"
                min={0}
                step={1000000}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs uppercase tracking-wider text-jera-off/60">
                Horizonte (anos)
              </label>
              <input
                type="number"
                value={years}
                onChange={(e) => setYears(Number(e.target.value) || 1)}
                className="h-10 px-3 rounded-lg bg-jera-night border border-jera-off/10 text-sm"
                min={1}
                max={50}
              />
            </div>
          </div>
        </Panel>

        <Panel
          title="Salvar cenário"
          description="Guarda pesos + parâmetros na conta da família"
        >
          <div className="flex gap-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome do cenário"
              className="flex-1 h-10 px-3 rounded-lg bg-jera-night border border-jera-off/10 text-sm"
            />
            <Button onClick={handleSave} disabled={isPending}>
              <Save className="size-4" />
              {isPending ? 'Salvando…' : 'Salvar'}
            </Button>
            <Button variant="ghost" onClick={() => applyProfile(defaultProfileId)}>
              <RotateCcw className="size-4" />
              Reset
            </Button>
          </div>
          {saveState && <p className="mt-2 text-xs text-jera-off/60">{saveState}</p>}
        </Panel>
      </div>

      <div className="flex flex-col gap-4">
        <Card>
          <Stat
            label="Retorno esperado anual"
            value={fmtPct(stats.expectedAnnualReturn * 100, 2)}
            hint="histórico 2012–2026"
          />
        </Card>
        <Card>
          <Stat
            label="Volatilidade anual"
            value={fmtPct(stats.annualVol * 100, 2)}
            hint="desvio-padrão anualizado"
          />
        </Card>
        <Card>
          <Stat
            label="Sharpe (vs 0)"
            value={stats.sharpe.toFixed(2)}
            hint="retorno / vol"
          />
        </Card>
        <Card>
          <Stat
            label={`Patrimônio em ${years} anos`}
            value={fmtMoney(projectedFinal, { compact: true })}
            hint="determinístico, juros compostos"
            delta={`${projectedFinal > initialBrl ? '+' : ''}${fmtPct(
              ((projectedFinal / initialBrl - 1) * 100),
              1
            )} total`}
            deltaTone={projectedFinal > initialBrl ? 'positive' : 'negative'}
          />
        </Card>
        <Card padding="sm">
          <div className="text-xs uppercase tracking-wider text-jera-off/60 mb-2 px-2">
            Composição
          </div>
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={45}
                  outerRadius={85}
                  paddingAngle={2}
                >
                  {pieData.map((d: { id: string }) => (
                    <Cell key={d.id} fill={BUCKET_COLORS[d.id as BucketId]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v) => {
                    const n = typeof v === 'number' ? v : Number(v)
                    return `${n.toFixed(1)}%`
                  }}
                  contentStyle={{
                    backgroundColor: '#0d1b22',
                    border: '1px solid rgba(240,237,230,0.1)',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>

      <MonteCarloPanel
        weights={normalizedFractions}
        initialBrl={initialBrl}
        years={years}
      />
    </div>
  )
}
