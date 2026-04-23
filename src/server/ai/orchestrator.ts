import { runAgent, type AgentCallbacks, type AgentContext } from './agent'
import { allocationAgentConfig } from './allocation-agent'

// Orquestrador simples v1: rota tudo para AllocationAgent.
// Em sessões futuras (S10+): decidir entre AllocationAgent, MeetingAgent,
// GenerationalAgent etc. com um classificador leve (keyword match ou
// chamada barata a claude-haiku-4-5).

export async function handleChat(
  ctx: AgentContext,
  userPrompt: string,
  callbacks: AgentCallbacks = {}
) {
  const config = allocationAgentConfig(ctx)
  return runAgent(config, ctx, userPrompt, callbacks)
}
