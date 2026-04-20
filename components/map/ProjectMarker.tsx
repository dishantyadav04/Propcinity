'use client';

import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

interface ProjectMarkerProps {
  lat: number;
  lng: number;
  name: string;
  priceLabel: string;
}

export default function ProjectMarker({ lat, lng, name, priceLabel }: ProjectMarkerProps) {
  const icon = L.divIcon({
    className: 'custom-project-marker',
    html: `
      <div class="flex items-center gap-1.5 bg-[#4F6EF7] text-white px-3 py-1.5 rounded-full font-bold shadow-lg border-2 border-white whitespace-nowrap">
        <span>📍</span>
        <span>${priceLabel}</span>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [50, 16],
    popupAnchor: [0, -20]
  });

  return (
    <Marker position={[lat, lng]} icon={icon}>
      <Popup className="project-map-popup">
        <div className="p-1">
          <p className="font-bold text-[var(--text-primary)]">{name}</p>
          <p className="text-xs text-[var(--primary)] font-bold">{priceLabel}</p>
          <p className="text-[10px] text-[var(--text-muted)] mt-1">Project location</p>
        </div>
      </Popup>
    </Marker>
  );
}
