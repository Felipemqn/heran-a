import { generationLabel, type GenerationTier, type Member } from '@/types/domain'

interface Props {
  members: Pick<Member, 'id' | 'name' | 'role' | 'generation'>[]
}

const order: GenerationTier[] = ['founder', 'heir', 'grandheir']

export default function GenerationalPreview({ members }: Props) {
  const grouped = order.map((gen) => ({
    gen,
    list: members.filter((m) => m.generation === gen),
  }))

  return (
    <div className="flex flex-col gap-6">
      {grouped.map((group) => (
        <div key={group.gen} className="flex flex-col gap-2">
          <div className="text-xs uppercase tracking-wider text-jera-off/50">
            {generationLabel[group.gen]}
          </div>
          <div className="flex flex-wrap gap-2">
            {group.list.map((m) => (
              <div
                key={m.id}
                className="px-3 py-2 rounded-lg bg-jera-night border border-jera-off/10 text-sm"
              >
                {m.name}
              </div>
            ))}
            {group.list.length === 0 && (
              <div className="text-sm text-jera-off/40">\u2014</div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
