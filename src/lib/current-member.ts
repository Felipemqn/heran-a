import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { AUTH_DISABLED, MOCK_CLERK_USER_ID, MOCK_MEMBER_NAME } from '@/lib/auth-mode'

export async function getCurrentMember() {
  if (AUTH_DISABLED) {
    return resolveDevMember()
  }

  const { userId } = await auth()
  if (!userId) return null

  return db.member.findUnique({
    where: { clerkUserId: userId },
    include: { family: true },
  })
}

export async function requireCurrentMember() {
  const member = await getCurrentMember()
  if (!member) {
    throw new Error('Membro nao encontrado para o usuario autenticado')
  }
  return member
}

// Dev fallback: linka um Member da Familia Silva ao MOCK_CLERK_USER_ID.
// Cria on-the-fly se nao existir — facilita o primeiro run.
async function resolveDevMember() {
  const existing = await db.member.findUnique({
    where: { clerkUserId: MOCK_CLERK_USER_ID },
    include: { family: true },
  })
  if (existing) return existing

  const family = await db.family.findFirst({
    where: { slug: 'familia-silva' },
  })
  if (!family) return null

  return db.member.create({
    data: {
      clerkUserId: MOCK_CLERK_USER_ID,
      familyId: family.id,
      name: MOCK_MEMBER_NAME,
      role: 'advisor',
      generation: 'founder',
      email: 'dev@jera.local',
    },
    include: { family: true },
  })
}
