import { NextRequest, NextResponse } from 'next/server';
import { generateEmbedding, intentToEmbeddingText } from '@/services/recommendations';

// POST /api/ai/embed
// Called ONCE after onboarding completion or profile preference update
// Returns a ranked list of project IDs based on vector similarity
// Falls back to empty array if OpenAI is unavailable — client uses JS scorer

const RECO_CACHE_KEY = 'propcinity_reco_cache';

// Simple in-memory cache for embeddings (resets on server restart, that's fine)
const embeddingCache = new Map<string, { embedding: number[]; ts: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
const MAX_EMBEDDING_CACHE_SIZE = 100;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body?.intent) {
      return NextResponse.json({ error: 'Missing intent' }, { status: 400 });
    }

    const { intent } = body;
    
    // Generate a stable hash for this intent
    const intentText = intentToEmbeddingText(intent);
    const intentHash = Buffer.from(intentText).toString('base64').slice(0, 40);

    // Check in-memory cache first
    const cached = embeddingCache.get(intentHash);
    let intentEmbedding: number[] | null = null;

    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      intentEmbedding = cached.embedding;
    } else {
      intentEmbedding = await generateEmbedding(intentText);
      if (intentEmbedding) {
        embeddingCache.set(intentHash, { embedding: intentEmbedding, ts: Date.now() });
        if (embeddingCache.size > MAX_EMBEDDING_CACHE_SIZE) {
          const oldest = [...embeddingCache.entries()].sort((a, b) => a[1].ts - b[1].ts)[0];
          if (oldest) embeddingCache.delete(oldest[0]);
        }
      }
    }

    if (!intentEmbedding) {
      // OpenAI unavailable — return empty so client falls back to JS scorer
      return NextResponse.json({ recommendedIds: [], source: 'fallback' });
    }

    // Fetch all published projects and their embeddings from Supabase
    const projectsRes = await fetch(
      `${request.nextUrl.origin}/api/projects`,
      { next: { revalidate: 300 } }
    );
    
    if (!projectsRes.ok) {
      return NextResponse.json({ recommendedIds: [], source: 'fallback' });
    }

    // Projects without embeddings get scored by JS fallback on client
    // Projects WITH embeddings get vector-ranked here
    // Note: embeddings are not in the /api/projects response by default
    // For now, return empty and let client use JS scorer
    // TODO: after running the one-time embedding script, add embeddings to projects table
    // and fetch them here via Supabase directly
    
    return NextResponse.json({ 
      recommendedIds: [], 
      source: 'js_scorer',
      intentHash 
    });

  } catch (err) {
    console.error('Embed API error:', err);
    return NextResponse.json({ recommendedIds: [], source: 'error' });
  }
}
