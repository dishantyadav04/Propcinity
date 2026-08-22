import { SHOW_BUILDER_SCORE } from "@/lib/feature-flags";
import { Building2, Award, History, Info } from "lucide-react";

interface BuilderProfileProps {
  name: string;
  experience: string;
  projectsDelivered: number | undefined;
  builderScore?: number;
  scoreBreakdown?: Record<string, number>;
}

function scoreColor(score: number) {
  if (score >= 75) return '#22c55e';
  if (score >= 50) return '#f59e0b';
  return '#ef4444';
}

function BuilderScoreRing({ score }: { score: number }) {
  const r = 20, circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div className="relative w-14 h-14 flex items-center justify-center" title={`Builder Score: ${score}/100`}>
      <svg className="absolute" width="56" height="56" viewBox="0 0 56 56">
        <circle cx="28" cy="28" r={r} fill="none" stroke="var(--border)" strokeWidth="4" />
        <circle
          cx="28" cy="28" r={r} fill="none"
          stroke={scoreColor(score)} strokeWidth="4"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 28 28)"
        />
      </svg>
      <span className="text-xs font-bold" style={{ color: scoreColor(score) }}>{score}</span>
    </div>
  );
}

export default function BuilderProfile({ name, experience, projectsDelivered, builderScore, scoreBreakdown }: BuilderProfileProps) {
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
        {SHOW_BUILDER_SCORE && builderScore !== undefined && (
          <BuilderScoreRing score={builderScore} />
        )}
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
          <p className="text-lg font-bold text-[var(--text-primary)]">
            {projectsDelivered != null ? `${projectsDelivered}+ Projects` : 'N/A'}
          </p>
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
