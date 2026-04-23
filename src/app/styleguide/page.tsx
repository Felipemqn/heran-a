import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Stat } from '@/components/ui/stat'
import { Panel } from '@/components/ui/panel'
import { Skeleton } from '@/components/ui/skeleton'

const palette = [
  { name: 'jera-black', hex: '#070A0C' },
  { name: 'jera-night', hex: '#0D1B22' },
  { name: 'jera-deep', hex: '#052B38' },
  { name: 'jera-teal', hex: '#0B7A6E' },
  { name: 'jera-off', hex: '#F0EDE6' },
  { name: 'jera-mint', hex: '#B7F1E6' },
]

export default function StyleguidePage() {
  return (
    <main className="min-h-screen bg-jera-black text-jera-off py-16 px-8">
      <div className="mx-auto max-w-5xl flex flex-col gap-12">
        <header className="flex flex-col gap-2">
          <h1 className="font-serif text-5xl text-jera-mint">Styleguide</h1>
          <p className="text-jera-off/60">
            Tokens e componentes base do Jera Horizonte.
          </p>
        </header>

        <section>
          <h2 className="text-sm uppercase tracking-wider text-jera-off/60 mb-4">Paleta</h2>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {palette.map((c) => (
              <div key={c.name} className="flex flex-col gap-2">
                <div
                  className="h-20 rounded-lg border border-jera-off/10"
                  style={{ backgroundColor: c.hex }}
                />
                <div className="text-xs">
                  <div className="font-medium">{c.name}</div>
                  <div className="text-jera-off/50 font-mono">{c.hex}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-sm uppercase tracking-wider text-jera-off/60 mb-4">Tipografia</h2>
          <Card className="space-y-3">
            <p className="font-serif text-5xl text-jera-mint">Fraunces hero 48</p>
            <p className="font-serif text-3xl">Fraunces title 30</p>
            <p className="text-xl">Instrument Sans body 20</p>
            <p className="text-base text-jera-off/70">Instrument Sans body 16</p>
            <p className="text-sm text-jera-off/50">Instrument Sans caption 14</p>
          </Card>
        </section>

        <section>
          <h2 className="text-sm uppercase tracking-wider text-jera-off/60 mb-4">Buttons</h2>
          <Card className="flex flex-wrap gap-3">
            <Button variant="primary">Primary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="text">Text link</Button>
            <Button variant="danger">Danger</Button>
            <Button size="sm">Small</Button>
            <Button size="lg">Large</Button>
            <Button disabled>Disabled</Button>
          </Card>
        </section>

        <section>
          <h2 className="text-sm uppercase tracking-wider text-jera-off/60 mb-4">Stats</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card><Stat label="Patrimonio total" value="R$ 100M" delta="+5,2% YTD" deltaTone="positive" /></Card>
            <Card><Stat label="Liquido disponivel" value="R$ 22M" hint="22% do total" /></Card>
            <Card><Stat label="Herdeiros" value="3" hint="2 geracoes" /></Card>
            <Card><Stat label="Alerta IPS" value="1" delta="fora da banda" deltaTone="negative" /></Card>
          </div>
        </section>

        <section>
          <h2 className="text-sm uppercase tracking-wider text-jera-off/60 mb-4">Badges</h2>
          <Card className="flex flex-wrap gap-3">
            <Badge variant="neutral">Neutral</Badge>
            <Badge variant="mint">Mint</Badge>
            <Badge variant="teal">Teal</Badge>
            <Badge variant="warn">Warning</Badge>
            <Badge variant="danger">Danger</Badge>
          </Card>
        </section>

        <section>
          <h2 className="text-sm uppercase tracking-wider text-jera-off/60 mb-4">Panel</h2>
          <Panel
            title="Composicao patrimonial"
            description="Snapshot de 22 de abril de 2026"
            action={<Button variant="ghost" size="sm">Ver tudo</Button>}
          >
            <div className="text-jera-off/70">Conteudo do painel aqui.</div>
          </Panel>
        </section>

        <section>
          <h2 className="text-sm uppercase tracking-wider text-jera-off/60 mb-4">Skeleton</h2>
          <Card className="space-y-3">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-24 w-full" />
          </Card>
        </section>
      </div>
    </main>
  )
}
