import { Panel } from '@/components/ui/panel'
import AllocationSliders from '@/components/modules/allocation-sliders'

const DEFAULT_PROFILE = 'br_intl_moderado'

export default function AllocationPage() {
  return (
    <div className="flex flex-col gap-8">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl text-jera-mint">Simulador de alocação</h1>
          <p className="text-jera-off/60 mt-1">
            Base: 14 anos de retornos mensais (2012–2026). Perfis do Simulador Jera.
          </p>
        </div>
      </header>

      <AllocationSliders defaultProfileId={DEFAULT_PROFILE} />

      <Panel
        title="Metodologia"
        description="Como os números são calculados"
      >
        <ul className="text-sm text-jera-off/70 space-y-2 list-disc pl-5">
          <li>
            Retorno esperado e volatilidade vêm da série mensal 2012-01 a 2026-02
            agregada em 8 buckets (BR vs Intl × Cash+RF / RV / Alts / RE).
          </li>
          <li>
            Anualização: retorno composto via (1+r)<sup>12</sup> − 1; vol via σ·√12.
          </li>
          <li>
            Volatilidade do portfólio usa matriz de covariância completa (não assume
            independência).
          </li>
          <li>
            Sharpe simplificado vs risk-free = 0 — usar com cautela; a versão com
            CDI/Treasury entra na Etapa 4.
          </li>
          <li>
            Monte Carlo estocástico e drawdown histórico chegam na Etapa 4.
          </li>
        </ul>
      </Panel>
    </div>
  )
}
