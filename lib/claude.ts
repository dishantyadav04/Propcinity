import Anthropic from '@anthropic-ai/sdk'

function getClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured')
  }

  return new Anthropic({ apiKey })
}

export async function askClaude(prompt: string, systemPrompt: string): Promise<string> {
  const response = await getClient().messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 400,
    system: systemPrompt,
    messages: [{ role: 'user', content: prompt }],
  })

  const block = response.content[0]
  return block?.type === 'text' ? block.text : ''
}
