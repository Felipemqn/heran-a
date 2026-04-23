import { UserButton } from '@clerk/nextjs'
import Link from 'next/link'

interface Props {
  familyName: string
  children: React.ReactNode
}

export default function ProtectedShell({ familyName, children }: Props) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 backdrop-blur bg-jera-black/80 border-b border-jera-off/10">
        <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="font-serif text-xl text-jera-mint">
              Horizonte
            </Link>
            <nav className="hidden md:flex items-center gap-6 text-sm text-jera-off/70">
              <Link href="/dashboard" className="hover:text-jera-off">Panorama</Link>
              <Link href="/allocation" className="hover:text-jera-off">Alocacao</Link>
              <Link href="/generational" className="hover:text-jera-off">Geracional</Link>
              <Link href="/governance" className="hover:text-jera-off">Governanca</Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline text-sm text-jera-off/60">{familyName}</span>
            <UserButton />
          </div>
        </div>
      </header>
      <main className="flex-1 mx-auto w-full max-w-7xl px-6 py-10">{children}</main>
    </div>
  )
}
