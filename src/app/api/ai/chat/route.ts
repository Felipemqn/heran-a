import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { handleChat } from '@/server/ai/orchestrator'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const BodySchema = z.object({
  prompt: z.string().min(1).max(4000),
})

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'nao autenticado' }, { status: 401 })
  }

  const member = await db.member.findUnique({
    where: { clerkUserId: userId },
    include: { family: true },
  })
  if (!member) {
    return NextResponse.json({ error: 'membro nao encontrado' }, { status: 403 })
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
      { error: 'prompt invalido', issues: parsed.error.issues },
      { status: 400 }
    )
  }

  const encoder = new TextEncoder()
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (obj: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`))
      }

      try {
        await handleChat(
          {
            familyId: member.familyId,
            familyName: member.family.name,
            actorClerkUserId: userId,
            agentName: 'AllocationAgent',
          },
          parsed.data.prompt,
          {
            onText: (delta) => send({ type: 'text', delta }),
            onToolUse: (name, input) => send({ type: 'tool_use', name, input }),
            onToolResult: (name) => send({ type: 'tool_result', name }),
          }
        )
        send({ type: 'done' })
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'erro desconhecido'
        send({ type: 'error', message: msg })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}
