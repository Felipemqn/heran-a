import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentMember } from '@/lib/current-member'
import { runMonteCarlo } from '@/lib/returns/monte-carlo'
import { backtest } from '@/lib/returns/backtest'
import { BUCKET_IDS, type BucketId } from '@/lib/returns/data'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const BodySchema = z.object({
  weights: z.record(z.string(), z.number().min(0).max(1)),
  initialBrl: z.number().positive(),
  years: z.number().int().min(1).max(50),
  sims: z.number().int().min(50).max(5000).optional(),
  seed: z.number().int().optional(),
})

export async function POST(req: Request) {
  const member = await getCurrentMember()
  if (!member) {
    return NextResponse.json({ error: 'nao autenticado' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'body invalido' }, { status: 400 })
  }

  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'input invalido', issues: parsed.error.issues },
      { status: 400 }
    )
  }

  const sum = BUCKET_IDS.reduce(
    (acc, id) => acc + (parsed.data.weights[id] ?? 0),
    0
  )
  if (Math.abs(sum - 1) > 0.02) {
    return NextResponse.json(
      { error: `pesos somam ${(sum * 100).toFixed(1)}%, esperado 100%` },
      { status: 400 }
    )
  }

  const started = Date.now()
  const weights = parsed.data.weights as Record<BucketId, number>

  const mc = runMonteCarlo({
    weights,
    initialBrl: parsed.data.initialBrl,
    years: parsed.data.years,
    sims: parsed.data.sims ?? 500,
    seed: parsed.data.seed,
  })
  const bt = backtest(weights, parsed.data.initialBrl)

  return NextResponse.json({
    monteCarlo: mc,
    backtest: {
      startDate: bt.startDate,
      endDate: bt.endDate,
      months: bt.months,
      finalValue: bt.finalValue,
      cagr: bt.cagr,
      maxDrawdown: bt.maxDrawdown,
      maxDrawdownStart: bt.maxDrawdownStart,
      maxDrawdownEnd: bt.maxDrawdownEnd,
      worstRolling12m: bt.worstRolling12m,
      worstRolling36mAnnualized: bt.worstRolling36mAnnualized,
      worstRolling60mAnnualized: bt.worstRolling60mAnnualized,
    },
    computeMs: Date.now() - started,
  })
}
