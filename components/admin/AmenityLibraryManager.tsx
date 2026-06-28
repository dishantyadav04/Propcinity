'use client';

import { useState, KeyboardEvent } from 'react';
import { X, Plus } from 'lucide-react';

interface AmenityLibraryManagerProps {
  selectedInternal: string[];
  selectedExternal: string[];
  onChangeInternal: (items: string[]) => void;
  onChangeExternal: (items: string[]) => void;
}

const EMOJI_MAP: Record<string, string> = {
  gym: '💪', pool: '🏊', club: '🏠', security: '🛡️', power: '⚡',
  parking: '🚗', garden: '🌳', kids: '👶', jacuzzi: '🛁', yoga: '🧘',
  tennis: '🎾', cricket: '🏏', jogging: '🚴', automation: '🏠', door: '📹',
  motion: '🔒', skating: '🛹', basketball: '🏀', badminton: '🏸',
};

function guessEmoji(name: string): string {
  const lower = name.toLowerCase();
  for (const [key, emoji] of Object.entries(EMOJI_MAP)) {
    if (lower.includes(key)) return emoji;
  }
  return '✨';
}

function TagInput({
  label,
  items,
  onChange,
}: {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
}) {
  const [input, setInput] = useState('');

  const add = () => {
    const trimmed = input.trim();
    if (!trimmed || items.includes(trimmed)) return;
    onChange([...items, trimmed]);
    setInput('');
  };

  const remove = (item: string) => onChange(items.filter((i) => i !== item));

  return (
    <div className="space-y-3">
      <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">{label}</p>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={item}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-[var(--surface-raised)] border border-[var(--border)] rounded-full text-xs font-medium text-[var(--text-secondary)]"
          >
            <span>{guessEmoji(item)}</span>
            {item}
            <button type="button" onClick={() => remove(item)} className="hover:text-[var(--danger)]">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter') { e.preventDefault(); add(); }
          }}
          placeholder={`Add ${label.toLowerCase()} amenity…`}
          className="flex-1 bg-[var(--surface-raised)] border border-[var(--border)] rounded-[var(--radius-xs)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--primary)]"
        />
        <button
          type="button"
          onClick={add}
          disabled={!input.trim()}
          className="px-3 py-2 bg-[var(--primary)] text-white rounded-[var(--radius-xs)] hover:opacity-90 disabled:opacity-40"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default function AmenityLibraryManager({
  selectedInternal,
  selectedExternal,
  onChangeInternal,
  onChangeExternal,
}: AmenityLibraryManagerProps) {
  return (
    <div className="space-y-6">
      <TagInput label="Internal Amenities" items={selectedInternal} onChange={onChangeInternal} />
      <TagInput label="External Amenities" items={selectedExternal} onChange={onChangeExternal} />
    </div>
  );
}
