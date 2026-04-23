import Anthropic from '@anthropic-ai/sdk'
import { db } from '@/lib/db'

const MODEL = 'claude-opus-4-7'

function anthropic(): Anthropic {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) throw new Error('ANTHROPIC_API_KEY nao configurada')
  return new Anthropic({ apiKey: key })
}

export interface AgentContext {
  familyId: string
  familyName: string
  actorClerkUserId: string | null
  agentName: string
}

export type ToolHandler = (
  name: string,
  input: Record<string, unknown>,
  ctx: AgentContext
) => Promise<string>

export interface AgentConfig {
  name: string
  systemPrompt: string
  tools: Anthropic.Messages.Tool[]
  toolHandler: ToolHandler
}

export interface AgentCallbacks {
  onText?: (delta: string) => void
  onToolUse?: (name: string, input: Record<string, unknown>) => void
  onToolResult?: (name: string, result: string) => void
  onError?: (err: unknown) => void
}

// Roda o loop agent → tool → agent → ... ate end_turn.
// Streama texto via onText. Audita cada interacao em AiInteraction.
export async function runAgent(
  config: AgentConfig,
  ctx: AgentContext,
  userPrompt: string,
  callbacks: AgentCallbacks = {}
): Promise<{ text: string; tokensIn: number; tokensOut: number }> {
  const client = anthropic()

  const messages: Anthropic.Messages.MessageParam[] = [
    { role: 'user', content: userPrompt },
  ]

  let totalIn = 0
  let totalOut = 0
  let finalText = ''

  // Loop agentic manual: permite streaming incremental e audit log por turn.
  for (let turn = 0; turn < 10; turn++) {
    let assistantBlocks: Anthropic.Messages.ContentBlock[] = []
    let stopReason: string | null = null
    let turnText = ''

    const stream = client.messages.stream({
      model: MODEL,
      max_tokens: 16000,
      thinking: { type: 'adaptive' },
      system: [
        {
          type: 'text',
          text: config.systemPrompt,
          cache_control: { type: 'ephemeral' },
        },
      ],
      tools: config.tools,
      messages,
    })

    stream.on('text', (delta) => {
      turnText += delta
      callbacks.onText?.(delta)
    })

    const final = await stream.finalMessage()
    assistantBlocks = final.content
    stopReason = final.stop_reason
    totalIn += final.usage.input_tokens ?? 0
    totalOut += final.usage.output_tokens ?? 0

    messages.push({ role: 'assistant', content: assistantBlocks })

    if (stopReason !== 'tool_use') {
      finalText = turnText
      break
    }

    // Executa tools pedidas pelo modelo
    const toolUses = assistantBlocks.filter(
      (b): b is Anthropic.Messages.ToolUseBlock => b.type === 'tool_use'
    )
    const toolResults: Anthropic.Messages.ToolResultBlockParam[] = []

    for (const tu of toolUses) {
      callbacks.onToolUse?.(tu.name, tu.input as Record<string, unknown>)
      try {
        const result = await config.toolHandler(
          tu.name,
          tu.input as Record<string, unknown>,
          ctx
        )
        callbacks.onToolResult?.(tu.name, result)
        toolResults.push({
          type: 'tool_result',
          tool_use_id: tu.id,
          content: result,
        })
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        callbacks.onError?.(err)
        toolResults.push({
          type: 'tool_result',
          tool_use_id: tu.id,
          content: `Erro ao executar tool: ${msg}`,
          is_error: true,
        })
      }
    }

    messages.push({ role: 'user', content: toolResults })
  }

  // Audit log da interacao completa
  await db.aiInteraction.create({
    data: {
      familyId: ctx.familyId,
      actorId: ctx.actorClerkUserId,
      agent: config.name,
      prompt: userPrompt,
      response: finalText,
      tokensIn: totalIn,
      tokensOut: totalOut,
    },
  })

  return { text: finalText, tokensIn: totalIn, tokensOut: totalOut }
}
