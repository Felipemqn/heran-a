import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: Request) {
  const secret = process.env.CLERK_WEBHOOK_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'missing CLERK_WEBHOOK_SECRET' }, { status: 500 })
  }

  const headerPayload = await headers()
  const svixId = headerPayload.get('svix-id')
  const svixTimestamp = headerPayload.get('svix-timestamp')
  const svixSignature = headerPayload.get('svix-signature')

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: 'missing svix headers' }, { status: 400 })
  }

  const body = await req.text()
  const wh = new Webhook(secret)

  let event: { type: string; data: Record<string, unknown> }
  try {
    event = wh.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as typeof event
  } catch {
    return NextResponse.json({ error: 'invalid signature' }, { status: 401 })
  }

  if (event.type === 'user.created' || event.type === 'user.updated') {
    const userId = event.data.id as string
    const email =
      (event.data.email_addresses as Array<{ email_address: string }> | undefined)?.[0]
        ?.email_address ?? null
    const firstName = (event.data.first_name as string | null) ?? ''
    const lastName = (event.data.last_name as string | null) ?? ''
    const name = `${firstName} ${lastName}`.trim() || (email ?? 'Novo membro')

    const existing = await db.member.findUnique({ where: { clerkUserId: userId } })

    if (existing) {
      await db.member.update({
        where: { clerkUserId: userId },
        data: { email, name },
      })
    } else {
      // Novo membro: dev auto-assigna a "Familia Teste".
      // Em producao, um advisor convida o membro antes da criacao do clerk user.
      const familyId = await resolveDefaultFamilyId()
      await db.member.create({
        data: {
          clerkUserId: userId,
          email,
          name,
          familyId,
          role: 'observer',
          generation: 'heir',
        },
      })
    }
  }

  if (event.type === 'user.deleted') {
    const userId = event.data.id as string
    await db.member.updateMany({
      where: { clerkUserId: userId },
      data: { deletedAt: new Date(), clerkUserId: null },
    })
  }

  return NextResponse.json({ ok: true })
}

async function resolveDefaultFamilyId(): Promise<string> {
  if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_AUTO_FAMILY) {
    throw new Error(
      'Auto-atribuicao a Familia Teste esta bloqueada em producao. Definir ALLOW_AUTO_FAMILY=1 ou invocar fluxo de convite.'
    )
  }

  const family = await db.family.findFirst({
    where: { slug: 'familia-teste' },
    select: { id: true },
  })
  if (family) return family.id

  const created = await db.family.create({
    data: { name: 'Familia Teste', slug: 'familia-teste' },
    select: { id: true },
  })
  return created.id
}
