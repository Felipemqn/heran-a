import { Suspense } from 'react'
import { Panel } from '@/components/ui/panel'
import { Card } from '@/components/ui/card'
import { Stat } from '@/components/ui/stat'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import Sparkline from '@/components/charts/sparkline'
import AllocationBars from '@/components/modules/allocation-bars'
import GenerationalPreview from '@/components/modules/generational-preview'
import { fmtMoney, fmtDelta } from '@/lib/format'
import { getMockOverview, type FamilyOverview } from '@/server/queries/family-overview'

async function loadOverview(): Promise<FamilyOverview> {
  // Sessao 1/5: trocar por query Prisma real com base em familyId do membro logado.
  return getMockOverview()
}

export default async function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  )
}

async function DashboardContent() {
  const overview = await loadOverview()
  const sparkData = overview.historical.map((h) => ({
    x: h.recordedAt.getFullYear(),
    y: h.valueBrl,
  }))
  const hasHistory = sparkData.length > 0
  const firstYear = hasHistory ? overview.historical[0].recordedAt.getFullYear() : null
  const lastYear = hasHistory
    ? overview.historical[overview.historical.length - 1].recordedAt.getFullYear()
    : null

  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col md:flex-row md:items-end gap-6">
        <div className="flex-1 flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <span className="text-xs uppercase tracking-wider text-jera-off/60">
              Patrimonio total
            </span>
            <Badge variant="mint">{fmtDelta(overview.ytdDelta)} YTD</Badge>
          </div>
          <div className="font-serif text-6xl text-jera-mint tabular-nums">
            {fmtMoney(overview.totalBrl)}
          </div>
          <span className="text-sm text-jera-off/50">
            Familia {overview.family.name}
          </span>
        </div>
        <Card className="md:w-[360px]" padding="sm">
          {hasHistory ? (
            <>
              <Sparkline data={sparkData} />
              <div className="text-xs text-jera-off/50 px-3 pb-1">
                {firstYear} &mdash; {lastYear}
              </div>
            </>
          ) : (
            <div className="h-[60px] flex items-center justify-center text-xs text-jera-off/40">
              Sem histórico disponível
            </div>
          )}
        </Card>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <Stat
            label="Liquido disponivel"
            value={fmtMoney(overview.liquidBrl, { compact: true })}
            hint={`${Math.round((overview.liquidBrl / overview.totalBrl) * 100)}% do total`}
          />
        </Card>
        <Card>
          <Stat
            label="Herdeiros"
            value={String(overview.heirsCount)}
            hint="2 geracoes"
          />
        </Card>
        <Card>
          <Stat
            label="Classes investidas"
            value={String(overview.allocations.length)}
            hint="diversificacao saudavel"
          />
        </Card>
        <Card>
          <Stat
            label="Revisao IPS"
            value="Em dia"
            delta="proxima em 90d"
            deltaTone="positive"
          />
        </Card>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Panel
          title="Composicao patrimonial"
          description="Snapshot atual por classe de ativo"
          className="lg:col-span-2"
        >
          <AllocationBars items={overview.allocations} />
        </Panel>

        <Panel
          title="Projecao geracional"
          description="Preview da arvore da familia"
        >
          <GenerationalPreview members={overview.members} />
        </Panel>
      </section>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-10">
      <Skeleton className="h-24 w-80" />
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-6">
        <Skeleton className="h-64 col-span-2" />
        <Skeleton className="h-64" />
      </div>
    </div>
  )
}
