'use client';

import { useEffect } from 'react';
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

export default function ProjectMapInner({ lat, lng, projectName, priceLabel, zoom = 15 }: Props) {
  useEffect(() => {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    });

    return () => {
      document.querySelectorAll('.leaflet-container').forEach((el: any) => {
        if (el._leaflet_id) el._leaflet_id = null;
      });
    };
  }, []);

  return (
    <MapContainer
      center={[lat, lng]}
      zoom={zoom}
      scrollWheelZoom={false}
      attributionControl={false}
      className="h-full w-full"
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {projectName && priceLabel
        ? <ProjectMarker lat={lat} lng={lng} name={projectName} priceLabel={priceLabel} />
        : <Marker position={[lat, lng]} />
      }
      <RecenterMap lat={lat} lng={lng} />
    </MapContainer>
  );
}
