'use client';

import SectionContainer from "@/components/layout/SectionContainer";
import { Heart, Search } from "lucide-react";
import Link from "next/link";

export default function SavedPage() {
  return (
    <SectionContainer wide className="min-h-[80vh] flex flex-col items-center justify-center text-center space-y-6">
      <div className="w-20 h-20 bg-[var(--primary-light)] rounded-full flex items-center justify-center mb-4">
        <Heart className="w-8 h-8 text-[var(--primary)]" />
      </div>
      <h1 className="text-3xl font-black text-[var(--text-primary)] tracking-tight"
        style={{ fontFamily: 'var(--font-display)' }}>No saved projects yet</h1>
      <p className="text-[var(--text-secondary)] max-w-md mx-auto">
        When you find a property you like, tap the heart icon to save it here for easy comparison later.
      </p>
      <Link href="/explore"
        className="mt-4 inline-flex items-center justify-center gap-2 px-6 py-3 bg-[var(--primary)] text-white text-sm font-bold rounded-[var(--radius)] shadow-[var(--shadow-primary)] hover:opacity-90 transition-opacity">
        <Search className="w-4 h-4" /> Start Exploring
      </Link>
    </SectionContainer>
  );
}
