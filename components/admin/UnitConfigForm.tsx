'use client';

import { Plus, Trash2, Maximize, Layout, IndianRupee, ImageIcon, X } from "lucide-react";
import { UnitConfig } from "@/types/project";

interface UnitConfigFormProps {
  units: UnitConfig[];
  onChange: (units: UnitConfig[]) => void;
}

export default function UnitConfigForm({ units, onChange }: UnitConfigFormProps) {
  const addUnit = () => {
    onChange([...units, {
      id: crypto.randomUUID(),
      type: '2 BHK Apartment',
      area: 1000,
      priceMin: 8000000,
      priceMax: 8500000,
      pricePerSqFt: 8000,
      available: 10,
      total: 20,
      floor: 'Mid Floor',
      facing: ['East'],
      images: [],
      highlights: ['Spacious Balcony']
    }]);
  };

  const removeUnit = (id: string) => {
    onChange(units.filter(u => u.id !== id));
  };

  const updateUnit = (id: string, updates: Partial<UnitConfig>) => {
    onChange(units.map(u => u.id === id ? { ...u, ...updates } : u));
  };

  const handleFloorPlanUpload = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      const unit = units.find(u => u.id === id);
      if (unit) {
        // Floor plan is always images[0]; preserve any other images
        const newImages = [dataUrl, ...(unit.images || []).filter((_, i) => i > 0)];
        updateUnit(id, { images: newImages });
      }
    };
    reader.readAsDataURL(file);
  };

  const removeFloorPlan = (id: string) => {
    const unit = units.find(u => u.id === id);
    if (unit) {
      updateUnit(id, { images: (unit.images || []).slice(1) });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-widest">
          Configurations & Pricing
        </h3>
        <button
          type="button"
          onClick={addUnit}
          className="flex items-center gap-2 px-3 py-1.5 bg-[var(--primary)]/10 text-[var(--primary)] rounded-lg text-xs font-bold hover:bg-[var(--primary)]/20 transition-all"
        >
          <Plus className="w-3.5 h-3.5" /> Add Configuration
        </button>
      </div>

      <div className="space-y-4">
        {units.map((unit) => (
          <div key={unit.id} className="p-4 bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl space-y-4">

            {/* Config name + delete */}
            <div className="flex justify-between items-start gap-3">
              <input
                type="text"
                value={unit.type}
                onChange={(e) => updateUnit(unit.id, { type: e.target.value })}
                placeholder="e.g. 2 BHK Premium, 2 BHK Classic"
                className="flex-1 bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-sm font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
              />
              <button
                type="button"
                onClick={() => removeUnit(unit.id)}
                className="text-[var(--danger)] p-1 hover:bg-[var(--danger-light)] rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Floor Plan Image Upload */}
            <div className="space-y-2">
              <label className="text-[10px] text-[var(--text-muted)] uppercase font-bold flex items-center gap-1.5">
                <ImageIcon className="w-3 h-3" /> Floor Plan Image
              </label>
              {unit.images?.[0] ? (
                <div className="relative w-full h-40 rounded-lg overflow-hidden border border-[var(--border)] bg-[var(--surface)]">
                  <img
                    src={unit.images[0]}
                    alt="Floor plan"
                    className="w-full h-full object-contain p-2"
                  />
                  <button
                    type="button"
                    onClick={() => removeFloorPlan(unit.id)}
                    className="absolute top-2 right-2 w-6 h-6 bg-[var(--danger)] text-white rounded-full flex items-center justify-center hover:opacity-80 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-[var(--border)] rounded-lg cursor-pointer hover:border-[var(--primary)] hover:bg-[var(--primary)]/5 transition-all">
                  <ImageIcon className="w-8 h-8 text-[var(--text-muted)] mb-2" />
                  <span className="text-xs text-[var(--text-muted)] font-semibold">Upload Floor Plan</span>
                  <span className="text-[10px] text-[var(--text-muted)] mt-0.5">PNG, JPG up to 5MB</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFloorPlanUpload(unit.id, e)}
                  />
                </label>
              )}
            </div>

            {/* Pricing & Details Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] text-[var(--text-muted)] uppercase font-bold">Price Min (₹)</label>
                <div className="flex items-center gap-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg px-2 py-1.5">
                  <IndianRupee className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                  <input
                    type="number"
                    value={unit.priceMin}
                    onChange={(e) => updateUnit(unit.id, { priceMin: Number(e.target.value) })}
                    className="w-full bg-transparent border-none text-xs text-[var(--text-primary)] focus:outline-none"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-[var(--text-muted)] uppercase font-bold">Price Max (₹)</label>
                <div className="flex items-center gap-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg px-2 py-1.5">
                  <IndianRupee className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                  <input
                    type="number"
                    value={unit.priceMax}
                    onChange={(e) => updateUnit(unit.id, { priceMax: Number(e.target.value) })}
                    className="w-full bg-transparent border-none text-xs text-[var(--text-primary)] focus:outline-none"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-[var(--text-muted)] uppercase font-bold">Area (sq.ft)</label>
                <div className="flex items-center gap-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg px-2 py-1.5">
                  <Maximize className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                  <input
                    type="number"
                    value={unit.area}
                    onChange={(e) => updateUnit(unit.id, { area: Number(e.target.value) })}
                    className="w-full bg-transparent border-none text-xs text-[var(--text-primary)] focus:outline-none"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-[var(--text-muted)] uppercase font-bold">Floor</label>
                <select
                  value={unit.floor}
                  onChange={(e) => updateUnit(unit.id, { floor: e.target.value })}
                  className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                >
                  {['Low Floor', 'Mid Floor', 'High Floor', 'Top Floor', 'Ground Floor'].map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-[var(--text-muted)] uppercase font-bold flex items-center gap-1">
                  <Layout className="w-3 h-3" /> Total Units
                </label>
                <input
                  type="number"
                  value={unit.total}
                  onChange={(e) => updateUnit(unit.id, { total: Number(e.target.value) })}
                  className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-[var(--text-muted)] uppercase font-bold">Price / sq.ft (₹)</label>
                <div className="flex items-center gap-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg px-2 py-1.5">
                  <IndianRupee className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                  <input
                    type="number"
                    value={unit.pricePerSqFt}
                    onChange={(e) => updateUnit(unit.id, { pricePerSqFt: Number(e.target.value) })}
                    className="w-full bg-transparent border-none text-xs text-[var(--text-primary)] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Floor Plan URL field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                Floor Plan Image URL
              </label>
              <input
                type="url"
                value={unit.floorPlan || ''}
                onChange={e => updateUnit(unit.id, { floorPlan: e.target.value })}
                placeholder="https://... (paste image URL or upload via admin)"
                className="w-full px-3 py-2.5 bg-[var(--surface-raised)] border border-[var(--border)]
                  rounded-[var(--radius-xs)] text-sm text-[var(--text-primary)]
                  placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)]"
              />
              {unit.floorPlan && (
                <div className="mt-2 rounded-[var(--radius-xs)] overflow-hidden border border-[var(--border)] h-32">
                  <img
                    src={unit.floorPlan}
                    alt="Floor plan preview"
                    className="w-full h-full object-contain bg-[var(--surface-raised)]"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
              )}
              <p className="text-[10px] text-[var(--text-muted)]">
                Each configuration can have its own floor plan (2BHK Type A, 2BHK Type B, etc.)
              </p>
            </div>

            {/* Multi-config BHK tip */}
            <p className="text-[10px] text-[var(--text-muted)] italic">
              💡 For multiple 2 BHK variants with different areas, add separate configurations (e.g. "2 BHK Classic 950sqft", "2 BHK Premium 1100sqft").
            </p>
          </div>
        ))}

        {units.length === 0 && (
          <div className="text-center py-8 text-[var(--text-muted)] text-sm border-2 border-dashed border-[var(--border)] rounded-xl">
            No configurations yet. Click "Add Configuration" to get started.
          </div>
        )}
      </div>
    </div>
  );
}
