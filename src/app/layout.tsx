import type { Metadata } from 'next'
import { Fraunces, Instrument_Sans } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import { ptBR } from '@clerk/localizations'
import { AUTH_DISABLED } from '@/lib/auth-mode'
import './globals.css'

const fraunces = Fraunces({
  variable: '--font-fraunces',
  subsets: ['latin'],
  display: 'swap',
})

const instrumentSans = Instrument_Sans({
  variable: '--font-instrument-sans',
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Jera Horizonte',
  description: 'Plataforma de gestão patrimonial para multi-family office',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const html = (
    <html
      lang="pt-BR"
      className={`${fraunces.variable} ${instrumentSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-jera-black text-jera-off">
        {AUTH_DISABLED && (
          <div className="bg-amber-500/20 border-b border-amber-500/40 text-amber-200 text-xs text-center py-1">
            Modo DEV: autenticação desativada (NEXT_PUBLIC_DISABLE_AUTH=1)
          </div>
        )}
        {children}
      </body>
    </html>
  )

  return AUTH_DISABLED ? html : <ClerkProvider localization={ptBR}>{html}</ClerkProvider>
}
