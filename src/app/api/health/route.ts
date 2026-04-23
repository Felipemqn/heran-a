import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const started = Date.now()
  try {
    await db.$queryRaw`SELECT 1`
    return NextResponse.json({
      ok: true,
      uptime: process.uptime(),
      dbLatencyMs: Date.now() - started,
      env: process.env.NODE_ENV,
      commit: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
    })
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : 'database unreachable',
      },
      { status: 503 }
    )
  }
}
