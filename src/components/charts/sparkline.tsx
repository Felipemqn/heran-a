'use client'

import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts'

interface SparklineProps {
  data: Array<{ x: string | number; y: number }>
  height?: number
  color?: string
}

export default function Sparkline({ data, height = 60, color = '#B7F1E6' }: SparklineProps) {
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
          <defs>
            <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <YAxis hide domain={['dataMin', 'dataMax']} />
          <Area
            type="monotone"
            dataKey="y"
            stroke={color}
            strokeWidth={2}
            fill="url(#spark-fill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
