'use client';

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { ManualNearbyLocation } from "@/types/project";

const CATEGORIES = [
  { value: 'school', label: '🏫 School' },
  { value: 'hospital', label: '🏥 Hospital' },
  { value: 'mall', label: '🛍️ Mall' },
  { value: 'metro', label: '🚇 Metro / Transit' },
  { value: 'it_park', label: '💼 IT Park' },
  { value: 'park', label: '🌳 Park' },
  { value: 'restaurant', label: '🍽️ Restaurant' },
  { value: 'bank', label: '🏦 Bank' },
  { value: 'pharmacy', label: '💊 Pharmacy' },
  { value: 'other', label: '📍 Other' },
];

interface NearbyLocationsFormProps {
  value: ManualNearbyLocation[];
  onChange: (locs: ManualNearbyLocation[]) => void;
}

export default function NearbyLocationsForm({ value, onChange }: NearbyLocationsFormProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ManualNearbyLocation['category']>('school');
  const [distance, setDistance] = useState('');

  const add = () => {
    if (!name.trim() || !distance.trim()) return;
    onChange([...value, {
      id: crypto.randomUUID(),
      name: name.trim(),
      category,
      distance: distance.trim(),
    }]);
    setName(''); setDistance('');
  };

  const remove = (id: string) => onChange(value.filter(l => l.id !== id));

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-widest">
        Nearby Locations
      </h3>
      <p className="text-xs text-[var(--text-muted)]">
        Manually add key landmarks shown on the property page. These are saved to this project only.
      </p>

      {/* Existing entries */}
      <div className="space-y-2">
        {value.map(loc => {
          const cat = CATEGORIES.find(c => c.value === loc.category);
          return (
            <div key={loc.id}
              className="flex items-center justify-between p-2.5 bg-[var(--surface-raised)] border border-[var(--border)] rounded-[var(--radius-xs)]">
              <div className="flex items-center gap-2">
                <span className="text-base">{cat?.label.split(' ')[0]}</span>
                <span className="text-sm font-medium text-[var(--text-primary)]">{loc.name}</span>
                <span className="text-xs text-[var(--text-muted)]">·</span>
                <span className="text-xs font-bold text-[var(--primary)]">{loc.distance}</span>
              </div>
              <button type="button" onClick={() => remove(loc.id)}
                className="text-[var(--text-muted)] hover:text-[var(--danger)] p-1">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Add new */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
        <input type="text" value={name} onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && add()}
          placeholder="Name, e.g. Holy Angels School"
          className="sm:col-span-2 bg-[var(--surface-raised)] border border-[var(--border)] rounded-[var(--radius-xs)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--primary)]" />
        <select value={category} onChange={e => setCategory(e.target.value as any)}
          className="bg-[var(--surface-raised)] border border-[var(--border)] rounded-[var(--radius-xs)] px-3 py-2 text-xs focus:outline-none focus:border-[var(--primary)]">
          {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <div className="flex gap-2">
          <input type="text" value={distance} onChange={e => setDistance(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && add()}
            placeholder="e.g. 700m"
            className="flex-1 bg-[var(--surface-raised)] border border-[var(--border)] rounded-[var(--radius-xs)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--primary)]" />
          <button type="button" onClick={add} disabled={!name.trim() || !distance.trim()}
            className="px-3 py-2 bg-[var(--primary)] text-white rounded-[var(--radius-xs)] hover:opacity-90 disabled:opacity-40">
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
