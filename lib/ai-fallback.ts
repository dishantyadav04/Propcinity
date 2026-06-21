import { askOpenAI, rankWithOpenAI } from '@/lib/openai'

const TIMEOUT_MS = 5000

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout>
  return Promise.race([
    promise.finally(() => clearTimeout(timer)),
    new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error(`${label} timeout`)), timeoutMs)
    }),
  ])
}

export async function askAI(
  prompt: string,
  systemPrompt: string
): Promise<{ answer: string; provider: 'openai' | 'none' }> {
  try {
    const answer = await withTimeout(
      askOpenAI(prompt, systemPrompt),
      TIMEOUT_MS,
      'OpenAI'
    )
    if (answer) return { answer, provider: 'openai' }
  } catch (error) {
    console.error('OpenAI failed:', error)
  }

  return {
    answer: 'Our AI assistant is temporarily unavailable. Please try again in a moment.',
    provider: 'none',
  }
}

// Separate fallback for ranking — higher timeout, returns empty object on failure
export async function rankAI(
  prompt: string,
  systemPrompt: string
): Promise<{ answer: string; provider: 'openai' | 'none' }> {
  try {
    const answer = await withTimeout(
      rankWithOpenAI(prompt, systemPrompt),
      8000,           // 8s timeout — ranking prompt is larger than chat
      'OpenAI Rank'
    )
    if (answer && answer !== '{}') return { answer, provider: 'openai' }
  } catch (error) {
    console.error('[ai-fallback] rankAI failed:', error)
  }
  return { answer: '{}', provider: 'none' }
}
