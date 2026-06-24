export interface NearbyPlace {
  id: number
  name: string
  type: 'it_park' | 'metro' | 'school' | 'hospital' | 'mall' | 'park'
  lat: number
  lng: number
  distance?: number
  tags?: Record<string, string>
}

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://lz4.overpass-api.de/api/interpreter',
  'https://z.overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.osm.ch/api/interpreter',
]

function buildOverpassQuery(lat: number, lng: number, radiusMeters: number): string {
  return `
    [out:json][timeout:25];
    (
      node["office"="it_park"](around:${radiusMeters},${lat},${lng});
      way["office"="it_park"](around:${radiusMeters},${lat},${lng});
      node["landuse"="industrial"]["name"~"IT|Tech|Software|Techno",i](around:${radiusMeters},${lat},${lng});
      way["landuse"="industrial"]["name"~"IT|Tech|Software|Techno",i](around:${radiusMeters},${lat},${lng});
      node["railway"="station"](around:${radiusMeters},${lat},${lng});
      node["railway"="halt"](around:${radiusMeters},${lat},${lng});
      node["public_transport"="station"](around:${radiusMeters},${lat},${lng});
      node["amenity"="school"](around:${radiusMeters},${lat},${lng});
      way["amenity"="school"](around:${radiusMeters},${lat},${lng});
      node["amenity"="hospital"](around:${radiusMeters},${lat},${lng});
      node["amenity"="clinic"](around:${radiusMeters},${lat},${lng});
      way["amenity"="hospital"](around:${radiusMeters},${lat},${lng});
      node["shop"="mall"](around:${radiusMeters},${lat},${lng});
      way["shop"="mall"](around:${radiusMeters},${lat},${lng});
      node["building"="mall"](around:${radiusMeters},${lat},${lng});
      node["leisure"="park"](around:${radiusMeters},${lat},${lng});
      way["leisure"="park"](around:${radiusMeters},${lat},${lng});
    );
    out center;
  `
}

function classifyPlace(tags: Record<string, string>): NearbyPlace['type'] {
  if (
    tags.office === 'it_park' ||
    (/IT|Tech|Software|Techno/i.test(tags.name || '') && tags.landuse === 'industrial')
  ) return 'it_park'
  if (tags.railway === 'station' || tags.railway === 'halt' || tags.public_transport === 'station') return 'metro'
  if (tags.amenity === 'school') return 'school'
  if (tags.amenity === 'hospital' || tags.amenity === 'clinic') return 'hospital'
  if (tags.shop === 'mall' || tags.building === 'mall') return 'mall'
  return 'park'
}

function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const earthRadius = 6371000
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2

  return Math.round(earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)))
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${meters}m`
  return `${(meters / 1000).toFixed(1)}km`
}

function getFallbackPlaces(lat: number, lng: number): NearbyPlace[] {
  return []
}

export async function fetchNearbyPlaces(
  lat: number,
  lng: number,
  radiusMeters = 3000
): Promise<NearbyPlace[]> {
  const query = buildOverpassQuery(lat, lng, radiusMeters)
  let data: { elements?: unknown[] } | null = null
  let lastError: Error | null = null

  try {
    data = await Promise.any(
      OVERPASS_ENDPOINTS.map(endpoint =>
        fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'Propcinity/1.0',
          },
          body: `data=${encodeURIComponent(query)}`,
          signal: AbortSignal.timeout(8000),
        }).then(res => {
          if (!res.ok) throw new Error(`Overpass ${res.status}`)
          return res.json() as Promise<{ elements?: unknown[] }>
        })
      )
    )
  } catch (error) {
    lastError = error instanceof Error ? error : new Error('All Overpass endpoints failed')
  }

  if (!data) {
    console.warn('All Overpass endpoints failed or timed out. Returning fallback data.');
    return getFallbackPlaces(lat, lng);
  }

  const elements = Array.isArray(data.elements) ? (data.elements as any[]) : []
  const places: NearbyPlace[] = []
  const seenNames = new Set<string>()

  for (const element of elements) {
    const tags = (element.tags ?? {}) as Record<string, string>
    const name = tags.name || tags['name:en'] || null
    if (!name) continue
    if (seenNames.has(name.toLowerCase())) continue
    seenNames.add(name.toLowerCase())

    const placeLat = element.lat ?? element.center?.lat
    const placeLng = element.lon ?? element.center?.lon
    if (typeof placeLat !== 'number' || typeof placeLng !== 'number') continue

    places.push({
      id: element.id,
      name,
      type: classifyPlace(tags),
      lat: placeLat,
      lng: placeLng,
      distance: haversineDistance(lat, lng, placeLat, placeLng),
      tags,
    })
  }

  const caps: Record<NearbyPlace['type'], number> = {
    it_park: 5,
    metro: 5,
    school: 5,
    hospital: 5,
    mall: 3,
    park: 3,
  }

  const counts: Partial<Record<NearbyPlace['type'], number>> = {}
  const filtered: NearbyPlace[] = []

  for (const place of places.sort((a, b) => (a.distance || 0) - (b.distance || 0))) {
    const count = counts[place.type] || 0
    if (count < caps[place.type]) {
      filtered.push(place)
      counts[place.type] = count + 1
    }
  }

  return filtered
}
