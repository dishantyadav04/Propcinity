'use client';

import { Plus, Trash2, Maximize, Layout, IndianRupee } from "lucide-react";
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-widest">Inventory & Pricing</h3>
        <button 
          onClick={addUnit}
          className="flex items-center gap-2 px-3 py-1.5 bg-[var(--primary)]/10 text-[var(--primary)] rounded-lg text-xs font-bold hover:bg-[var(--primary)]/20 transition-all"
        >
          <Plus className="w-3.5 h-3.5" /> Add Configuration
        </button>
      </div>

      <div className="space-y-4">
        {units.map((unit) => (
          <div key={unit.id} className="p-4 bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl space-y-4">
            <div className="flex justify-between items-start">
              <input 
                type="text" 
                value={unit.type}
                onChange={(e) => updateUnit(unit.id, { type: e.target.value })}
                className="bg-transparent border-none p-0 text-sm font-bold text-[var(--text-primary)] focus:outline-none"
              />
              <button onClick={() => removeUnit(unit.id)} className="text-[var(--danger)] p-1">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

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
                <label className="text-[10px] text-[var(--text-muted)] uppercase font-bold">Available</label>
                <input 
                  type="number" 
                  value={unit.available}
                  onChange={(e) => updateUnit(unit.id, { available: Number(e.target.value) })}
                  className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
