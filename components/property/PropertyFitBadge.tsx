import { Target } from "lucide-react";
import { cn } from "@/lib/utils";

interface PropertyFitBadgeProps {
  score: number;
}

export default function PropertyFitBadge({ score }: PropertyFitBadgeProps) {
  const colorClass = 
    score >= 80 ? "bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20" :
    score >= 60 ? "bg-[var(--warning)]/10 text-[var(--warning)] border-[var(--warning)]/20" :
    "bg-[var(--surface-raised)] text-[var(--text-muted)] border-[var(--border)]";

  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border backdrop-blur-md",
      colorClass
    )}>
      <Target className="w-3 h-3" />
      <span>{score}% match</span>
    </div>
  );
}
