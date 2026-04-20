'use client';

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { NearbyPlace } from "@/lib/overpass";
import NearbyPlacesList from "@/components/map/NearbyPlacesList";
import Skeleton from "@/components/ui/Skeleton";

const MapView = dynamic(() => import("@/components/map/MapView"), { 
  ssr: false,
  loading: () => <Skeleton className="h-[300px] w-full rounded-[var(--radius)]" />
});

interface LocationSectionProps {
  lat: number;
  lng: number;
  projectName: string;
  priceLabel: string;
  location: string;
  city: string;
}

export default function LocationSection({ 
  lat, 
  lng, 
  projectName, 
  priceLabel, 
  location, 
  city 
}: LocationSectionProps) {
  const [places, setPlaces] = useState<NearbyPlace[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPlaces = async () => {
      try {
        const response = await fetch(`/api/nearby?lat=${lat}&lng=${lng}&radius=3000`);
        const data = await response.json();
        setPlaces(data);
      } catch (e) {
        console.error("Failed to fetch nearby places", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPlaces();
  }, [lat, lng]);

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
          Location & Surroundings
        </h2>
        <p className="text-sm text-[var(--text-secondary)]">
          {location}, {city} · Nearby places within 3km
        </p>
      </div>

      <MapView 
        lat={lat} 
        lng={lng} 
        projectName={projectName} 
        priceLabel={priceLabel} 
      />

      <div className="space-y-4">
        <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">
          What's nearby
        </h3>
        <NearbyPlacesList places={places} isLoading={isLoading} />
      </div>
    </section>
  );
}
