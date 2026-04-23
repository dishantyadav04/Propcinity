'use client';

import Link from "next/link";
import { ArrowRight, ShieldCheck, Star, Building2, MapPin, TrendingUp, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

// Inline SVG background — architectural city silhouette
function CitySilhouette() {
  return (
    <svg
      className="absolute inset-0 w-full h-full"
      viewBox="0 0 1440 600"
      preserveAspectRatio="xMidYMax slice"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFF8F5" />
          <stop offset="100%" stopColor="#FAFAF8" />
        </linearGradient>
        <linearGradient id="buildingGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F0EDE8" />
          <stop offset="100%" stopColor="#E8E3DC" />
        </linearGradient>
      </defs>
      <rect width="1440" height="600" fill="url(#skyGrad)" />

      {/* Far background buildings — very light */}
      <g fill="#EDE9E3" opacity="0.6">
        <rect x="0" y="320" width="80" height="280" rx="2" />
        <rect x="70" y="280" width="50" height="320" rx="2" />
        <rect x="110" y="300" width="90" height="300" rx="2" />
        <rect x="190" y="260" width="60" height="340" rx="2" />
        <rect x="240" y="290" width="100" height="310" rx="2" />
        <rect x="330" y="250" width="70" height="350" rx="2" />
        <rect x="1100" y="290" width="80" height="310" rx="2" />
        <rect x="1170" y="260" width="60" height="340" rx="2" />
        <rect x="1220" y="280" width="100" height="320" rx="2" />
        <rect x="1310" y="250" width="70" height="350" rx="2" />
        <rect x="1370" y="300" width="70" height="300" rx="2" />
      </g>

      {/* Mid buildings */}
      <g fill="url(#buildingGrad)" opacity="0.8">
        <rect x="380" y="200" width="100" height="400" rx="3" />
        <rect x="370" y="180" width="30" height="220" rx="2" />
        <rect x="490" y="240" width="80" height="360" rx="3" />
        <rect x="560" y="160" width="120" height="440" rx="3" />
        <rect x="550" y="140" width="40" height="180" rx="2" />
        <rect x="690" y="220" width="90" height="380" rx="3" />
        <rect x="770" y="180" width="110" height="420" rx="3" />
        <rect x="760" y="155" width="35" height="200" rx="2" />
        <rect x="890" y="230" width="85" height="370" rx="3" />
        <rect x="960" y="200" width="100" height="400" rx="3" />
        <rect x="1050" y="240" width="70" height="360" rx="3" />
      </g>

      {/* Windows — small dots on buildings */}
      <g fill="white" opacity="0.5">
        {[400, 420, 440, 460, 480, 500, 520, 540].map(y =>
          [390, 410, 430, 450].map(x => (
            <rect key={`${x}-${y}`} x={x} y={y} width="6" height="8" rx="1" />
          ))
        )}
        {[180, 200, 220, 240, 260, 280, 300, 320, 340, 360].map(y =>
          [575, 595, 615, 635, 655].map(x => (
            <rect key={`${x}-${y}`} x={x} y={y} width="6" height="8" rx="1" />
          ))
        )}
        {[200, 220, 240, 260, 280, 300, 320, 340].map(y =>
          [785, 805, 825, 845].map(x => (
            <rect key={`${x}-${y}`} x={x} y={y} width="6" height="8" rx="1" />
          ))
        )}
      </g>

      {/* Ground line */}
      <rect x="0" y="590" width="1440" height="10" fill="#EDE9E3" opacity="0.6" />

      {/* Soft gradient overlay — fades bottom to white for content readability */}
      <defs>
        <linearGradient id="fadeBottom" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FAFAF8" stopOpacity="0" />
          <stop offset="60%" stopColor="#FAFAF8" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#FAFAF8" stopOpacity="1" />
        </linearGradient>
      </defs>
      <rect width="1440" height="600" fill="url(#fadeBottom)" />

      {/* Left fade for text readability */}
      <defs>
        <linearGradient id="fadeLeft" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#FAFAF8" stopOpacity="1" />
          <stop offset="50%" stopColor="#FAFAF8" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#FAFAF8" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="700" height="600" fill="url(#fadeLeft)" />
    </svg>
  );
}

// Floating stat card component
function StatCard({ icon: Icon, value, label, delay }: {
  icon: React.ComponentType<{ className?: string }>;
  value: string; label: string; delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="flex items-center gap-4 bg-white/95 backdrop-blur-md
        border border-[var(--border)] rounded-[var(--radius)] px-5 py-4
        shadow-[var(--shadow-lg)]"
    >
      <div className="w-11 h-11 bg-[var(--primary-light)] rounded-[var(--radius-sm)]
        flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-[var(--primary)]" />
      </div>
      <div>
        <p className="text-xl font-black text-[var(--text-primary)] leading-none"
          style={{ fontFamily: 'var(--font-display)' }}>{value}</p>
        <p className="text-xs text-[var(--text-muted)] font-bold mt-1 uppercase tracking-tight">{label}</p>
      </div>
    </motion.div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] overflow-x-hidden">

      {/* ── Nav ─────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <span className="text-xl font-black text-[var(--text-primary)] tracking-tight"
            style={{ fontFamily: 'var(--font-display)' }}>
            Prop<span className="text-[var(--primary)]">IQ</span>
          </span>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5
              bg-[var(--success-light)] text-[var(--success)] text-xs font-bold rounded-full">
              <ShieldCheck className="w-3 h-3" /> 100% Free for Buyers
            </span>
            <Link href="/onboarding"
              className="px-4 py-2 bg-[var(--primary)] text-white text-sm font-bold
                rounded-[var(--radius-xs)] hover:opacity-90 transition-opacity shadow-[var(--shadow-primary)]">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="relative min-h-[88vh] flex items-center overflow-hidden">
        <CitySilhouette />

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 w-full py-24 sm:py-32">
          <div className="max-w-2xl space-y-8">

            {/* Eyebrow */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1.5
                bg-[var(--primary-light)] text-[var(--primary)] text-xs font-bold rounded-full
                border border-[var(--primary)]/20">
              <Star className="w-3 h-3 fill-[var(--primary)]" />
              AI-Powered · Zero Brokerage · Pune
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl sm:text-6xl lg:text-7xl font-black text-[var(--text-primary)]
                leading-[1.0] tracking-tighter"
              style={{ fontFamily: 'var(--font-display)' }}>
              Find the right<br />
              property.<br />
              <span className="text-[var(--primary)]">Not just listings.</span>
            </motion.h1>

            {/* Subtext */}
            <motion.p
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg sm:text-xl text-[var(--text-secondary)] max-w-lg leading-relaxed">
              AI recommendations. Trust scores. Expert advisors.
              We protect buyers from builder risks — completely free.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4">
              <Link href="/onboarding"
                className="inline-flex items-center justify-center gap-2 px-8 py-4
                  bg-[var(--primary)] text-white text-base font-bold rounded-[var(--radius)]
                  shadow-[var(--shadow-primary)] hover:opacity-90 transition-opacity">
                Find My Property <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/explore"
                className="inline-flex items-center justify-center gap-2 px-8 py-4
                  bg-white border-2 border-[var(--border-strong)] text-[var(--text-primary)]
                  text-base font-bold rounded-[var(--radius)] hover:border-[var(--primary)]
                  transition-colors">
                Explore Projects
              </Link>
            </motion.div>

            {/* Trust line */}
            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-sm text-[var(--text-muted)] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[var(--success)]" />
              Zero brokerage · Builders pay us · You pay nothing
            </motion.p>
          </div>

          {/* Floating stat cards — desktop only, top-right area */}
          <div className="hidden lg:flex flex-col gap-4 absolute right-0 top-1/2 -translate-y-1/2">
            <StatCard icon={Building2} value="60+" label="Audited projects" delay={0.5} />
            <StatCard icon={ShieldCheck} value="100%" label="RERA verified" delay={0.6} />
            <StatCard icon={MapPin} value="Pune" label="Serving Buyers" delay={0.7} />
            <StatCard icon={TrendingUp} value="₹0" label="Brokerage Fees" delay={0.8} />
          </div>
        </div>
      </section>

      {/* ── Mobile stats ────────────────────────────────────── */}
      <section className="lg:hidden border-y border-[var(--border)] bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10
          grid grid-cols-2 gap-y-10 gap-x-6">
          {[
            { icon: Building2, value: '60+', label: 'Verified Projects' },
            { icon: TrendingUp, value: '₹0', label: 'Buyer Brokerage' },
            { icon: ShieldCheck, value: '100%', label: 'RERA Verified' },
            { icon: Star, value: 'AI', label: 'Decision Support' },
          ].map(stat => (
            <div key={stat.label} className="text-center space-y-2">
              <div className="mx-auto w-10 h-10 bg-[var(--primary-light)] rounded-full flex items-center justify-center mb-2">
                <stat.icon className="w-5 h-5 text-[var(--primary)]" />
              </div>
              <p className="text-4xl font-black text-[var(--text-primary)]"
                style={{ fontFamily: 'var(--font-display)' }}>{stat.value}</p>
              <p className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-widest">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-28 sm:py-36 space-y-16">
        <div className="text-center space-y-4">
          <h2 className="text-3xl sm:text-4xl font-black text-[var(--text-primary)] tracking-tight"
            style={{ fontFamily: 'var(--font-display)' }}>How PropIQ works</h2>
          <p className="text-[var(--text-secondary)] max-w-lg mx-auto text-lg">
            We're on your side — our advisors help you choose right, for free.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-6">
          {[
            {
              step: '01',
              icon: '🎯',
              title: 'Tell us what you want',
              desc: 'Budget, location, purpose. 60 second quiz. We build your buyer profile.',
            },
            {
              step: '02',
              icon: '🤝',
              title: 'We curate your matches',
              desc: 'AI trust scores, honest pros & cons, no listing overload. Only 5–10 picks.',
            },
            {
              step: '03',
              icon: '🏠',
              title: 'We guide you through',
              desc: 'Expert advisor, site visit, till possession. Zero brokerage, always.',
            },
          ].map((step) => (
            <div key={step.step}
              className="relative p-6 bg-white border border-[var(--border)]
                rounded-[var(--radius)] shadow-[var(--shadow-sm)] card-hover space-y-4">
              <span className="text-[11px] font-black text-[var(--primary)] uppercase tracking-widest">
                Step {step.step}
              </span>
              <div className="text-4xl">{step.icon}</div>
              <h3 className="text-lg font-bold text-[var(--text-primary)]"
                style={{ fontFamily: 'var(--font-display)' }}>{step.title}</h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>

        {/* Zero brokerage banner */}
        <div className="p-6 sm:p-8 bg-[var(--primary)] rounded-[var(--radius-lg)]
          flex flex-col sm:flex-row items-center justify-between gap-6 shadow-[var(--shadow-primary)]">
          <div className="space-y-1 text-center sm:text-left">
            <p className="text-xl font-black text-white"
              style={{ fontFamily: 'var(--font-display)' }}>
              💰 Builders pay us. You don't.
            </p>
            <p className="text-white/80 text-sm">
              We earn commission from builders when you buy. Your interests always come first.
            </p>
          </div>
          <Link href="/onboarding"
            className="flex-shrink-0 px-8 py-3.5 bg-white text-[var(--primary)]
              text-sm font-black rounded-[var(--radius)] hover:opacity-90 transition-opacity">
            Start Free →
          </Link>
        </div>
      </section>

      {/* ── Trust section ───────────────────────────────────── */}
      <section className="bg-[var(--surface-raised)] border-y border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 space-y-10">
          <h2 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight text-center"
            style={{ fontFamily: 'var(--font-display)' }}>
            PropIQ vs other platforms
          </h2>
          <div className="grid sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
            <div className="p-6 bg-white rounded-[var(--radius)] border border-[var(--border)]">
              <p className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest mb-4">
                Others
              </p>
              <ul className="space-y-3">
                {[
                  'Hundreds of listings to scroll',
                  'Broker calls within minutes',
                  'No guidance, just listings',
                  'You pay brokerage',
                  'Gone after booking',
                ].map(item => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-[var(--text-secondary)]">
                    <span className="w-4 h-4 rounded-full bg-[var(--danger-light)] text-[var(--danger)]
                      flex items-center justify-center text-[10px] font-black flex-shrink-0">✕</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-6 bg-[var(--primary-light)] rounded-[var(--radius)]
              border-2 border-[var(--primary)]/30">
              <p className="text-xs font-black text-[var(--primary)] uppercase tracking-widest mb-4">
                PropIQ
              </p>
              <ul className="space-y-3">
                {[
                  '5–10 curated picks only',
                  'Expert advisor, your timeline',
                  'Trust scores + AI analysis',
                  '100% free for buyers',
                  'With you till possession',
                ].map(item => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-[var(--text-primary)] font-medium">
                    <CheckCircle2 className="w-4 h-4 text-[var(--success)] flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer CTA ──────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20 text-center space-y-6">
        <h2 className="text-3xl sm:text-4xl font-black text-[var(--text-primary)] tracking-tight"
          style={{ fontFamily: 'var(--font-display)' }}>
          Ready to find your right property?
        </h2>
        <p className="text-[var(--text-secondary)] max-w-md mx-auto">
          Takes 60 seconds. No broker calls. No spam. Just the right property for you.
        </p>
        <Link href="/onboarding"
          className="inline-flex items-center gap-2 px-10 py-4 bg-[var(--primary)] text-white
            text-base font-bold rounded-[var(--radius)] shadow-[var(--shadow-primary)]
            hover:opacity-90 transition-opacity">
          Find My Property <ArrowRight className="w-4 h-4" />
        </Link>
      </section>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="border-t border-[var(--border)] bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8
          flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-base font-black text-[var(--text-primary)]"
            style={{ fontFamily: 'var(--font-display)' }}>
            Prop<span className="text-[var(--primary)]">IQ</span>
          </span>
          <p className="text-sm text-[var(--text-muted)]">© 2025 PropIQ. Zero brokerage, always.</p>
          <div className="flex items-center gap-6 text-sm text-[var(--text-muted)]">
            <Link href="/privacy" className="hover:text-[var(--text-primary)] transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-[var(--text-primary)] transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
