import { NextResponse } from 'next/server'
import { getCurrentMember } from '@/lib/current-member'
import { listFamilyClients, syncClientToFamily } from '@/server/integrations/hubspot'

export async function POST() {
  const member = await getCurrentMember()
  if (!member) {
    return NextResponse.json({ error: 'nao autenticado' }, { status: 401 })
  }

  if (member.role !== 'advisor') {
    return NextResponse.json({ error: 'acesso restrito a advisors' }, { status: 403 })
  }

  const userId = member.clerkUserId

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
