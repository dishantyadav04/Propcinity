'use client';

import { ShieldCheck } from "lucide-react";
import AIResponseSkeleton from "./AIResponseSkeleton";
import InsightsPanel from "@/components/property/InsightsPanel";
import { Project } from "@/types/project";

interface AIResponseProps {
  answer: string;
  provider: 'openai' | 'claude' | 'none';
  project: Project;
  isLoading: boolean;
}

export default function AIResponse({ answer, provider, project, isLoading }: AIResponseProps) {
  if (isLoading) return <AIResponseSkeleton />;

  if (provider === 'none') {
    return (
      <div className="p-4 bg-[var(--danger)]/10 border border-[var(--danger)]/20 rounded-[var(--radius)] text-[var(--danger)] text-sm">
        AI is currently unavailable. Please try again later.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-[var(--surface-raised)] rounded-[var(--radius)] border border-[var(--border)] p-4 space-y-4">
        <p className="text-sm leading-relaxed text-[var(--text-primary)]">
          {answer}
        </p>

        <div className="pt-4 border-t border-[var(--border)] space-y-3">
          <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Supporting Data</p>
          <InsightsPanel 
            pros={project.pros} 
            cons={project.cons} 
            variant="card" 
          />
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)]">
            <ShieldCheck className="w-3 h-3 text-[var(--success)]" />
            <span>Based on verified project data</span>
          </div>
          <span className="text-[10px] text-[var(--text-muted)] uppercase bg-[var(--surface)] px-1.5 py-0.5 rounded border border-[var(--border)]">
            {provider}
          </span>
        </div>
      </div>
    </div>
  );
}
