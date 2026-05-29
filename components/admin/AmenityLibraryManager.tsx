'use client';

import { useState, useEffect } from "react";
import { Plus, X, Loader2 } from "lucide-react";
import { AmenityLibraryItem } from "@/types/project";
import { toast } from "sonner";

const CATEGORY_OPTIONS = [
  { value: 'internal', label: 'Internal' },
  { value: 'external', label: 'External' },
  { value: 'both', label: 'Both' },
];

const COMMON_EMOJIS = ['💪', '🏊', '🏠', '🛡️', '⚡', '🚗', '🌳', '👶', '🏏', '⛳', '🎾', '🧘', '🚴', '🎭', '🛁', '🔒', '📹', '🌊', '🎪', '🏋️', '🧒', '🛹', '🏑', '🎡'];

interface AmenityLibraryManagerProps {
  selectedInternal: string[];
  selectedExternal: string[];
  onChangeInternal: (items: string[]) => void;
  onChangeExternal: (items: string[]) => void;
}

export default function AmenityLibraryManager({
  selectedInternal, selectedExternal, onChangeInternal, onChangeExternal
}: AmenityLibraryManagerProps) {
  const [library, setLibrary] = useState<AmenityLibraryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('✨');
  const [newCategory, setNewCategory] = useState<'internal' | 'external' | 'both'>('external');
  const [isAdding, setIsAdding] = useState(false);
  const [activeTab, setActiveTab] = useState<'internal' | 'external'>('internal');

  const fetchLibrary = async () => {
    try {
      const res = await fetch('/api/admin/amenity-library', { credentials: 'include' });
      const data = await res.json();
      setLibrary(data.amenities || []);
    } catch {
      // Fallback to empty
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchLibrary(); }, []);

  const addToLibrary = async () => {
    if (!newName.trim()) return;
    setIsAdding(true);
    try {
      const res = await fetch('/api/admin/amenity-library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: newName.trim(), icon: newIcon, category: newCategory }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setLibrary(prev => [...prev, data.amenity]);
      setNewName('');
      toast.success('Amenity added to library');
    } catch {
      toast.error('Failed to add amenity');
    } finally {
      setIsAdding(false);
    }
  };

  const removeFromLibrary = async (id: string) => {
    try {
      await fetch(`/api/admin/amenity-library/${id}`, { method: 'DELETE', credentials: 'include' });
      setLibrary(prev => prev.filter(a => a.id !== id));
      // Also remove from project selections
      onChangeInternal(selectedInternal.filter(n => {
        const item = library.find(a => a.id === id);
        return n !== item?.name;
      }));
      onChangeExternal(selectedExternal.filter(n => {
        const item = library.find(a => a.id === id);
        return n !== item?.name;
      }));
    } catch {
      toast.error('Failed to remove');
    }
  };

  const toggleSelect = (amenity: AmenityLibraryItem, forInternal: boolean) => {
    if (forInternal) {
      const next = selectedInternal.includes(amenity.name)
        ? selectedInternal.filter(n => n !== amenity.name)
        : [...selectedInternal, amenity.name];
      onChangeInternal(next);
    } else {
      const next = selectedExternal.includes(amenity.name)
        ? selectedExternal.filter(n => n !== amenity.name)
        : [...selectedExternal, amenity.name];
      onChangeExternal(next);
    }
  };

  const filteredLibrary = library.filter(a =>
    a.category === activeTab || a.category === 'both'
  );
  const activeSelected = activeTab === 'internal' ? selectedInternal : selectedExternal;

  return (
    <div className="space-y-5">
      {/* Tab switcher */}
      <div className="flex gap-0 border border-[var(--border)] rounded-[var(--radius-xs)] overflow-hidden w-fit">
        {(['internal', 'external'] as const).map(tab => (
          <button key={tab} type="button" onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
              activeTab === tab ? 'bg-[var(--primary)] text-white' : 'bg-white text-[var(--text-muted)]'
            }`}>
            {tab}
          </button>
        ))}
      </div>

      {/* Amenity grid from library */}
      {isLoading ? (
        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading library…
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {filteredLibrary.map(amenity => {
            const selected = activeSelected.includes(amenity.name);
            return (
              <div key={amenity.id}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-[var(--radius-xs)] border cursor-pointer transition-all ${
                  selected
                    ? 'bg-[var(--primary-light)] border-[var(--primary)] text-[var(--primary)]'
                    : 'bg-[var(--surface-raised)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--primary)]/50'
                }`}
                onClick={() => toggleSelect(amenity, activeTab === 'internal')}>
                <span className="text-lg flex-shrink-0">{amenity.icon}</span>
                <span className="text-xs font-medium flex-1 truncate">{amenity.name}</span>
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); removeFromLibrary(amenity.id); }}
                  className="text-[var(--text-muted)] hover:text-[var(--danger)] opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Add new amenity to library */}
      <div className="pt-4 border-t border-[var(--border)] space-y-3">
        <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-wider">Add to Global Library</p>
        <div className="flex flex-wrap gap-2">
          {COMMON_EMOJIS.map(e => (
            <button key={e} type="button" onClick={() => setNewIcon(e)}
              className={`w-8 h-8 text-lg rounded-lg flex items-center justify-center transition-all ${
                newIcon === e ? 'bg-[var(--primary-light)] ring-2 ring-[var(--primary)]' : 'bg-[var(--surface-raised)] hover:bg-[var(--border)]'
              }`}>
              {e}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text" value={newName} onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addToLibrary()}
            placeholder="Amenity name, e.g. Swimming Pool"
            className="flex-1 bg-[var(--surface-raised)] border border-[var(--border)] rounded-[var(--radius-xs)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--primary)]"
          />
          <select value={newCategory}
            onChange={e => setNewCategory(e.target.value as any)}
            className="bg-[var(--surface-raised)] border border-[var(--border)] rounded-[var(--radius-xs)] px-3 py-2 text-xs">
            {CATEGORY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <button type="button" onClick={addToLibrary} disabled={isAdding || !newName.trim()}
            className="flex items-center gap-1.5 px-3 py-2 bg-[var(--primary)] text-white text-xs font-bold rounded-[var(--radius-xs)] hover:opacity-90 disabled:opacity-50">
            {isAdding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            Add
          </button>
        </div>
      </div>

      {/* Selected summary */}
      {(selectedInternal.length > 0 || selectedExternal.length > 0) && (
        <div className="text-xs text-[var(--text-muted)] pt-1">
          Selected: {selectedInternal.length} internal · {selectedExternal.length} external
        </div>
      )}
    </div>
  );
}
