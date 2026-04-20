import { Search, Handshake, Home } from "lucide-react";

const steps = [
  {
    icon: Search,
    title: "You tell us what you want",
    description: "Budget, location, purpose. We listen."
  },
  {
    icon: Handshake,
    title: "We find the right projects",
    description: "Curated picks. Trust scores. No spam listings."
  },
  {
    icon: Home,
    title: "We help you all the way",
    description: "From first visit to possession. Free, always."
  }
];

export default function HowWeWorkSection() {
  return (
    <section className="py-12 px-6 space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-[var(--text-primary)]">How PropIQ Works</h2>
        <p className="text-[var(--text-secondary)]">We're on your side. Always.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 overflow-x-auto pb-4 md:pb-0 scrollbar-hide">
        {steps.map((step, index) => (
          <div 
            key={index}
            className="flex-shrink-0 w-full bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-6 space-y-4"
          >
            <div className="w-12 h-12 bg-[var(--primary)]/10 rounded-full flex items-center justify-center">
              <step.icon className="w-6 h-6 text-[var(--primary)]" />
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-lg text-[var(--text-primary)]">{step.title}</h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{step.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-[var(--primary-glow)] border border-[var(--primary)]/20 rounded-[var(--radius)] p-6 text-center space-y-3">
        <p className="text-xl font-bold text-[var(--text-primary)]">💰 Builders pay us. You don't.</p>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed max-w-lg mx-auto">
          We're channel partners with leading developers. Revenue from builder commissions — only when you buy.
        </p>
      </div>
    </section>
  );
}
