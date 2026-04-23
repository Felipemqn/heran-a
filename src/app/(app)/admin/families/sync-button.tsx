'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface SyncResponse {
  ok?: boolean
  count?: number
  created?: number
  updated?: number
  error?: string
}

export default function SyncHubspotButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<string | null>(null)

  async function handleSync() {
    setLoading(true)
    setStatus(null)
    try {
      const res = await fetch('/api/admin/sync-hubspot', { method: 'POST' })
      const data: SyncResponse = await res.json()
      if (!res.ok) {
        setStatus(`Erro: ${data.error ?? res.statusText}`)
      } else {
        setStatus(
          `Sincronizadas ${data.count ?? 0} familias (${data.created ?? 0} criadas, ${data.updated ?? 0} atualizadas).`
        )
        router.refresh()
      }
    } catch (err) {
      setStatus(err instanceof Error ? `Erro: ${err.message}` : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <Button onClick={handleSync} disabled={loading}>
        {loading ? 'Sincronizando…' : 'Sincronizar HubSpot'}
      </Button>
      {status && (
        <span className="text-xs text-jera-off/60 text-right max-w-xs">{status}</span>
      )}
    </div>
  )
}
