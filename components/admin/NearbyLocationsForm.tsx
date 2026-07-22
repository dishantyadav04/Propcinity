'use client';

import { useState } from "react";
import { Plus, X, Pencil } from "lucide-react";
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
  errors?: Record<string, string[]>;
}

export default function NearbyLocationsForm({ value, onChange, errors }: NearbyLocationsFormProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ManualNearbyLocation['category']>('school');
  const [distance, setDistance] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState<ManualNearbyLocation['category']>('school');
  const [editDistance, setEditDistance] = useState('');

  const startEdit = (loc: ManualNearbyLocation) => {
    setEditingId(loc.id);
    setEditName(loc.name);
    setEditCategory(loc.category);
    setEditDistance(loc.distance);
  };

  const saveEdit = (id: string) => {
    if (!editName.trim() || !editDistance.trim()) return;
    onChange(value.map(l => l.id === id
      ? { ...l, name: editName.trim(), category: editCategory, distance: editDistance.trim() }
      : l
    ));
    setEditingId(null);
  };

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
        {value.map((loc, idx) => {
          const cat = CATEGORIES.find(c => c.value === loc.category);
          const isEditing = editingId === loc.id;
          
          const nameError = errors?.[`nearby_locations.${idx}.name`]
          const categoryError = errors?.[`nearby_locations.${idx}.category`]
          const distanceError = errors?.[`nearby_locations.${idx}.distance`]

          if (isEditing) {
            return (
              <div key={loc.id} className="space-y-2">
                <div className="flex flex-wrap gap-2 p-2.5 bg-[var(--primary-glow)] border border-[var(--primary)]/30 rounded-[var(--radius-xs)]">
                  <input
                    type="text"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="flex-1 min-w-[120px] bg-[var(--surface-raised)] border border-[var(--border)] rounded-[var(--radius-xs)] px-2 py-1 text-sm focus:outline-none focus:border-[var(--primary)]"
                  />
                  <select
                    value={editCategory}
                    onChange={e => setEditCategory(e.target.value as ManualNearbyLocation['category'])}
                    className="bg-[var(--surface-raised)] border border-[var(--border)] rounded-[var(--radius-xs)] px-2 py-1 text-xs focus:outline-none"
                  >
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                  <input
                    type="text"
                    value={editDistance}
                    onChange={e => setEditDistance(e.target.value)}
                    placeholder="e.g. 700m"
                    className="w-24 bg-[var(--surface-raised)] border border-[var(--border)] rounded-[var(--radius-xs)] px-2 py-1 text-sm focus:outline-none focus:border-[var(--primary)]"
                  />
                  <div className="flex gap-1">
                    <button type="button" onClick={() => saveEdit(loc.id)}
                      className="px-2 py-1 bg-[var(--primary)] text-white text-xs rounded hover:opacity-90">
                      Save
                    </button>
                    <button type="button" onClick={() => setEditingId(null)}
                      className="px-2 py-1 text-[var(--text-muted)] text-xs rounded hover:text-[var(--text-primary)]">
                      Cancel
                    </button>
                  </div>
                </div>
                {nameError && <p data-field-error={`nearby_locations.${idx}.name`} className="text-xs text-red-500 font-semibold">{nameError.join(', ')}</p>}
                {categoryError && <p data-field-error={`nearby_locations.${idx}.category`} className="text-xs text-red-500 font-semibold">{categoryError.join(', ')}</p>}
                {distanceError && <p data-field-error={`nearby_locations.${idx}.distance`} className="text-xs text-red-500 font-semibold">{distanceError.join(', ')}</p>}
              </div>
            );
          }

          return (
            <div key={loc.id} className="space-y-1">
              <div
                className="flex items-center justify-between p-2.5 bg-[var(--surface-raised)] border border-[var(--border)] rounded-[var(--radius-xs)] group">
                <button
                  type="button"
                  className="flex items-center gap-2 flex-1 text-left hover:opacity-80"
                  onClick={() => startEdit(loc)}
                >
                  <span className="text-base">{cat?.label.split(' ')[0]}</span>
                  <span className="text-sm font-medium text-[var(--text-primary)]">{loc.name}</span>
                  <span className="text-xs text-[var(--text-muted)]">·</span>
                  <span className="text-xs font-bold text-[var(--primary)]">{loc.distance}</span>
                  <Pencil className="w-3 h-3 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 ml-1 transition-opacity" />
                </button>
                <button type="button" onClick={() => remove(loc.id)}
                  className="text-[var(--text-muted)] hover:text-[var(--danger)] p-1 ml-2">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              {nameError && <p data-field-error={`nearby_locations.${idx}.name`} className="text-xs text-red-500 font-semibold">{nameError.join(', ')}</p>}
              {categoryError && <p data-field-error={`nearby_locations.${idx}.category`} className="text-xs text-red-500 font-semibold">{categoryError.join(', ')}</p>}
              {distanceError && <p data-field-error={`nearby_locations.${idx}.distance`} className="text-xs text-red-500 font-semibold">{distanceError.join(', ')}</p>}
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
