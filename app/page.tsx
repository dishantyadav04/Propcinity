'use client';

import { motion } from "framer-motion";
import Link from "next/link";
import { Sparkles, ShieldCheck, MapPin, Search, ArrowRight } from "lucide-react";
import FreeBuyerBadge from "@/components/trust/FreeBuyerBadge";
import ZeroBrokerageBanner from "@/components/trust/ZeroBrokerageBanner";
import HowWeWorkSection from "@/components/trust/HowWeWorkSection";

export default function LandingPage() {
  return (
    <div className="relative overflow-hidden bg-[var(--background)] min-h-screen">
      <ZeroBrokerageBanner />
      
      {/* Hero Section */}
      <section className="relative px-6 pt-20 pb-16 space-y-8 max-w-md mx-auto">
        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 bg-[var(--primary)]/10 border border-[var(--primary)]/20 rounded-full"
          >
            <Sparkles className="w-3 h-3 text-[var(--primary)]" />
            <span className="text-[10px] font-bold text-[var(--primary)] uppercase tracking-wider">Premium Intelligence</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-black text-[var(--text-primary)] leading-[0.95] tracking-tighter"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            THE TRUSTED WAY TO BUY YOUR HOME
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-[var(--text-secondary)] text-sm leading-relaxed"
          >
            PropIQ is the only platform that uses AI and real audits to protect you from builder risks. Verified projects. Zero brokerage.
          </motion.p>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          <Link 
            href="/onboarding"
            className="w-full flex items-center justify-center gap-2 bg-[var(--primary)] text-white font-bold py-5 rounded-[var(--radius)] shadow-lg shadow-[var(--primary)]/20 active:scale-95 transition-all"
          >
            <span>Find My Dream Home</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
          <div className="flex justify-center">
            <FreeBuyerBadge variant="inline" />
          </div>
        </motion.div>
      </section>

      {/* Trust Stats */}
      <section className="px-6 py-8 bg-[var(--surface-raised)] border-y border-[var(--border)]">
        <div className="max-w-md mx-auto grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-2xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>60+</p>
            <p className="text-[10px] text-[var(--text-muted)] uppercase font-bold">Audited Projects</p>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>100%</p>
            <p className="text-[10px] text-[var(--text-muted)] uppercase font-bold">RERA Verified</p>
          </div>
        </div>
      </section>

      <HowWeWorkSection />

      {/* CTA Footer */}
      <section className="px-6 py-12 text-center space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-[var(--text-primary)] leading-tight">Ready to see verified properties?</h2>
          <p className="text-sm text-[var(--text-secondary)]">Take a 60s quiz to get AI recommendations.</p>
        </div>
        <Link 
          href="/onboarding"
          className="inline-flex items-center justify-center gap-2 bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text-primary)] font-bold py-4 px-8 rounded-[var(--radius)]"
        >
          Get Started
        </Link>
      </section>
    </div>
  );
}
