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
      <div style="position: relative; width: 0; height: 0;">
        <div style="
          position: absolute;
          bottom: 40px;
          left: 0;
          transform: translateX(-50%);
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
        <svg
          width="26"
          height="34"
          viewBox="0 0 26 34"
          style="position: absolute; left: -13px; top: -34px; display: block; filter: drop-shadow(0 2px 3px rgba(0,0,0,0.3));"
        >
          <path
            d="M13 33 C13 33 1.5 20.5 1.5 12.4 C1.5 6.1 6.7 1 13 1 C19.3 1 24.5 6.1 24.5 12.4 C24.5 20.5 13 33 13 33 Z"
            fill="#FF5722"
            stroke="#ffffff"
            stroke-width="2"
            stroke-linejoin="round"
          />
          <circle cx="13" cy="12.4" r="4.2" fill="#ffffff" />
        </svg>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
    popupAnchor: [0, -46],
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
