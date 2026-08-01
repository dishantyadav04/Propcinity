'use client';

import { useEffect, useId } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import ProjectMarker from '@/components/map/ProjectMarker';

interface Props {
  lat: number;
  lng: number;
  projectName?: string;
  priceLabel?: string;
  zoom?: number;
}

function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
}

function InvalidateSizeMap() {
  const map = useMap();
  useEffect(() => {
    // Force Leaflet to recalculate container size after mount/resize
    // to prevent blank or green tile rendering.
    const id = requestAnimationFrame(() => map.invalidateSize());
    return () => cancelAnimationFrame(id);
  }, [map]);
  return null;
}

export default function ProjectMapInner({ lat, lng, projectName, priceLabel, zoom = 15 }: Props) {
  // useId() returns a stable, unique string for this component instance.
  // Passing it as the `key` on MapContainer ensures React creates a fresh
  // DOM node on every Strict Mode remount instead of reusing the old one
  // that still has Leaflet's _leaflet_id stamped on it.
  const mapId = useId();

  useEffect(() => {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    });
  }, []);

  return (
    <MapContainer
      key={mapId}
      center={[lat, lng]}
      zoom={zoom}
      scrollWheelZoom={false}
      dragging={false}
      attributionControl={false}
      className="h-full w-full"
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {projectName && priceLabel
        ? <ProjectMarker lat={lat} lng={lng} name={projectName} priceLabel={priceLabel} />
        : <Marker position={[lat, lng]} />
      }
      <RecenterMap lat={lat} lng={lng} />
      <InvalidateSizeMap />
    </MapContainer>
  );
}
