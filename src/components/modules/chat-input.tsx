'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Sparkles } from 'lucide-react'
import { Panel } from '@/components/ui/panel'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface StreamEvent {
  type: 'text' | 'tool_use' | 'tool_result' | 'done' | 'error'
  delta?: string
  name?: string
  input?: unknown
  message?: string
}

type Status = 'idle' | 'streaming' | 'error'

export default function ChatInput() {
  const [prompt, setPrompt] = useState('')
  const [answer, setAnswer] = useState('')
  const [toolEvents, setToolEvents] = useState<string[]>([])
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => () => abortRef.current?.abort(), [])

  async function ask() {
    const text = prompt.trim()
    if (!text || status === 'streaming') return

    setAnswer('')
    setToolEvents([])
    setErrorMsg(null)
    setStatus('streaming')

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ prompt: text }),
        signal: controller.signal,
      })
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? `HTTP ${res.status}`)
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        let idx: number
        while ((idx = buffer.indexOf('\n\n')) !== -1) {
          const frame = buffer.slice(0, idx).trim()
          buffer = buffer.slice(idx + 2)
          if (!frame.startsWith('data:')) continue
          const jsonStr = frame.slice(5).trim()
          try {
            const evt = JSON.parse(jsonStr) as StreamEvent
            handleEvent(evt)
          } catch {
            /* ignore malformed frame */
          }
        }
      }
      setStatus('idle')
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      setErrorMsg(err instanceof Error ? err.message : 'Falha inesperada')
      setStatus('error')
    }
  }

  function handleEvent(evt: StreamEvent) {
    if (evt.type === 'text' && evt.delta) {
      setAnswer((prev) => prev + evt.delta)
    } else if (evt.type === 'tool_use' && evt.name) {
      setToolEvents((prev) => [...prev, `↳ consultando ${evt.name}…`])
    } else if (evt.type === 'error') {
      setErrorMsg(evt.message ?? 'erro')
      setStatus('error')
    }
  }

  return (
    <Panel
      title="Consultor IA"
      description="Pergunte sobre alocação, projeções ou concentrações do portfólio"
      action={<Sparkles className="size-4 text-jera-mint" aria-hidden />}
    >
      <div className="flex flex-col gap-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && ask()}
            placeholder="Ex: Qual minha alocação atual? Quanto rende em 10 anos?"
            className={cn(
              'flex-1 h-11 px-4 rounded-lg bg-jera-night border border-jera-off/10',
              'text-jera-off placeholder:text-jera-off/40',
              'focus:outline-none focus:ring-2 focus:ring-jera-mint/50 focus:border-jera-mint/40'
            )}
            disabled={status === 'streaming'}
          />
          <Button
            onClick={ask}
            disabled={status === 'streaming' || !prompt.trim()}
            size="md"
          >
            <Send className="size-4" />
            {status === 'streaming' ? 'Pensando…' : 'Perguntar'}
          </Button>
        </div>

        {toolEvents.length > 0 && (
          <ul className="text-xs text-jera-off/50 space-y-1">
            {toolEvents.map((msg, i) => (
              <li key={i}>{msg}</li>
            ))}
          </ul>
        )}

        {answer && (
          <div className="rounded-lg bg-jera-night/60 p-4 text-sm text-jera-off/90 whitespace-pre-wrap leading-relaxed">
            {answer}
          </div>
        )}

        {errorMsg && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-300">
            {errorMsg}
          </div>
        )}
      </div>
    </Panel>
  )
}
