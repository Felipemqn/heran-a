import { assetClassLabel, type AllocationSnapshot } from '@/types/domain'
import { fmtMoney, fmtPct } from '@/lib/format'

const colorByClass: Record<AllocationSnapshot['class'], string> = {
  fixed_income: 'bg-jera-mint',
  equities: 'bg-jera-teal',
  real_estate: 'bg-amber-400',
  alternatives: 'bg-purple-400',
  cash: 'bg-jera-off/60',
}

interface Props {
  items: AllocationSnapshot[]
}

export default function AllocationBars({ items }: Props) {
  return (
    <div className="flex flex-col gap-3">
      {items.map((a) => (
        <div key={a.class} className="flex flex-col gap-1">
          <div className="flex items-baseline justify-between text-sm">
            <span className="text-jera-off/80">{assetClassLabel[a.class]}</span>
            <span className="font-mono text-jera-off/60 text-xs">
              {fmtMoney(a.valueBrl, { compact: true })} &middot; {fmtPct(Number(a.percentage))}
            </span>
          </div>
          <div className="h-2 rounded-full bg-jera-off/5 overflow-hidden">
            <div
              className={`h-full ${colorByClass[a.class]} rounded-full transition-[width] duration-700 ease-out`}
              style={{ width: `${Number(a.percentage)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
