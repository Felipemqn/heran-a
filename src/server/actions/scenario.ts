'use server'

import { z } from 'zod'
import { db } from '@/lib/db'
import { getCurrentMember } from '@/lib/current-member'
import { BUCKET_IDS } from '@/lib/returns/data'

const SaveSchema = z.object({
  name: z.string().min(1).max(120),
  weights: z.record(z.string(), z.number().min(0).max(100)),
  initialBrl: z.number().positive(),
  years: z.number().int().min(1).max(50),
})

export interface SaveScenarioResult {
  ok: boolean
  scenarioId?: string
  error?: string
}

export async function saveScenario(input: unknown): Promise<SaveScenarioResult> {
  const parsed = SaveSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: 'input invalido' }
  }
  const member = await getCurrentMember()
  if (!member) return { ok: false, error: 'nao autenticado' }

  const sum = BUCKET_IDS.reduce((acc, id) => acc + (parsed.data.weights[id] ?? 0), 0)
  if (Math.abs(sum - 100) > 1) {
    return { ok: false, error: `pesos somam ${sum.toFixed(2)}%, esperado ~100%` }
  }

  const scenario = await db.scenario.create({
    data: {
      familyId: member.familyId,
      name: parsed.data.name,
      kind: 'deterministic',
      allocation: parsed.data.weights,
      initialBrl: parsed.data.initialBrl,
      years: parsed.data.years,
      createdBy: member.clerkUserId,
    },
  })

  return { ok: true, scenarioId: scenario.id }
}
