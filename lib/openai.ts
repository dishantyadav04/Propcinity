import OpenAI from 'openai'

function getClient() {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured')
  }

  return new OpenAI({ apiKey })
}

export async function askOpenAI(prompt: string, systemPrompt: string): Promise<string> {
  const response = await getClient().chat.completions.create({
    model: 'gpt-4o',
    temperature: 0.3,
    max_tokens: 400,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ],
  })

  return response.choices[0]?.message?.content || ''
}
