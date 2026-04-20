'use client';

import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { NearbyPlace, formatDistance } from '@/lib/overpass';

const TYPE_CONFIG = {
  it_park:  { color: '#22C55E', emoji: '💼', label: 'IT Park' },
  metro:    { color: '#8B5CF6', emoji: '🚇', label: 'Metro' },
  school:   { color: '#3B82F6', emoji: '🏫', label: 'School' },
  hospital: { color: '#EF4444', emoji: '🏥', label: 'Hospital' },
  mall:     { color: '#F59E0B', emoji: '🛍️', label: 'Mall' },
  park:     { color: '#10B981', emoji: '🌳', label: 'Park' }
};

interface NearbyMarkerProps {
  place: NearbyPlace;
}

export default function NearbyMarker({ place }: NearbyMarkerProps) {
  const config = TYPE_CONFIG[place.type] || TYPE_CONFIG.park;

  const icon = L.divIcon({
    className: 'custom-nearby-marker',
    html: `
      <div class="w-7 h-7 bg-white rounded-full border-2 border-[${config.color}] flex items-center justify-center shadow-md text-xs">
        ${config.emoji}
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14]
  });

  return (
    <Marker position={[place.lat, place.lng]} icon={icon}>
      <Popup>
        <div className="p-1">
          <p className="font-bold text-[var(--text-primary)]">{config.emoji} {place.name}</p>
          <p className="text-xs" style={{ color: config.color }}>{formatDistance(place.distance || 0)} away</p>
          <p className="text-[10px] text-[var(--text-muted)] mt-1 uppercase tracking-wider">{config.label}</p>
        </div>
      </Popup>
    </Marker>
  );
}
