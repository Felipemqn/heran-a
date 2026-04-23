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

    await db.member.upsert({
      where: { clerkUserId: userId },
      update: { email, name },
      create: {
        clerkUserId: userId,
        email,
        name,
        // Default: primeiro acesso entra como observer na familia de teste
        familyId: await resolveDefaultFamilyId(),
        role: 'observer',
        generation: 'heir',
      },
    })
  }

  return NextResponse.json({ ok: true })
}

async function resolveDefaultFamilyId(): Promise<string> {
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
