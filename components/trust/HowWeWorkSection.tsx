import { Search, Handshake, Home, ShieldCheck, Target, Zap } from "lucide-react";

const steps = [
  {
    icon: Search,
    title: "Preference Mapping",
    description: "Our AI maps your budget and lifestyle goals to the market."
  },
  {
    icon: Target,
    title: "Deep-Audit Matching",
    description: "We filter thousands of units to find your 99% accuracy matches."
  },
  {
    icon: Zap,
    title: "Risk-Free Closing",
    description: "Expert guidance from legal audit to possession. Always free."
  }
];

export default function HowWeWorkSection() {
  return (
    <section className="py-20 px-6 space-y-12 max-w-md mx-auto">
      <div className="text-center space-y-3">
        <h2 className="text-3xl font-black text-[var(--text-primary)] leading-tight" style={{ fontFamily: 'var(--font-display)' }}>The PropIQ Path</h2>
        <p className="text-[var(--text-secondary)] font-medium">Unbiased intelligence for the biggest decision of your life.</p>
      </div>

      <div className="space-y-4">
        {steps.map((step, index) => (
          <div 
            key={index}
            className="glass p-6 rounded-[24px] flex items-start gap-5 border-black/[0.03]"
          >
            <div className="w-12 h-12 bg-[var(--primary)]/5 rounded-2xl flex-shrink-0 flex items-center justify-center">
              <step.icon className="w-6 h-6 text-[var(--primary)]" />
            </div>
            <div className="space-y-1">
              <h3 className="font-black text-lg text-[var(--text-primary)] leading-tight">{step.title}</h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium">{step.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="glass-strong border-[var(--primary)]/10 rounded-[24px] p-8 text-center space-y-4 relative overflow-hidden shadow-xl shadow-slate-200/50">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-[var(--primary)]/5 blur-[40px] pointer-events-none" />
        <div className="space-y-2 relative">
          <p className="text-xl font-black text-[var(--text-primary)]">Builders pay us. <span className="text-[var(--primary)]">You don't.</span></p>
          <p className="text-[11px] text-[var(--text-muted)] leading-relaxed font-bold uppercase tracking-wider">
            100% Unbiased. 100% Free for buyers.
          </p>
        </div>
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium">
          We earn commissions from developers only upon successful possession, allowing us to offer premium intelligence to you at zero cost.
        </p>
      </div>
    </section>
  );
}
