import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { listFamilyClients, syncClientToFamily } from '@/server/integrations/hubspot'

export async function POST() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'nao autenticado' }, { status: 401 })
  }

  // Apenas advisors podem disparar sync.
  const member = await db.member.findUnique({
    where: { clerkUserId: userId },
    select: { role: true },
  })
  if (member?.role !== 'advisor') {
    return NextResponse.json({ error: 'acesso restrito a advisors' }, { status: 403 })
  }

  try {
    const contacts = await listFamilyClients()
    const results = []
    for (const c of contacts) {
      results.push(await syncClientToFamily(c, userId))
    }

    return NextResponse.json({
      ok: true,
      count: results.length,
      created: results.filter((r) => r.created).length,
      updated: results.filter((r) => r.updated).length,
      results,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'erro desconhecido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
