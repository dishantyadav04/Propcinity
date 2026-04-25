import { NearbyPlace, formatDistance } from "@/lib/overpass";
import Skeleton from "@/components/ui/Skeleton";

interface NearbyPlacesListProps {
  places: NearbyPlace[];
  isLoading: boolean;
}

const TYPE_ORDER: NearbyPlace['type'][] = ['it_park', 'metro', 'school', 'hospital', 'mall', 'park'];
const TYPE_LABELS: Record<string, { label: string, color: string, emoji: string }> = {
  it_park:  { label: 'IT Parks', color: 'text-[#22C55E]', emoji: '💼' },
  metro:    { label: 'Metro Stations', color: 'text-[#8B5CF6]', emoji: '🚇' },
  school:   { label: 'Schools', color: 'text-[#3B82F6]', emoji: '🏫' },
  hospital: { label: 'Hospitals', color: 'text-[#EF4444]', emoji: '🏥' },
  mall:     { label: 'Shopping Malls', color: 'text-[#F59E0B]', emoji: '🛍️' },
  park:     { label: 'Public Parks', color: 'text-[#10B981]', emoji: '🌳' }
};

export default function NearbyPlacesList({ places, isLoading }: NearbyPlacesListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  const safeList = Array.isArray(places) ? places : [];

  if (safeList.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-[var(--text-muted)]">No nearby places found within 3km</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {TYPE_ORDER.map(type => {
        const typePlaces = safeList.filter(p => p.type === type);
        if (typePlaces.length === 0) return null;
        const config = TYPE_LABELS[type];

        return (
          <div key={type} className="space-y-3">
            <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${config.color}`}>
              <span>{config.emoji}</span>
              <span>{config.label}</span>
            </h4>
            <div className="space-y-2">
              {typePlaces.map(place => (
                <div 
                  key={place.id}
                  className="bg-[var(--surface-raised)] border border-[var(--border)] rounded-lg px-4 py-3 flex items-center justify-between gap-4"
                >
                  <span className="text-sm text-[var(--text-primary)] font-medium line-clamp-1 flex-1">
                    {place.name}
                  </span>
                  <span className={`text-xs font-bold shrink-0 ${config.color}`}>
                    {formatDistance(place.distance || 0)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
