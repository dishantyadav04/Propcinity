import { CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimelineSectionProps {
  reraNumber: string;
  possessionDate: string;
  launchDate: string;
}

export default function TimelineSection({ reraNumber, possessionDate, launchDate }: TimelineSectionProps) {
  const steps = [
    { label: 'Project Launch', date: launchDate, completed: true },
    { label: 'Current Progress', date: 'Under Construction', completed: false, active: true },
    { label: 'Completion & Possession', date: possessionDate, completed: false }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">Project Timeline</h3>
        <div className="bg-[var(--success)]/10 border border-[var(--success)]/20 px-2 py-1 rounded text-[10px] font-bold text-[var(--success)] uppercase">
          RERA: {reraNumber}
        </div>
      </div>

      <div className="relative pl-6 space-y-8 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[var(--border)]">
        {steps.map((step, i) => (
          <div key={i} className="relative">
            <div className={cn(
              "absolute -left-[22px] top-0.5 w-4 h-4 rounded-full border-2 bg-[var(--surface)] flex items-center justify-center",
              step.completed ? "border-[var(--success)] text-[var(--success)]" : step.active ? "border-[var(--primary)]" : "border-[var(--border)]"
            )}>
              {step.completed ? <CheckCircle2 className="w-3 h-3" /> : step.active ? <div className="w-1.5 h-1.5 bg-[var(--primary)] rounded-full animate-pulse" /> : null}
            </div>
            <div className="space-y-0.5">
              <p className={cn("text-xs font-bold uppercase tracking-wider", step.completed ? "text-[var(--text-muted)]" : "text-[var(--text-primary)]")}>
                {step.label}
              </p>
              <p className="text-sm text-[var(--text-secondary)]">{step.date}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
