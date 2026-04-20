import { UnitConfig } from "@/types/project";
import { formatINR } from "@/lib/finance-calculations";
import { Maximize, Layout, Info } from "lucide-react";
import ConsultationCTA from "@/components/conversion/ConsultationCTA";
import { Project } from "@/types/project";

interface UnitConfigCardProps {
  unit: UnitConfig;
  project: Project;
}

export default function UnitConfigCard({ unit, project }: UnitConfigCardProps) {
  return (
    <div className="bg-[var(--surface-raised)] border border-[var(--border)] rounded-2xl overflow-hidden flex flex-col">
      <div className="p-5 flex-1 space-y-5">
        <div className="flex justify-between items-start">
          <div>
            <h4 className="text-lg font-bold text-[var(--text-primary)]">{unit.type}</h4>
            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider">{unit.area} sq.ft</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-[var(--primary)]">{formatINR(unit.priceMin)}</p>
            <p className="text-[10px] text-[var(--text-muted)] uppercase font-bold">~ {formatINR(unit.pricePerSqFt)} / sq.ft</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center text-[var(--text-muted)]">
              <Maximize className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-[var(--text-muted)] uppercase font-bold">Total Area</p>
              <p className="text-xs font-bold text-[var(--text-primary)]">{unit.area} sq.ft</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center text-[var(--text-muted)]">
              <Layout className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-[var(--text-muted)] uppercase font-bold">Floor</p>
              <p className="text-xs font-bold text-[var(--text-primary)]">{unit.floor}</p>
            </div>
          </div>
        </div>

        {unit.available < 5 && (
          <div className="bg-[var(--danger)]/5 border border-[var(--danger)]/10 px-3 py-2 rounded-lg flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-[var(--danger)]" />
            <span className="text-[10px] font-bold text-[var(--danger)] uppercase tracking-wider">
              Only {unit.available} units left in this block
            </span>
          </div>
        )}
      </div>

      <div className="p-4 bg-[var(--surface)] border-t border-[var(--border)]">
        <ConsultationCTA 
          project={project} 
          unitConfig={unit} 
          variant="outline" 
          triggerSource={`unit_card_${unit.id}`} 
        />
      </div>
    </div>
  );
}
