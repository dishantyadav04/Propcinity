import { createClient } from '@/lib/supabase';

/**
 * Saves the user's intent to Supabase user_intents table.
 * Uses upsert (user_id is UNIQUE) so it's safe to call on every update.
 * Silently fails — localStorage is always the source of truth for reads.
 */
export async function syncIntentToSupabase(intent: Record<string, any>): Promise<void> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('user_intents').upsert({
      user_id: user.id,
      intent_data: intent,
      budget_min: intent.budget?.min ?? null,
      budget_max: intent.budget?.isOpenMax ? null : (intent.budget?.max ?? null),
      city: intent.city ?? null,
      bhk_types: intent.bhkType ?? [],
      purpose: intent.purpose ?? null,
      timeline: intent.timeline ?? null,
      work_location: intent.workLocation ?? null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
  } catch {
    // Silent fail — localStorage still works
  }
}

/**
 * Fetches the user's intent from Supabase and returns it.
 * Returns null if not found or on error.
 */
export async function fetchIntentFromSupabase(): Promise<Record<string, any> | null> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('user_intents')
      .select('intent_data')
      .eq('user_id', user.id)
      .single();

    if (error || !data?.intent_data) return null;
    return data.intent_data;
  } catch {
    return null;
  }
}
