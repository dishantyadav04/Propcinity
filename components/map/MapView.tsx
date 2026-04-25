'use client';

import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import ProjectMarker from '@/components/map/ProjectMarker';
import NearbyMarker from '@/components/map/NearbyMarker';
import { NearbyPlace } from '@/lib/overpass';

// Safely updates map center/zoom when props change (avoids remounting the container)
function MapUpdater({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

interface MapViewProps {
  lat: number;
  lng: number;
  projectName: string;
  priceLabel: string;
  zoom?: number;
  className?: string;
}

export default function MapView({ 
  lat, 
  lng, 
  projectName, 
  priceLabel, 
  zoom = 14, 
  className 
}: MapViewProps) {
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlace[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Guard: react-leaflet creates an inner .leaflet-container div and Leaflet
  // sets _leaflet_id on THAT element (not the wrapper). Clear it on unmount
  // so React 18 Strict Mode's double-invoke doesn't crash on re-mount.
  useEffect(() => {
    return () => {
      const leafletEl = containerRef.current?.querySelector('.leaflet-container') as any;
      if (leafletEl?._leaflet_id) {
        leafletEl._leaflet_id = null;
      }
    };
  }, []);

  useEffect(() => {
    // Fix Leaflet default icon paths (broken in webpack builds)
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    });

    const fetchPlaces = async () => {
      try {
        const response = await fetch(`/api/nearby?lat=${lat}&lng=${lng}&radius=3000`);
        const data = await response.json();
        setNearbyPlaces(data.places || []);
      } catch (e) {
        console.error("Failed to fetch nearby places", e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlaces();
  }, [lat, lng]);

  const filters = [
    { id: 'all', label: 'All', icon: '🗺️' },
    { id: 'it_park', label: 'IT Parks', icon: '💼' },
    { id: 'metro', label: 'Metro', icon: '🚇' },
    { id: 'school', label: 'Schools', icon: '🏫' },
    { id: 'hospital', label: 'Hospitals', icon: '🏥' },
    { id: 'mall', label: 'Malls', icon: '🛍️' },
    { id: 'park', label: 'Parks', icon: '🌳' },
  ];

  const availableFilters = filters.filter(f => f.id === 'all' || nearbyPlaces.some(p => p.type === f.id));
  const filteredPlaces = activeFilter === 'all' ? nearbyPlaces : nearbyPlaces.filter(p => p.type === activeFilter);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {availableFilters.map(f => (
          <button
            key={f.id}
            onClick={() => setActiveFilter(f.id)}
            className={cn(
              "flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
              activeFilter === f.id 
                ? "bg-[var(--primary)] border-[var(--primary)] text-white" 
                : "bg-[var(--surface-raised)] border-[var(--border)] text-[var(--text-secondary)]"
            )}
          >
            <span>{f.icon}</span>
            <span>{f.label}</span>
            {f.id !== 'all' && (
              <span className="opacity-60">{nearbyPlaces.filter(p => p.type === f.id).length}</span>
            )}
          </button>
        ))}
      </div>

      {/* ref attached to wrapper so cleanup effect can clear _leaflet_id */}
      <div
        ref={containerRef}
        className="h-[300px] w-full rounded-[var(--radius)] overflow-hidden border border-[var(--border)] relative z-10"
      >
        <MapContainer 
          center={[lat, lng]} 
          zoom={zoom} 
          scrollWheelZoom={false} 
          attributionControl={false}
          className="h-full w-full"
        >
          <MapUpdater center={[lat, lng]} zoom={zoom} />
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <ProjectMarker lat={lat} lng={lng} name={projectName} priceLabel={priceLabel} />
          {filteredPlaces.map(place => (
            <NearbyMarker key={place.id} place={place} />
          ))}
        </MapContainer>
      </div>
      <p className="text-[10px] text-[var(--text-muted)] text-right">
        Map data © OpenStreetMap contributors
      </p>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
