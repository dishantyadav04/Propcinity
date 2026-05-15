'use client';

import { CalendarDays, Sparkles } from "lucide-react";
import { Project, UnitConfig } from "@/types/project";
import { trackConsultationStarted } from "@/lib/posthog-events";
import FreeBuyerBadge from "@/components/trust/FreeBuyerBadge";
import { cn } from "@/lib/utils";

interface ConsultationCTAProps {
  project: Project;
  unitConfig?: UnitConfig;
  variant: 'primary' | 'outline' | 'sticky';
  triggerSource: string;
}

export default function ConsultationCTA({ project, unitConfig, variant, triggerSource }: ConsultationCTAProps) {
  const handleClick = () => {
    trackConsultationStarted({
      projectId: project.id,
      triggerSource
    });
    // This will be handled by the parent or a global state to open the LeadQualificationSheet
    window.dispatchEvent(new CustomEvent('open-qualification-sheet', {
      detail: { project, unitConfig }
    }));
  };

  if (variant === 'primary') {
    return (
      <div className="space-y-3">
        <button
          onClick={handleClick}
          className="w-full flex items-center justify-center gap-2 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white font-bold py-4 rounded-[var(--radius)] transition-all shadow-lg shadow-[var(--primary)]/20"
        >
          <CalendarDays className="w-5 h-5" />
          <span>Talk to a Property Advisor</span>
        </button>
        <div className="flex justify-center">
          <FreeBuyerBadge variant="inline" />
        </div>
      </div>
    );
  }

  if (variant === 'outline') {
    return (
      <button
        onClick={handleClick}
        className="w-full border border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary)]/5 font-bold py-4 rounded-[var(--radius)] transition-all"
      >
        Free Expert Consultation
      </button>
    );
  }

  if (variant === 'sticky') {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[var(--surface)]/90 backdrop-blur-xl border-t border-[var(--border)] pb-[env(safe-area-inset-bottom)] p-4 space-y-4">
        <div className="flex justify-center">
          <FreeBuyerBadge variant="inline" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleClick}
            className="flex items-center justify-center gap-2 bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text-primary)] font-bold py-3.5 rounded-[var(--radius)] transition-all"
          >
            <CalendarDays className="w-4 h-4 text-[var(--primary)]" />
            <span className="text-sm">Talk to Advisor</span>
          </button>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('open-ai-modal', { detail: { project } }))}
            className="flex items-center justify-center gap-2 bg-[var(--primary)] text-white font-bold py-3.5 rounded-[var(--radius)] transition-all shadow-lg shadow-[var(--primary)]/20"
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-sm">Ask AI</span>
          </button>
        </div>
      </div>
    );
  }

  return null;
}
