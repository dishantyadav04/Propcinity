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

// Cheaper model for structured JSON ranking tasks
// gpt-4o-mini is 1/15th the cost and equally reliable for JSON-structured output
export async function rankWithOpenAI(prompt: string, systemPrompt: string): Promise<string> {
  const response = await getClient().chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.1,          // low temp = consistent JSON output
    max_tokens: 800,           // needs more tokens for 15 projects
    response_format: { type: 'json_object' },  // forces valid JSON, no markdown
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ],
  })
  return response.choices[0]?.message?.content || '{}'
}
