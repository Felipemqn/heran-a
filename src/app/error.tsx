'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Global error boundary:', error)
  }, [error])

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="font-serif text-4xl text-jera-mint">Algo saiu fora do caminho</h1>
      <p className="max-w-md text-jera-off/70">
        Um erro inesperado ocorreu. A equipe ja foi notificada. Voce pode tentar
        novamente ou voltar a tela anterior.
      </p>
      <Button onClick={reset}>Tentar novamente</Button>
    </main>
  )
}
