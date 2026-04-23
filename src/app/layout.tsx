import type { Metadata } from 'next'
import { Fraunces, Instrument_Sans } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import { ptBR } from '@clerk/localizations'
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
  return (
    <ClerkProvider localization={ptBR}>
      <html
        lang="pt-BR"
        className={`${fraunces.variable} ${instrumentSans.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col bg-jera-black text-jera-off">
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}
