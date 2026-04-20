import { askClaude } from '@/lib/claude'
import { askOpenAI } from '@/lib/openai'

const TIMEOUT_MS = 5000

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`${label} timeout`)), timeoutMs)
    }),
  ])
}

export async function askAI(
  prompt: string,
  systemPrompt: string
): Promise<{ answer: string; provider: 'openai' | 'claude' | 'none' }> {
  try {
    const answer = await withTimeout(
      askOpenAI(prompt, systemPrompt),
      TIMEOUT_MS,
      'OpenAI'
    )
    if (answer) return { answer, provider: 'openai' }
  } catch (error) {
    console.warn('OpenAI failed, trying Claude', error)
  }

  try {
    const answer = await withTimeout(
      askClaude(prompt, systemPrompt),
      TIMEOUT_MS,
      'Claude'
    )
    if (answer) return { answer, provider: 'claude' }
  } catch (error) {
    console.error('Claude also failed:', error)
  }

  return {
    answer: 'Our AI assistant is temporarily unavailable. Please try again in a moment.',
    provider: 'none',
  }
}
