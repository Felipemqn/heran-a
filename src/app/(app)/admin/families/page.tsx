import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card } from '@/components/ui/card'
import { Panel } from '@/components/ui/panel'
import { Badge } from '@/components/ui/badge'
import { getCurrentMember } from '@/lib/current-member'
import SyncHubspotButton from './sync-button'

export default async function AdminFamiliesPage() {
  const me = await getCurrentMember()
  if (!me) redirect('/sign-in')

  if (me.role !== 'advisor') {
    return (
      <main className="py-16">
        <Card>
          <h1 className="font-serif text-3xl text-jera-mint mb-2">Acesso restrito</h1>
          <p className="text-jera-off/70">
            Esta area e reservada a advisors. Se voce deveria ter acesso, procure o admin.
          </p>
        </Card>
      </main>
    )
  }

  const families = await db.family.findMany({
    where: { deletedAt: null },
    orderBy: { updatedAt: 'desc' },
    include: {
      _count: { select: { members: true, assets: true } },
    },
    take: 100,
  })

  const hubspotLinked = families.filter((f) => f.slug.startsWith('hs-')).length

  return (
    <main className="flex flex-col gap-10 py-10">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl text-jera-mint">Familias</h1>
          <p className="text-jera-off/60 mt-1">
            {families.length} familias no Horizonte &middot; {hubspotLinked} sincronizadas do HubSpot
          </p>
        </div>
        <SyncHubspotButton />
      </header>

      <Panel title="Lista">
        <div className="flex flex-col divide-y divide-jera-off/10">
          {families.map((f) => (
            <div key={f.id} className="flex items-center justify-between py-3">
              <div className="flex flex-col gap-1">
                <span className="text-jera-off">{f.name}</span>
                <span className="text-xs text-jera-off/50 font-mono">{f.slug}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-jera-off/60">
                <span>{f._count.members} membros</span>
                <span>&middot;</span>
                <span>{f._count.assets} ativos</span>
                {f.slug.startsWith('hs-') && <Badge variant="mint">HubSpot</Badge>}
              </div>
            </div>
          ))}
          {families.length === 0 && (
            <div className="py-8 text-center text-jera-off/40">
              Nenhuma familia registrada ainda. Sincronize do HubSpot acima.
            </div>
          )}
        </div>
      </Panel>
    </main>
  )
}
