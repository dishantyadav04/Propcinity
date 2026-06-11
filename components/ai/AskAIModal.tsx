'use client';

import { useState } from "react";
import Image from "next/image";
import { Drawer } from "vaul";
import { Sparkles, X, ArrowRight, Loader2, Building2 } from "lucide-react";
import QuickQuestions from "./QuickQuestions";
import AIResponse from "./AIResponse";
import { Project } from "@/types/project";
import { trackAIQuestionAsked } from "@/lib/posthog-events";

interface AskAIModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  compareProject?: Project;
}

export default function AskAIModal({ isOpen, onClose, project, compareProject }: AskAIModalProps) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [provider, setProvider] = useState<'openai' | 'none'>('none');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (q: string) => {
    if (!q.trim() || isLoading) return;
    
    setIsLoading(true);
    setAnswer("");
    trackAIQuestionAsked({ projectId: project.id, questionType: q });

    try {
      const response = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          compareProjectIds: compareProject?.id ? [compareProject.id] : undefined,
          question: q
        })
      });

      const data = await response.json();
      setAnswer(data.answer);
      setProvider(data.provider);
    } catch (e) {
      setProvider('none');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Drawer.Root open={isOpen} onOpenChange={onClose}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 mt-24 flex flex-col rounded-t-[20px] bg-[var(--surface)] border-t border-[var(--border)] max-h-[96vh] focus:outline-none">
          <div className="mx-auto mt-3 h-1.5 w-12 shrink-0 rounded-full bg-[var(--border)]" />
          
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-[var(--primary)]">
                  <Sparkles className="w-5 h-5" />
                  <h2 className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>AI Decision Assistant</h2>
                </div>
                <p className="text-xs text-[var(--text-muted)]">Powered by real project data · No hallucinations</p>
              </div>
              <button onClick={onClose} className="p-2 bg-[var(--surface-raised)] rounded-full">
                <X className="w-4 h-4 text-[var(--text-muted)]" />
              </button>
            </div>

            {/* Context Pill */}
            <div className="flex items-center gap-3 bg-[var(--surface-raised)] p-3 rounded-xl border border-[var(--border)]">
              {project.images?.[0] ? (
                <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                  <Image
                    src={project.images[0]}
                    alt={project.name}
                    fill
                    className="object-cover"
                    sizes="40px"
                  />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-lg bg-[var(--surface-raised)] flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-[var(--text-muted)]" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[var(--text-primary)] truncate">{project.name}</p>
                <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">{project.builderName}</p>
              </div>

            </div>

            <div className="space-y-4">
              <QuickQuestions onSelect={(q) => { setQuestion(q); handleSubmit(q); }} hasCompare={!!compareProject} />
              
              <div className="relative">
                <input 
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit(question)}
                  placeholder="Ask anything about this project..."
                  className="w-full bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl pl-4 pr-12 py-4 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] transition-all"
                />
                <button 
                  onClick={() => handleSubmit(question)}
                  disabled={!question.trim() || isLoading}
                  className="absolute right-2 top-2 p-2 bg-[var(--primary)] text-white rounded-lg disabled:opacity-50 transition-all"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                </button>
              </div>
            </div>

            { (answer || isLoading) && (
              <AIResponse 
                answer={answer} 
                provider={provider} 
                project={project} 
                isLoading={isLoading} 
              />
            )}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
