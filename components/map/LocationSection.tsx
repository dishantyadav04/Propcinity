'use client';

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { NearbyPlace } from "@/lib/overpass";
import { ManualNearbyLocation } from "@/types/project";
import NearbyPlacesList from "@/components/map/NearbyPlacesList";
import Skeleton from "@/components/ui/Skeleton";
import { MapPin, Navigation } from "lucide-react";

const MapView = dynamic(() => import("@/components/map/MapView"), {
  ssr: false,
  loading: () => <Skeleton className="h-[320px] w-full rounded-[var(--radius)]" />
});

const CATEGORY_ICONS: Record<ManualNearbyLocation['category'], string> = {
  school: '🏫', hospital: '🏥', mall: '🛍️', metro: '🚇',
  it_park: '💼', park: '🌳', restaurant: '🍽️', bank: '🏦',
  pharmacy: '💊', other: '📍',
};

const CATEGORY_LABELS: Record<ManualNearbyLocation['category'], string> = {
  school: 'School', hospital: 'Hospital', mall: 'Mall', metro: 'Metro / Transit',
  it_park: 'IT Park', park: 'Park', restaurant: 'Restaurant', bank: 'Bank',
  pharmacy: 'Pharmacy', other: 'Nearby',
};

interface LocationSectionProps {
  lat: number;
  lng: number;
  projectName: string;
  priceLabel: string;
  location: string;
  city: string;
  nearbyLocations?: ManualNearbyLocation[];
}

export default function LocationSection({
  lat, lng, projectName, priceLabel, location, city, nearbyLocations = []
}: LocationSectionProps) {
  const [activeTab, setActiveTab] = useState<'map' | 'nearby'>('map');
  const [autoPlaces, setAutoPlaces] = useState<NearbyPlace[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPlaces = async () => {
      try {
        const response = await fetch(`/api/nearby?lat=${lat}&lng=${lng}&radius=3000`);
        const data = await response.json();
        setAutoPlaces(data.places || []);
      } catch (e) {
        console.error("Failed to fetch nearby places", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPlaces();
  }, [lat, lng]);

  // Group manual locations by category
  const grouped = nearbyLocations.reduce((acc, loc) => {
    if (!acc[loc.category]) acc[loc.category] = [];
    acc[loc.category].push(loc);
    return acc;
  }, {} as Record<string, ManualNearbyLocation[]>);

  return (
    <section className="space-y-4">
      <p className="text-sm text-[var(--text-muted)]">
        {location}, {city}
      </p>

      {/* Sub-tabs */}
      <div className="flex gap-0 border border-[var(--border)] rounded-[var(--radius-sm)] overflow-hidden w-fit">
        {(['map', 'nearby'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 ${
              activeTab === tab
                ? 'bg-[var(--primary)] text-white'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-white'
            }`}
          >
            {tab === 'map' ? <><MapPin className="w-3 h-3" /> Map</> : <><Navigation className="w-3 h-3" /> Nearby</>}
          </button>
        ))}
      </div>

      {/* Map tab */}
      {activeTab === 'map' && (
        <MapView lat={lat} lng={lng} projectName={projectName} priceLabel={priceLabel} />
      )}

      {/* Nearby tab */}
      {activeTab === 'nearby' && (
        <div className="space-y-6">
          {/* Manual admin-entered locations */}
          {nearbyLocations.length > 0 && (
            <div className="space-y-4">
              {Object.entries(grouped).map(([cat, items]) => (
                <div key={cat}>
                  <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2">
                    {CATEGORY_LABELS[cat as ManualNearbyLocation['category']]}
                  </p>
                  <div className="space-y-1.5">
                    {items.map(loc => (
                      <div key={loc.id}
                        className="flex items-center justify-between py-2 px-3 bg-[var(--surface-raised)] border border-[var(--border)] rounded-[var(--radius-xs)]">
                        <div className="flex items-center gap-2.5">
                          <span className="text-base">{CATEGORY_ICONS[loc.category]}</span>
                          <span className="text-sm font-medium text-[var(--text-primary)]">{loc.name}</span>
                        </div>
                        <span className="text-xs font-bold text-[var(--primary)] bg-[var(--primary-light)] px-2 py-0.5 rounded-full">
                          {loc.distance}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Auto-fetched Overpass places */}
          {nearbyLocations.length > 0 && autoPlaces.length > 0 && (
            <div className="border-t border-[var(--border)] pt-4">
              <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-3">
                More Nearby (Auto-detected)
              </p>
            </div>
          )}
          <NearbyPlacesList places={autoPlaces} isLoading={isLoading} />
        </div>
      )}
    </section>
  );
}
