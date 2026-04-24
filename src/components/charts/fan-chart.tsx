'use client'

import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts'
import { fmtMoney } from '@/lib/format'

export interface FanPoint {
  year: number
  p10: number
  p25: number
  p50: number
  p75: number
  p90: number
}

// Recharts nao suporta "faixas" nativamente. Truque: transformar em bandas.
// band10_90 = p90 - p10, base = p10. Idem 25_75.
function toStackable(data: FanPoint[]) {
  return data.map((p) => ({
    year: p.year,
    base10: p.p10,
    band10_25: p.p25 - p.p10,
    band25_75: p.p75 - p.p25,
    band75_90: p.p90 - p.p75,
    p50: p.p50,
  }))
}

interface Props {
  data: FanPoint[]
  height?: number
}

export default function FanChart({ data, height = 320 }: Props) {
  const stackable = toStackable(data)
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <AreaChart data={stackable} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
          <defs>
            <linearGradient id="band25_75" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0b7a6e" stopOpacity={0.45} />
              <stop offset="100%" stopColor="#0b7a6e" stopOpacity={0.45} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="year"
            tickFormatter={(v) => `${v}a`}
            stroke="#f0ede655"
            tick={{ fontSize: 11 }}
          />
          <YAxis
            tickFormatter={(v) => fmtMoney(v, { compact: true })}
            stroke="#f0ede655"
            tick={{ fontSize: 11 }}
            width={80}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#0d1b22',
              border: '1px solid rgba(240,237,230,0.1)',
              borderRadius: 8,
              fontSize: 12,
            }}
            labelFormatter={(v) => `Ano ${v}`}
            formatter={(v, name) => {
              const num = typeof v === 'number' ? v : Number(v)
              const labels: Record<string, string> = {
                base10: 'p10',
                band10_25: 'p25 (acima de p10)',
                band25_75: 'p75 (acima de p25)',
                band75_90: 'p90 (acima de p75)',
                p50: 'mediana',
              }
              return [fmtMoney(num), labels[name as string] ?? name]
            }}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {/* base invisivel pra empilhar */}
          <Area
            dataKey="base10"
            stackId="1"
            stroke="none"
            fill="transparent"
            legendType="none"
            name="base"
          />
          <Area
            dataKey="band10_25"
            stackId="1"
            stroke="none"
            fill="#0b7a6e"
            fillOpacity={0.25}
            name="p10–p25"
          />
          <Area
            dataKey="band25_75"
            stackId="1"
            stroke="none"
            fill="url(#band25_75)"
            name="p25–p75"
          />
          <Area
            dataKey="band75_90"
            stackId="1"
            stroke="none"
            fill="#0b7a6e"
            fillOpacity={0.25}
            name="p75–p90"
          />
          <Area
            type="monotone"
            dataKey="p50"
            stroke="#b7f1e6"
            strokeWidth={2}
            fill="none"
            name="mediana"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
