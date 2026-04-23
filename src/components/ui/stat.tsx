import * as React from 'react'
import { cn } from '@/lib/utils'

interface StatProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string
  value: string
  delta?: string
  deltaTone?: 'positive' | 'negative' | 'neutral'
  hint?: string
}

export function Stat({ label, value, delta, deltaTone = 'neutral', hint, className, ...props }: StatProps) {
  const deltaColor =
    deltaTone === 'positive' ? 'text-jera-mint' : deltaTone === 'negative' ? 'text-red-400' : 'text-jera-off/60'

  return (
    <div className={cn('flex flex-col gap-1', className)} {...props}>
      <span className="text-xs uppercase tracking-wider text-jera-off/60">{label}</span>
      <span className="font-serif text-3xl text-jera-off tabular-nums">{value}</span>
      {(delta || hint) && (
        <span className={cn('text-xs', deltaColor)}>
          {delta}
          {delta && hint ? ' · ' : ''}
          {hint && <span className="text-jera-off/50">{hint}</span>}
        </span>
      )}
    </div>
  )
}

export default Stat
