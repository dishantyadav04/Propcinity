'use client';

import Skeleton from "@/components/ui/Skeleton";
import { Sparkles } from "lucide-react";

export default function ProjectSkeleton() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Top Banner / Analysis Status Indicator */}
      <div className="bg-[var(--primary-light)]/60 border-b border-[var(--primary)]/20 py-2.5 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3 text-xs font-semibold text-[var(--primary)]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 animate-spin text-[var(--primary)] shrink-0" />
            <span className="truncate">Analyzing Project Data, RERA Verification & AI Match Scoring...</span>
          </div>
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <span className="inline-block w-2 h-2 rounded-full bg-[var(--primary)] animate-ping" />
            <span className="text-[11px] font-mono uppercase tracking-wider">Fetching Live Data</span>
          </div>
        </div>
      </div>

      {/* Mobile Top Header Bar Skeleton */}
      <div className="lg:hidden px-4 py-3 flex justify-between items-center border-b border-[var(--border)] bg-[var(--surface)] sticky top-16 z-40">
        <div className="w-8 h-8 rounded-full bg-[var(--surface-raised)] shimmer" />
        <Skeleton className="h-5 w-40" />
        <div className="flex gap-2">
          <div className="w-8 h-8 rounded-full bg-[var(--surface-raised)] shimmer" />
          <div className="w-8 h-8 rounded-full bg-[var(--surface-raised)] shimmer" />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 md:py-8 space-y-6">
        {/* Breadcrumb Skeleton */}
        <div className="hidden md:flex items-center gap-2">
          <Skeleton className="h-4 w-20" />
          <span className="text-[var(--text-muted)] text-xs">/</span>
          <Skeleton className="h-4 w-24" />
          <span className="text-[var(--text-muted)] text-xs">/</span>
          <Skeleton className="h-4 w-36" />
        </div>

        {/* Hero Gallery Box Skeleton */}
        <div className="relative rounded-[var(--radius-lg)] overflow-hidden bg-[var(--surface-raised)] border border-[var(--border)] h-[240px] sm:h-[340px] md:h-[420px] shadow-[var(--shadow-sm)]">
          <Skeleton className="w-full h-full" />
          
          {/* Badge overlays inside gallery box */}
          <div className="absolute top-4 left-4 flex gap-2">
            <Skeleton className="h-7 w-28 rounded-full" />
            <Skeleton className="h-7 w-32 rounded-full" />
          </div>

          <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
            <div className="space-y-2">
              <Skeleton className="h-8 w-48 sm:w-72 bg-white/40 backdrop-blur-md rounded-lg" />
              <Skeleton className="h-4 w-36 sm:w-56 bg-white/30 backdrop-blur-md rounded-md" />
            </div>
            <Skeleton className="h-9 w-28 rounded-full bg-white/40 backdrop-blur-md hidden sm:block" />
          </div>
        </div>

        {/* Main Details Header Skeleton */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-5 space-y-4 shadow-[var(--shadow-sm)]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-7 w-48 md:w-80" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <div className="flex items-center gap-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-40" />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div>
                <Skeleton className="h-3 w-20 mb-1" />
                <Skeleton className="h-8 w-36" />
              </div>
              <Skeleton className="h-10 w-28 rounded-full" />
            </div>
          </div>
        </div>

        {/* Tab Navigation Skeleton */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide border-b border-[var(--border)]">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-24 shrink-0 rounded-full" />
          ))}
        </div>

        {/* Grid Layout: Main Left (70%) + Sidebar Right (30%) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Left Content */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Why This Fits You / Match Score Card */}
            <div className="bg-[var(--surface-raised)] border border-[var(--border)] rounded-[var(--radius)] p-5 space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-44" />
                <Skeleton className="h-8 w-24 rounded-full" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-[85%]" />
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Skeleton className="h-16 rounded-[var(--radius-xs)]" />
                <Skeleton className="h-16 rounded-[var(--radius-xs)]" />
              </div>
            </div>

            {/* 4 Stat Highlights Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] p-3.5 space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-6 w-24" />
                </div>
              ))}
            </div>

            {/* Overview Section Skeleton */}
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-5 space-y-4">
              <Skeleton className="h-6 w-32" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-[95%]" />
                <Skeleton className="h-4 w-[88%]" />
                <Skeleton className="h-4 w-[70%]" />
              </div>
            </div>

            {/* Unit Configurations Skeleton */}
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-6 w-28 rounded-full" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="border border-[var(--border)] rounded-[var(--radius-sm)] p-4 space-y-3">
                    <Skeleton className="h-36 w-full rounded-[var(--radius-xs)]" />
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-9 w-full rounded-full" />
                  </div>
                ))}
              </div>
            </div>

            {/* Insights / Pros & Cons Skeleton */}
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-5 space-y-4">
              <Skeleton className="h-6 w-40" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2.5 p-4 rounded-[var(--radius-sm)] bg-green-500/5 border border-green-500/10">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-[80%]" />
                </div>
                <div className="space-y-2.5 p-4 rounded-[var(--radius-sm)] bg-amber-500/5 border border-amber-500/10">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-[85%]" />
                </div>
              </div>
            </div>

          </div>

          {/* Sidebar Right (Sticky CTA box) */}
          <div className="space-y-6">
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-5 space-y-5 shadow-[var(--shadow-sm)] lg:sticky lg:top-20">
              <div className="space-y-2">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-9 w-40" />
                <Skeleton className="h-4 w-48" />
              </div>

              <div className="space-y-3 pt-2">
                <Skeleton className="h-11 w-full rounded-full" />
                <Skeleton className="h-11 w-full rounded-full" />
                <Skeleton className="h-11 w-full rounded-full" />
              </div>

              <div className="border-t border-[var(--border)] pt-4 space-y-3">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-12 w-full rounded-lg" />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
