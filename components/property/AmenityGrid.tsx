import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface AmenityGridProps {
  amenities: string[];
}

const COMMON_AMENITIES: Record<string, { label: string, icon: string }> = {
  gym: { label: 'Gymnasium', icon: '💪' },
  pool: { label: 'Swimming Pool', icon: '🏊' },
  clubhouse: { label: 'Club House', icon: '🏠' },
  security: { label: '24/7 Security', icon: '🛡️' },
  power: { label: 'Power Backup', icon: '⚡' },
  parking: { label: 'Parking', icon: '🚗' },
  garden: { label: 'Landscaped Garden', icon: '🌳' },
  kids: { label: 'Kids Play Area', icon: '👶' },
};

export default function AmenityGrid({ amenities }: AmenityGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {amenities.map((amenity) => {
        const key = amenity.toLowerCase().replace(/\s+/g, '');
        const config = Object.entries(COMMON_AMENITIES).find(([k]) => key.includes(k))?.[1];

        return (
          <div 
            key={amenity}
            className="flex items-center gap-3 bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl p-3"
          >
            <div className="w-8 h-8 flex items-center justify-center bg-white/5 rounded-lg text-lg">
              {config?.icon || '✨'}
            </div>
            <span className="text-xs font-medium text-[var(--text-secondary)]">
              {config?.label || amenity}
            </span>
          </div>
        );
      })}
    </div>
  );
}
