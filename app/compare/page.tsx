'use client';

import SectionContainer from "@/components/layout/SectionContainer";
import { GitCompare, Plus } from "lucide-react";
import Link from "next/link";

export default function ComparePage() {
  return (
    <SectionContainer wide className="min-h-[80vh] flex flex-col items-center justify-center text-center space-y-6">
      <div className="w-20 h-20 bg-[var(--surface-raised)] rounded-full flex items-center justify-center mb-4">
        <GitCompare className="w-8 h-8 text-[var(--text-secondary)]" />
      </div>
      <h1 className="text-3xl font-black text-[var(--text-primary)] tracking-tight"
        style={{ fontFamily: 'var(--font-display)' }}>Compare Projects</h1>
      <p className="text-[var(--text-secondary)] max-w-md mx-auto">
        Select up to 3 projects to compare side-by-side. See prices, amenities, trust scores, and ROI in one view.
      </p>
      <Link href="/explore"
        className="mt-4 inline-flex items-center justify-center gap-2 px-6 py-3 bg-[var(--surface)] border-2 border-[var(--border-strong)] text-[var(--text-primary)] text-sm font-bold rounded-[var(--radius)] hover:border-[var(--primary)] transition-colors">
        <Plus className="w-4 h-4" /> Add Projects to Compare
      </Link>
    </SectionContainer>
  );
}
