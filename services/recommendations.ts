// services/recommendations.ts
// Tiered recommendation engine — called ONLY on onboarding finish and profile save
// Never called on every page load

import { UserIntent } from '@/types/user';

// Convert user intent to a search query text for embedding
export function intentToEmbeddingText(intent: UserIntent): string {
  const budgetMin = intent.budget?.min ? `₹${(intent.budget.min / 100000).toFixed(0)}L` : '';
  const budgetMax = intent.budget?.isOpenMax ? 'open budget' : intent.budget?.max ? `₹${(intent.budget.max / 100000).toFixed(0)}L` : '';

  return [
    `Looking for ${(intent.bhkType || []).join(' or ')} ${(intent.propertyType || []).join(' or ')}`,
    `in ${(intent.subLocations || []).join(', ') || intent.city || 'Pune'}.`,
    `Budget: ${budgetMin} to ${budgetMax}.`,
    `Purpose: ${intent.purpose || 'self-use'}.`,
    `Timeline: ${(intent.timeline || '').replace(/_/g, ' ')}.`,
    intent.preferences?.length ? `Preferences: ${intent.preferences.join(', ')}.` : '',
  ].filter(Boolean).join(' ').trim();
}

// Generate embedding via OpenAI — called server-side only
export async function generateEmbedding(text: string): Promise<number[] | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: text.slice(0, 8000),
      }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data.data?.[0]?.embedding || null;
  } catch {
    return null;
  }
}
