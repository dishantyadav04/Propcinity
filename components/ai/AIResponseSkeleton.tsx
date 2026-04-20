import Skeleton from "@/components/ui/Skeleton";

export default function AIResponseSkeleton() {
  return (
    <div className="space-y-4 p-4 bg-[var(--surface-raised)] rounded-[var(--radius)] border border-[var(--border)]">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-[var(--primary)] rounded-full animate-pulse" />
        <span className="text-xs text-[var(--text-muted)] italic">Analyzing project data...</span>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-[90%]" />
        <Skeleton className="h-4 w-[75%]" />
      </div>
    </div>
  );
}
