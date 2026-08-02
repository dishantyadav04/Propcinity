import { createAdminSupabaseClient, createServerSupabaseClient } from '@/lib/supabase-server';
import { City, Locality } from '@/types/location';

// ─── READ (public anon key is fine for SELECT with is_active=true RLS) ─────────

/** Fetch all active cities (public read). */
export async function getCities(): Promise<City[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('cities')
    .select('id, name, state, is_active')
    .eq('is_active', true)
    .order('name');
  if (error) {
    console.error('[locations] getCities error:', error);
    return [];
  }
  return (data ?? []) as City[];
}

/** Fetch all active localities for a given city (public read). */
export async function getLocalitiesByCity(cityId: string): Promise<Locality[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('localities')
    .select('id, city_id, name, is_active')
    .eq('city_id', cityId)
    .eq('is_active', true)
    .order('name');
  if (error) {
    console.error('[locations] getLocalitiesByCity error:', error);
    return [];
  }
  return (data ?? []) as Locality[];
}

// ─── ADMIN WRITES (service role, bypasses RLS) ───────────────────────────────

/** Create a new city (admin-only). Returns the created city or throws. */
export async function createCity(name: string, state?: string): Promise<City> {
  const supabase = createAdminSupabaseClient();
  if (!supabase) throw new Error('Supabase admin client unavailable');
  const { data, error } = await supabase
    .from('cities')
    .insert({ name: name.trim(), state: state?.trim() || null })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as City;
}

/** Update a city's name/state or toggle is_active (admin-only). */
export async function updateCity(
  id: string,
  updates: Partial<Pick<City, 'name' | 'state' | 'is_active'>>
): Promise<void> {
  const supabase = createAdminSupabaseClient();
  if (!supabase) throw new Error('Supabase admin client unavailable');
  const payload: Record<string, unknown> = {};
  if (updates.name !== undefined) payload.name = updates.name.trim();
  if (updates.state !== undefined) payload.state = updates.state?.trim() || null;
  if (updates.is_active !== undefined) payload.is_active = updates.is_active;
  const { error } = await supabase.from('cities').update(payload).eq('id', id);
  if (error) throw new Error(error.message);
}

/** Delete a city (cascades to localities via FK). Admin-only. */
export async function deleteCity(id: string): Promise<void> {
  const supabase = createAdminSupabaseClient();
  if (!supabase) throw new Error('Supabase admin client unavailable');
  const { error } = await supabase.from('cities').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

/** Create a locality under a city (admin-only). */
export async function createLocality(cityId: string, name: string): Promise<Locality> {
  const supabase = createAdminSupabaseClient();
  if (!supabase) throw new Error('Supabase admin client unavailable');
  const { data, error } = await supabase
    .from('localities')
    .insert({ city_id: cityId, name: name.trim() })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Locality;
}

/** Update a locality's name or toggle is_active (admin-only). */
export async function updateLocality(
  id: string,
  updates: Partial<Pick<Locality, 'name' | 'is_active'>>
): Promise<void> {
  const supabase = createAdminSupabaseClient();
  if (!supabase) throw new Error('Supabase admin client unavailable');
  const payload: Record<string, unknown> = {};
  if (updates.name !== undefined) payload.name = updates.name.trim();
  if (updates.is_active !== undefined) payload.is_active = updates.is_active;
  const { error } = await supabase.from('localities').update(payload).eq('id', id);
  if (error) throw new Error(error.message);
}

/** Delete a locality (admin-only). */
export async function deleteLocality(id: string): Promise<void> {
  const supabase = createAdminSupabaseClient();
  if (!supabase) throw new Error('Supabase admin client unavailable');
  const { error } = await supabase.from('localities').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
