import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'

export async function getCurrentMember() {
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
