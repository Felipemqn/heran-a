import ProtectedShell from '@/components/protected-shell'
import { getCurrentMember } from '@/lib/current-member'
import { getMockOverview } from '@/server/queries/family-overview'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Em dev sem banco/Clerk, cai no overview mockado.
  let familyName = getMockOverview().family.name
  try {
    const member = await getCurrentMember()
    if (member) familyName = member.family.name
  } catch {
    // DB indisponivel em dev; mantem fallback.
  }

  return <ProtectedShell familyName={familyName}>{children}</ProtectedShell>
}
