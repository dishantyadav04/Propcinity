'use client';

interface QuickQuestionsProps {
  onSelect: (q: string) => void;
  hasCompare?: boolean;
}

export default function QuickQuestions({ onSelect, hasCompare = false }: QuickQuestionsProps) {
  const questions = [
    "Is this safe?",
    "Is it overpriced?",
    "Investment potential?",
    "Biggest risks?",
    "Should I buy now?",
    ...(hasCompare ? ["Compare these two"] : [])
  ];

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {questions.map((q) => (
        <button
          key={q}
          onClick={() => onSelect(q)}
          className="flex-shrink-0 bg-[var(--surface-raised)] border border-[var(--border)] rounded-full px-4 py-2 text-sm text-[var(--text-secondary)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all whitespace-nowrap"
        >
          {q}
        </button>
      ))}
    </div>
  );
}
