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
      <div style="display: flex; flex-direction: column; align-items: center; transform: translateX(-50%);">
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
        ">
          📍 ${name}
        </div>
        <div style="
          width: 0;
          height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 8px solid #FF5722;
          margin-top: -1px;
        "></div>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 40],
    popupAnchor: [0, -44],
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
