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
    className: '',
    html: `
      <div style="
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: #FF5722;
        color: white;
        padding: 6px 12px;
        border-radius: 999px;
        font-weight: 700;
        font-size: 12px;
        white-space: nowrap;
        box-shadow: 0 2px 8px rgba(0,0,0,0.25);
        border: 2px solid white;
        transform: translateX(-50%);
        position: relative;
      ">
        📍 ${priceLabel}
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 16],
    popupAnchor: [0, -20],
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
