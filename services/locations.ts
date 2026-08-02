import { randomUUID } from 'crypto';
import { createAdminSupabaseClient, createServerSupabaseClient } from '@/lib/supabase-server';
import { City, Locality } from '@/types/location';

type LocationFallbackStore = {
  cities: City[];
  localities: Locality[];
};

const FALLBACK_STORE_KEY = '__propcinity_location_fallback_store__';

function getFallbackStore(): LocationFallbackStore {
  const globalScope = globalThis as typeof globalThis & Record<string, unknown>;
  if (!globalScope[FALLBACK_STORE_KEY]) {
    const seedCities: City[] = [
      { id: 'city-pune', name: 'Pune', state: 'Maharashtra', is_active: true },
      { id: 'city-mumbai', name: 'Mumbai', state: 'Maharashtra', is_active: true },
    ];

    const seedLocalities: Locality[] = [
      { id: 'loc-pune-wakad', city_id: 'city-pune', name: 'Wakad', is_active: true },
      { id: 'loc-pune-hinjewadi', city_id: 'city-pune', name: 'Hinjewadi', is_active: true },
      { id: 'loc-pune-baner', city_id: 'city-pune', name: 'Baner', is_active: true },
      { id: 'loc-pune-balewadi', city_id: 'city-pune', name: 'Balewadi', is_active: true },
      { id: 'loc-pune-kothrud', city_id: 'city-pune', name: 'Kothrud', is_active: true },
      { id: 'loc-pune-kharadi', city_id: 'city-pune', name: 'Kharadi', is_active: true },
      { id: 'loc-pune-viman', city_id: 'city-pune', name: 'Viman Nagar', is_active: true },
      { id: 'loc-pune-koregaon', city_id: 'city-pune', name: 'Koregaon Park', is_active: true },
      { id: 'loc-pune-hadapsar', city_id: 'city-pune', name: 'Hadapsar', is_active: true },
      { id: 'loc-pune-nibm', city_id: 'city-pune', name: 'NIBM', is_active: true },
      { id: 'loc-mumbai-bandra', city_id: 'city-mumbai', name: 'Bandra', is_active: true },
      { id: 'loc-mumbai-andheri', city_id: 'city-mumbai', name: 'Andheri', is_active: true },
      { id: 'loc-mumbai-juhu', city_id: 'city-mumbai', name: 'Juhu', is_active: true },
      { id: 'loc-mumbai-powai', city_id: 'city-mumbai', name: 'Powai', is_active: true },
      { id: 'loc-mumbai-thane', city_id: 'city-mumbai', name: 'Thane', is_active: true },
      { id: 'loc-mumbai-borivali', city_id: 'city-mumbai', name: 'Borivali', is_active: true },
      { id: 'loc-mumbai-dadar', city_id: 'city-mumbai', name: 'Dadar', is_active: true },
      { id: 'loc-mumbai-marine', city_id: 'city-mumbai', name: 'Marine Lines', is_active: true },
      { id: 'loc-mumbai-goregaon', city_id: 'city-mumbai', name: 'Goregaon', is_active: true },
      { id: 'loc-mumbai-vile', city_id: 'city-mumbai', name: 'Vile Parle', is_active: true },
    ];

    globalScope[FALLBACK_STORE_KEY] = { cities: seedCities, localities: seedLocalities };
  }

  return globalScope[FALLBACK_STORE_KEY] as LocationFallbackStore;
}

function hasSupabaseConfig(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

// ─── READ (public anon key is fine for SELECT with is_active=true RLS) ─────────

/** Fetch all active cities (public read). */
export async function getCities(): Promise<City[]> {
  if (!hasSupabaseConfig()) {
    const store = getFallbackStore();
    return store.cities.filter((city) => city.is_active).sort((a, b) => a.name.localeCompare(b.name));
  }

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
  if (!hasSupabaseConfig()) {
    const store = getFallbackStore();
    return store.localities
      .filter((locality) => locality.city_id === cityId && locality.is_active)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

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
  if (!hasSupabaseConfig()) {
    const store = getFallbackStore();
    const city: City = {
      id: randomUUID(),
      name: name.trim(),
      state: state?.trim() || undefined,
      is_active: true,
    };
    store.cities.push(city);
    store.cities.sort((a, b) => a.name.localeCompare(b.name));
    return city;
  }

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
  if (!hasSupabaseConfig()) {
    const store = getFallbackStore();
    const city = store.cities.find((item) => item.id === id);
    if (!city) throw new Error('City not found');
    if (updates.name !== undefined) city.name = updates.name.trim();
    if (updates.state !== undefined) city.state = updates.state?.trim() || undefined;
    if (updates.is_active !== undefined) city.is_active = updates.is_active;
    store.cities.sort((a, b) => a.name.localeCompare(b.name));
    return;
  }

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
  if (!hasSupabaseConfig()) {
    const store = getFallbackStore();
    store.cities = store.cities.filter((item) => item.id !== id);
    store.localities = store.localities.filter((item) => item.city_id !== id);
    return;
  }

  const supabase = createAdminSupabaseClient();
  if (!supabase) throw new Error('Supabase admin client unavailable');
  const { error } = await supabase.from('cities').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

/** Create a locality under a city (admin-only). */
export async function createLocality(cityId: string, name: string): Promise<Locality> {
  if (!hasSupabaseConfig()) {
    const store = getFallbackStore();
    const locality: Locality = {
      id: randomUUID(),
      city_id: cityId,
      name: name.trim(),
      is_active: true,
    };
    store.localities.push(locality);
    store.localities.sort((a, b) => a.name.localeCompare(b.name));
    return locality;
  }

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
  if (!hasSupabaseConfig()) {
    const store = getFallbackStore();
    const locality = store.localities.find((item) => item.id === id);
    if (!locality) throw new Error('Locality not found');
    if (updates.name !== undefined) locality.name = updates.name.trim();
    if (updates.is_active !== undefined) locality.is_active = updates.is_active;
    store.localities.sort((a, b) => a.name.localeCompare(b.name));
    return;
  }

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
  if (!hasSupabaseConfig()) {
    const store = getFallbackStore();
    store.localities = store.localities.filter((item) => item.id !== id);
    return;
  }

  const supabase = createAdminSupabaseClient();
  if (!supabase) throw new Error('Supabase admin client unavailable');
  const { error } = await supabase.from('localities').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
