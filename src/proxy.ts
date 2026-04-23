import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse, type NextRequest } from 'next/server'
import { AUTH_DISABLED } from '@/lib/auth-mode'

const isPublic = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
  '/api/health',
])

const clerk = clerkMiddleware(async (auth, req) => {
  if (!isPublic(req)) {
    await auth.protect()
  }
})

export default AUTH_DISABLED
  ? (_req: NextRequest) => {
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.warn('[auth-mode] NEXT_PUBLIC_DISABLE_AUTH=1 — auth bypassada em dev')
      }
      return NextResponse.next()
    }
  : clerk

export const config = {
  matcher: ['/((?!_next|.*\\..*).*)', '/(api|trpc)(.*)'],
}
