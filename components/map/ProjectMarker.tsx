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
  // Teardrop pin: rounded price chip on top + pointed tail. The chip is a fixed
  // 30px-tall pill and the tail is a 12px-tall triangle (2px white outline), so
  // the total pin height is a deterministic 42px. iconAnchor [0, 42] makes the
  // tip of the pointer sit exactly on the lat/lng coordinate at every zoom level.
  const icon = L.divIcon({
    className: '',
    html: `
      <div style="
        position: relative;
        transform: translateX(-50%);
        filter: drop-shadow(0 3px 6px rgba(0,0,0,0.28));
        font-family: inherit;
      ">
        <div style="
          display: flex;
          align-items: center;
          gap: 5px;
          height: 30px;
          padding: 0 12px;
          background: #FF4500;
          color: #fff;
          font-weight: 700;
          font-size: 12px;
          line-height: 1;
          white-space: nowrap;
          border-radius: 999px;
          border: 2px solid #fff;
          box-sizing: border-box;
          box-shadow: 0 1px 2px rgba(0,0,0,0.12);
        ">
          <svg width="9" height="12" viewBox="0 0 9 12" fill="none" xmlns="http://www.w3.org/2000/svg" style="flex-shrink: 0;">
            <path d="M4.5 0C2.015 0 0 2.015 0 4.5 0 7.875 4.5 12 4.5 12s4.5-4.125 4.5-7.5C9 2.015 6.985 0 4.5 0zm0 6.3a1.8 1.8 0 110-3.6 1.8 1.8 0 010 3.6z" fill="white"/>
          </svg>
          <span>${priceLabel}</span>
        </div>
        <div style="
          position: absolute;
          top: 42px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 10px solid transparent;
          border-right: 10px solid transparent;
          border-top: 14px solid #fff;
        "></div>
        <div style="
          position: absolute;
          top: 42px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-top: 12px solid #FF4500;
        "></div>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 42],
    popupAnchor: [0, -42],
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