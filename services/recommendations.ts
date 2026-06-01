// services/recommendations.ts
// Tiered recommendation engine — called ONLY on onboarding finish and profile save
// Never called on every page load

import { Project } from '@/types/project';
import { UserIntent } from '@/types/user';

// Convert a project to a rich text description for embedding
export function projectToEmbeddingText(project: Project): string {
  const price = (project.unitConfigs || [])
    .map((u: any) => `${u.type} at ₹${((u.priceMin || 0) / 100000).toFixed(0)}L`)
    .join(', ');

  return [
    `${project.name} by ${project.builderName || ''} in ${project.location || ''}, ${project.city || 'Pune'}.`,
    project.description || '',
    `Configurations: ${price || 'various'}.`,
    `Status: ${(project.constructionStatus || '').replace(/_/g, ' ')}.`,
    `Amenities: ${(project.amenities || []).join(', ')}.`,
    `Pros: ${(project.pros || []).join(', ')}.`,
  ].filter(Boolean).join(' ').trim();
}

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

// Simple cosine similarity between two vectors
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}
