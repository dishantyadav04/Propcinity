'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AmenityGridProps {
  amenities?: string[];
  internalAmenities?: string[];
  externalAmenities?: string[];
}

const EMOJI_MAP: Record<string, string> = {
  gym: '💪', pool: '🏊', club: '🏠', security: '🛡️', power: '⚡',
  parking: '🚗', garden: '🌳', kids: '👶', jacuzzi: '🛁', yoga: '🧘',
  tennis: '🎾', cricket: '🏏', jogging: '🚴', automation: '🏠', door: '📹',
  motion: '🔒', skating: '🛹', basketball: '🏀', badminton: '🏸',
  landscaped: '🌳', swimming: '🏊', 'home auto': '🏠',
};

function guessEmoji(name: string): string {
  const lower = name.toLowerCase();
  for (const [key, emoji] of Object.entries(EMOJI_MAP)) {
    if (lower.includes(key)) return emoji;
  }
  return '✨';
}

function AmenityChip({ name }: { name: string }) {
  return (
    <div className="inline-flex items-center gap-2 bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl px-3 py-2 whitespace-nowrap">
      <span className="text-base leading-none">{guessEmoji(name)}</span>
      <span className="text-xs font-medium text-[var(--text-secondary)]">{name}</span>
    </div>
  );
}

function AmenitySection({ title, items }: { title: string; items: string[] }) {
  const INITIAL_SHOW = 8;
  const [expanded, setExpanded] = useState(false);
  if (!items.length) return null;
  const visible = expanded ? items : items.slice(0, INITIAL_SHOW);
  const hasMore = items.length > INITIAL_SHOW;

  return (
    <div className="space-y-3">
      <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">{title}</p>
      <div className="flex flex-wrap gap-2">
        {visible.map((item) => (
          <AmenityChip key={item} name={item} />
        ))}
      </div>
      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs font-semibold text-[var(--primary)] hover:underline mt-1"
        >
          {expanded ? (
            <><ChevronUp className="w-3.5 h-3.5" /> Show less</>
          ) : (
            <><ChevronDown className="w-3.5 h-3.5" /> Show {items.length - INITIAL_SHOW} more</>
          )}
        </button>
      )}
    </div>
  );
}

export default function AmenityGrid({ amenities, internalAmenities, externalAmenities }: AmenityGridProps) {
  if (internalAmenities?.length || externalAmenities?.length) {
    return (
      <div className="space-y-6">
        <AmenitySection title="Internal Amenities" items={internalAmenities ?? []} />
        <AmenitySection title="External Amenities" items={externalAmenities ?? []} />
      </div>
    );
  }

  if (!amenities?.length) return null;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {amenities.map((a) => <AmenityChip key={a} name={a} />)}
      </div>
    </div>
  );
}
