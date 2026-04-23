'use client';

import Link from "next/link";
import { ArrowRight, ShieldCheck, Star, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Nav */}
      <nav className="sticky top-0 z-40 bg-[var(--surface)]/95 backdrop-blur-xl border-b border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[var(--primary)] rounded-[var(--radius-xs)] flex items-center justify-center text-white font-black text-sm">P</div>
            <span className="text-lg font-black text-[var(--text-primary)] tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>PropIQ</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--success-light)] text-[var(--success)] text-xs font-bold rounded-full">
              <ShieldCheck className="w-3 h-3" /> 100% Free for Buyers
            </span>
            <Link href="/onboarding"
              className="px-4 py-2 bg-[var(--primary)] text-white text-sm font-bold rounded-[var(--radius-xs)] hover:opacity-90 transition-opacity">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="max-w-3xl space-y-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-[var(--primary-light)] text-[var(--primary)] text-xs font-bold rounded-full">
            <Star className="w-3 h-3 fill-[var(--primary)]" /> AI-Powered · Zero Brokerage · Pune
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-black text-[var(--text-primary)] leading-[0.95] tracking-tighter"
            style={{ fontFamily: 'var(--font-display)' }}>
            Find the right property.
            <span className="text-[var(--primary)] block">Not just listings.</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="text-lg sm:text-xl text-[var(--text-secondary)] max-w-xl leading-relaxed">
            AI-powered recommendations. Trust scores. Expert advisors.
            We help you buy confidently — for free.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4">
            <Link href="/onboarding"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[var(--primary)] text-white text-base font-bold rounded-[var(--radius)] shadow-[var(--shadow-primary)] hover:opacity-90 transition-opacity">
              Find My Property <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/explore"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[var(--surface)] border-2 border-[var(--border-strong)] text-[var(--text-primary)] text-base font-bold rounded-[var(--radius)] hover:border-[var(--primary)] transition-colors">
              Explore Projects
            </Link>
          </motion.div>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
            className="text-sm text-[var(--text-muted)] flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[var(--success)]" />
            Zero brokerage · Builders pay us · You pay nothing
          </motion.p>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-[var(--border)] bg-[var(--surface)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 grid grid-cols-2 sm:grid-cols-4 gap-8">
          {[
            { value: '60+', label: 'Verified Projects' },
            { value: '₹0', label: 'Buyer Brokerage' },
            { value: '100%', label: 'RERA Verified' },
            { value: 'AI', label: 'Decision Support' },
          ].map(stat => (
            <div key={stat.label} className="text-center space-y-1">
              <p className="text-3xl sm:text-4xl font-black text-[var(--text-primary)]"
                style={{ fontFamily: 'var(--font-display)' }}>{stat.value}</p>
              <p className="text-xs text-[var(--text-muted)] font-semibold uppercase tracking-wider">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24 space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl sm:text-4xl font-black text-[var(--text-primary)] tracking-tight"
            style={{ fontFamily: 'var(--font-display)' }}>How PropIQ works</h2>
          <p className="text-[var(--text-secondary)] max-w-lg mx-auto">We're on your side. Our advisors help you choose the right property — free.</p>
        </div>
        <div className="grid sm:grid-cols-3 gap-6">
          {[
            { icon: '🎯', title: 'Tell us what you want', desc: 'Budget, location, purpose. Takes 60 seconds.' },
            { icon: '🤝', title: 'We find the best matches', desc: 'Curated picks with AI trust scores. No spam listings.' },
            { icon: '🏠', title: 'We guide you through', desc: 'From first visit to possession. Zero brokerage, always.' },
          ].map((step, i) => (
            <div key={i} className="p-6 bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] shadow-[var(--shadow-sm)] card-hover space-y-4">
              <div className="text-4xl">{step.icon}</div>
              <h3 className="text-lg font-bold text-[var(--text-primary)]">{step.title}</h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
        <div className="p-6 sm:p-8 bg-[var(--primary-light)] border border-[var(--primary)]/20 rounded-[var(--radius-lg)] flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <p className="text-lg font-bold text-[var(--text-primary)]">💰 Builders pay us. You don't.</p>
            <p className="text-sm text-[var(--text-secondary)]">We earn commission from builders only when you buy. Your interests always come first.</p>
          </div>
          <Link href="/onboarding"
            className="flex-shrink-0 px-6 py-3 bg-[var(--primary)] text-white text-sm font-bold rounded-[var(--radius)] hover:opacity-90 transition-opacity">
            Start Free →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] bg-[var(--surface)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-[var(--text-muted)]">© 2025 PropIQ. Zero brokerage, always.</p>
          <div className="flex items-center gap-6 text-sm text-[var(--text-muted)]">
            <Link href="#" className="hover:text-[var(--text-primary)] transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-[var(--text-primary)] transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
