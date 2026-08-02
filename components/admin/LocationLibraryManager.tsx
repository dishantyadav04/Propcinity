'use client';

import { useState, useEffect } from 'react';
import { Plus, X, ChevronDown, ChevronRight, Loader2, Edit2, Check, EyeOff, Eye, Trash2 } from 'lucide-react';
import { City, Locality } from '@/types/location';
import { toast } from 'sonner';

// ─── City row ─────────────────────────────────────────────────────────────────

function CityRow({
  city,
  isExpanded,
  onToggle,
  onRenamed,
  onDeactivated,
  onDeleted,
}: {
  city: City;
  isExpanded: boolean;
  onToggle: () => void;
  onRenamed: (id: string, name: string) => void;
  onDeactivated: (id: string, active: boolean) => void;
  onDeleted: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(city.name);
  const [busy, setBusy] = useState(false);

  const saveRename = async () => {
    if (!editName.trim() || editName.trim() === city.name) {
      setEditing(false);
      setEditName(city.name);
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/cities?id=${city.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim() }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed');
      onRenamed(city.id, editName.trim());
      toast.success('City renamed');
    } catch (e: any) {
      toast.error(e.message);
      setEditName(city.name);
    } finally {
      setBusy(false);
      setEditing(false);
    }
  };

  const toggleActive = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/cities?id=${city.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !city.is_active }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed');
      onDeactivated(city.id, !city.is_active);
      toast.success(city.is_active ? 'City deactivated' : 'City activated');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  const deleteCity = async () => {
    if (!confirm(`Delete city "${city.name}" and all its localities? This cannot be undone.`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/cities?id=${city.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed');
      onDeleted(city.id);
      toast.success('City deleted');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className={`border rounded-xl overflow-hidden transition-all ${
        city.is_active ? 'border-[var(--border)]' : 'border-dashed border-[var(--border)] opacity-60'
      }`}
    >
      <div className="flex items-center gap-3 px-4 py-3 bg-[var(--surface-raised)] group">
        <button
          type="button"
          onClick={onToggle}
          className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
        >
          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>

        {editing ? (
          <input
            autoFocus
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveRename();
              if (e.key === 'Escape') { setEditing(false); setEditName(city.name); }
            }}
            className="flex-1 bg-[var(--surface)] border border-[var(--primary)] rounded-lg px-3 py-1 text-sm focus:outline-none"
          />
        ) : (
          <span className="flex-1 font-semibold text-sm text-[var(--text-primary)]">
            {city.name}
            {city.state && (
              <span className="ml-2 text-xs text-[var(--text-muted)] font-normal">{city.state}</span>
            )}
          </span>
        )}

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {busy ? (
            <Loader2 className="w-4 h-4 animate-spin text-[var(--text-muted)]" />
          ) : editing ? (
            <button
              type="button"
              onClick={saveRename}
              className="p-1.5 text-[var(--success)] hover:bg-[var(--success)]/10 rounded-lg transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="p-1.5 text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 rounded-lg transition-colors"
                title="Rename city"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={toggleActive}
                className="p-1.5 text-[var(--text-muted)] hover:text-[var(--warning)] hover:bg-[var(--warning)]/10 rounded-lg transition-colors"
                title={city.is_active ? 'Deactivate city' : 'Activate city'}
              >
                {city.is_active ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={deleteCity}
                className="p-1.5 text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete city"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {isExpanded && <LocalityList cityId={city.id} />}
    </div>
  );
}

// ─── Locality list (per-city) ─────────────────────────────────────────────────

function LocalityList({ cityId }: { cityId: string }) {
  const [localities, setLocalities] = useState<Locality[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/localities?city_id=${cityId}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setLocalities(d.localities || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [cityId]);

  const addLocality = async () => {
    if (!newName.trim()) return;
    setAdding(true);
    try {
      const res = await fetch('/api/admin/localities', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city_id: cityId, name: newName.trim() }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed');
      const { locality } = await res.json();
      setLocalities((prev) => [...prev, locality].sort((a, b) => a.name.localeCompare(b.name)));
      setNewName('');
      toast.success('Locality added');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setAdding(false);
    }
  };

  const toggleLocality = async (loc: Locality) => {
    try {
      const res = await fetch(`/api/admin/localities?id=${loc.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !loc.is_active }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed');
      setLocalities((prev) =>
        prev.map((l) => (l.id === loc.id ? { ...l, is_active: !l.is_active } : l))
      );
      toast.success(loc.is_active ? 'Locality deactivated' : 'Locality activated');
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const deleteLocality = async (loc: Locality) => {
    if (!confirm(`Delete locality "${loc.name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/localities?id=${loc.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed');
      setLocalities((prev) => prev.filter((l) => l.id !== loc.id));
      toast.success('Locality deleted');
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="p-4 bg-[var(--surface)] border-t border-[var(--border)] space-y-3">
      {loading ? (
        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading localities…
        </div>
      ) : localities.length === 0 ? (
        <p className="text-xs text-[var(--text-muted)] italic">No localities yet. Add one below.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {localities.map((loc) => (
            <span
              key={loc.id}
              className={`flex items-center gap-1.5 px-2.5 py-1 border rounded-full text-xs font-medium transition-all ${
                loc.is_active
                  ? 'bg-[var(--surface-raised)] border-[var(--border)] text-[var(--text-secondary)]'
                  : 'bg-[var(--surface-raised)] border-dashed border-[var(--border)] text-[var(--text-muted)] line-through'
              }`}
            >
              {loc.name}
              <button
                type="button"
                onClick={() => toggleLocality(loc)}
                className="hover:text-[var(--warning)] transition-colors"
                title={loc.is_active ? 'Deactivate' : 'Activate'}
              >
                {loc.is_active ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              </button>
              <button
                type="button"
                onClick={() => deleteLocality(loc)}
                className="hover:text-red-500 transition-colors"
                title="Delete locality"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Add locality input */}
      <div className="flex gap-2 items-center pt-1">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addLocality(); } }}
          placeholder="Add locality name…"
          className="flex-1 bg-[var(--surface-raised)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--primary)]"
        />
        <button
          type="button"
          onClick={addLocality}
          disabled={!newName.trim() || adding}
          className="px-3 py-2 bg-[var(--primary)] text-white rounded-lg hover:opacity-90 disabled:opacity-40 transition-all"
        >
          {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

// ─── Main LocationLibraryManager ─────────────────────────────────────────────

export default function LocationLibraryManager() {
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCity, setExpandedCity] = useState<string | null>(null);
  const [newCityName, setNewCityName] = useState('');
  const [newCityState, setNewCityState] = useState('');
  const [adding, setAdding] = useState(false);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetch('/api/admin/cities', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setCities(d.cities || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const addCity = async () => {
    if (!newCityName.trim()) return;
    setAdding(true);
    try {
      const res = await fetch('/api/admin/cities', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCityName.trim(), state: newCityState.trim() }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed');
      const { city } = await res.json();
      setCities((prev) => [...prev, city].sort((a, b) => a.name.localeCompare(b.name)));
      setNewCityName('');
      setNewCityState('');
      setExpandedCity(city.id);
      toast.success('City added');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setAdding(false);
    }
  };

  const displayedCities = showAll ? cities : cities.filter((c) => c.is_active);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-xs text-[var(--text-muted)]">
          {cities.length} {cities.length === 1 ? 'city' : 'cities'} total
          {!showAll && cities.some((c) => !c.is_active) && (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="ml-2 text-[var(--primary)] hover:underline"
            >
              (show inactive)
            </button>
          )}
          {showAll && (
            <button
              type="button"
              onClick={() => setShowAll(false)}
              className="ml-2 text-[var(--primary)] hover:underline"
            >
              (hide inactive)
            </button>
          )}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading cities…
        </div>
      ) : displayedCities.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)] italic">No cities yet. Add one below.</p>
      ) : (
        <div className="space-y-2">
          {displayedCities.map((city) => (
            <CityRow
              key={city.id}
              city={city}
              isExpanded={expandedCity === city.id}
              onToggle={() => setExpandedCity(expandedCity === city.id ? null : city.id)}
              onRenamed={(id, name) =>
                setCities((prev) => prev.map((c) => (c.id === id ? { ...c, name } : c)))
              }
              onDeactivated={(id, active) =>
                setCities((prev) => prev.map((c) => (c.id === id ? { ...c, is_active: active } : c)))
              }
              onDeleted={(id) => setCities((prev) => prev.filter((c) => c.id !== id))}
            />
          ))}
        </div>
      )}

      {/* Add city form */}
      <div className="border border-dashed border-[var(--border)] rounded-xl p-4 space-y-3">
        <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">Add New City</p>
        <div className="flex flex-wrap gap-2 items-end">
          <div className="flex-1 min-w-[140px] space-y-1">
            <label className="text-[10px] text-[var(--text-muted)] uppercase font-bold">City Name *</label>
            <input
              type="text"
              value={newCityName}
              onChange={(e) => setNewCityName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCity(); } }}
              placeholder="e.g. Mumbai"
              className="w-full bg-[var(--surface-raised)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--primary)]"
            />
          </div>
          <div className="flex-1 min-w-[120px] space-y-1">
            <label className="text-[10px] text-[var(--text-muted)] uppercase font-bold">State</label>
            <input
              type="text"
              value={newCityState}
              onChange={(e) => setNewCityState(e.target.value)}
              placeholder="e.g. Maharashtra"
              className="w-full bg-[var(--surface-raised)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--primary)]"
            />
          </div>
          <button
            type="button"
            onClick={addCity}
            disabled={!newCityName.trim() || adding}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-bold hover:opacity-90 disabled:opacity-40 transition-all self-end"
          >
            {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Add City
          </button>
        </div>
      </div>
    </div>
  );
}
