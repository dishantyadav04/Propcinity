import { Building2, Award, History, Info } from "lucide-react";

interface BuilderProfileProps {
  name: string;
  experience: string;
  projectsDelivered: number;
}

export default function BuilderProfile({ name, experience, projectsDelivered }: BuilderProfileProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 bg-[var(--surface-raised)] border border-[var(--border)] rounded-2xl flex items-center justify-center">
          <Building2 className="w-7 h-7 text-[var(--primary)]" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>{name}</h3>
          <p className="text-xs text-[var(--text-muted)] uppercase tracking-widest">Verified Developer</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl p-4 space-y-1">
          <div className="flex items-center gap-2 text-[var(--primary)]">
            <History className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase">Experience</span>
          </div>
          <p className="text-lg font-bold text-[var(--text-primary)]">{experience}</p>
        </div>
        <div className="bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl p-4 space-y-1">
          <div className="flex items-center gap-2 text-[var(--success)]">
            <Award className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase">Delivered</span>
          </div>
          <p className="text-lg font-bold text-[var(--text-primary)]">{projectsDelivered}+ Projects</p>
        </div>
      </div>

      <div className="flex items-start gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
        <Info className="w-4 h-4 text-[var(--text-muted)] mt-0.5 shrink-0" />
        <p className="text-[11px] leading-relaxed text-[var(--text-secondary)]">
          Propcinity audits builders based on delivery track record, legal compliance, and customer satisfaction scores. {name} has a strong presence in this micro-market.
        </p>
      </div>
    </div>
  );
}
