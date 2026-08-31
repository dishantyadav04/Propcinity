'use client';

import { useState, useRef, useEffect, useCallback } from "react";
import SectionContainer from "@/components/layout/SectionContainer";
import { Send, Bot, User, Sparkles, Loader2, MessageSquare, Lock, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { storage } from "@/lib/storage";
import { useGuestMode } from "@/hooks/useGuestMode";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const MAX_MESSAGES = 5;

// ─── Guest Gate UI ────────────────────────────────────────────────────────────
function GuestLockScreen() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 px-6 py-16 text-center gap-5">
      <div className="w-16 h-16 rounded-full bg-[var(--surface-raised)] border border-[var(--border)] flex items-center justify-center">
        <Lock className="w-7 h-7 text-[var(--primary)]" />
      </div>
      <div className="space-y-2 max-w-xs">
        <h2
          className="text-xl font-bold text-[var(--text-primary)]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          AI Advisor is for members
        </h2>
        <p className="text-sm text-[var(--text-muted)] leading-relaxed">
          Create a free account to unlock your daily AI consultations — personalised Pune real estate advice, zero brokerage.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
        <Link
          href="/auth/signup"
          className="flex-1 py-3 bg-[var(--primary)] text-white text-sm font-bold rounded-[var(--radius-xs)] hover:opacity-90 transition-opacity shadow-[var(--shadow-primary)] text-center"
        >
          Get Started — Free
        </Link>
        <Link
          href="/auth/signin"
          className="flex-1 py-3 bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text-secondary)] text-sm font-bold rounded-[var(--radius-xs)] hover:border-[var(--primary)] transition-colors text-center"
        >
          Sign In
        </Link>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AIChatPage() {
  const { isGuest, isChecking } = useGuestMode();

  const WELCOME_MESSAGE: Message = {
    role: 'assistant',
    content:
      "Hi! I'm your Propcinity Advisor. I have data on verified projects in Pune. Ask me anything — which areas suit your budget, which builders have the best track record, or what to look for in your shortlist.",
  };

  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [remaining, setRemaining] = useState(MAX_MESSAGES);
  const [hasStartedChat, setHasStartedChat] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const shouldAutoScroll = useRef(true);

  const hasCheckedOnce = useRef(false);
  useEffect(() => {
    if (!isChecking) hasCheckedOnce.current = true;
  }, [isChecking]);

  // Load chat history
  useEffect(() => {
    if (isChecking || isGuest) return;
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch('/api/ai/ask');
        const data = await res.json();
        if (!cancelled && Array.isArray(data.messages) && data.messages.length > 0) {
          setMessages(data.messages.map((m: any) => ({ role: m.role, content: m.content })));
        }
        if (!cancelled && typeof data.remainingToday === 'number') {
          setRemaining(data.remainingToday);
        }
      } catch {
        // Network hiccup — fall back to the welcome message already in state.
      } finally {
        if (!cancelled) setIsHistoryLoading(false);
      }
    })();

    return () => { cancelled = true };
  }, [isChecking, isGuest]);

  // Smart scroll: only auto-scroll if user is near bottom
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    if (shouldAutoScroll.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    shouldAutoScroll.current = distanceFromBottom < 150;
  }, []);

  // Auto-grow textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [input]);

  const isLimitReached = remaining <= 0;

  const handleSend = async () => {
    if (!input.trim() || isLoading || isLimitReached || isGuest) return;

    const userMsg = input.trim();
    setInput("");
    setHasStartedChat(true);
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);
    shouldAutoScroll.current = true;

    try {
      const userIntent = storage.get<any>('userIntent', null);

      const res = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: userMsg,
          projectId: '00000000-0000-0000-0000-000000000000',
          userContext: userIntent
            ? {
                location: userIntent.subLocations?.join(', ') || userIntent.city,
                budget: userIntent.budget,
                bhk: userIntent.bhkType,
              }
            : undefined,
        }),
      });

      if (res.status === 429) {
        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: "You've sent too many messages. Please wait a moment before asking again." },
        ]);
        return;
      }

      const data = await res.json();

      if (data.error && data.error !== 'Project not found') {
        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: "I'm having trouble connecting right now. Please try again in a moment." },
        ]);
        return;
      }

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content:
            data.answer ||
            "I don't have enough information to answer that. Try asking about specific projects, locations, or budgets.",
        },
      ]);

      if (typeof data.remainingToday === 'number') {
        setRemaining(data.remainingToday);
      }
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: "I'm having trouble connecting right now. Please try again in a moment." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const presets = [
    "Which areas in Pune have the best value for 2BHK under 80L?",
    "What should I check before booking a property?",
    "Which builders have the best delivery track record in Pune?",
    "Explain the risk level for under-construction properties.",
  ];

  const handleClearChat = async () => {
    setMessages([WELCOME_MESSAGE]);
    setHasStartedChat(false);
    setShowClearConfirm(false);
    try {
      await fetch('/api/ai/ask', { method: 'DELETE' });
    } catch {
      // Non-critical
    }
  };

  // ── Main render ─────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      {isChecking ? (
        <div className="flex items-center justify-center flex-1">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--text-muted)]" />
        </div>
      ) : isGuest ? (
        <>
          <div className="flex-shrink-0 bg-white border-b border-[var(--border)] pb-8 pt-6">
            <SectionContainer wide>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[var(--primary)] text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI Advisor</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)]"
                  style={{ fontFamily: 'var(--font-display)' }}>
                  Ask Propcinity&apos;s AI anything about a property
                </h1>
                <p className="text-sm text-[var(--text-secondary)] flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-[var(--primary-light)] text-[var(--primary)]">
                    <Sparkles className="w-2.5 h-2.5" /> AI
                  </span>
                  Get honest, data-backed answers about Pune properties using RERA data and AI
                </p>
              </div>
            </SectionContainer>
          </div>
          <GuestLockScreen />
        </>
      ) : isHistoryLoading ? (
        <div className="flex items-center justify-center flex-1">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--text-muted)]" />
        </div>
      ) : (
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* AI Header — compact on mobile, expanded on desktop before first message */}
          <div
            className={`flex-shrink-0 bg-white border-b border-[var(--border)] transition-[padding] duration-200 ${
              hasStartedChat ? 'py-2.5' : 'py-3 md:py-6'
            }`}
          >
            <SectionContainer wide>
              {hasStartedChat ? (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 text-[var(--primary)] text-xs font-bold uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>AI Advisor</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowClearConfirm(true)}
                      className="text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors"
                      aria-label="Start a new chat"
                    >
                      New chat
                    </button>
                    <div
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
                        remaining <= 1 ? 'bg-red-50 text-red-600' : 'bg-[var(--surface-raised)] text-[var(--text-muted)]'
                      }`}
                      role="status"
                      aria-live="polite"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      {isLimitReached ? 'Limit reached' : `${remaining} left today`}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6">
                  <div className="space-y-1.5 md:space-y-2">
                    <div className="flex items-center gap-1.5 text-[var(--primary)] text-xs font-bold uppercase tracking-wider">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>AI Advisor</span>
                    </div>
                    <h1
                      className="text-[24px] leading-[1.05] md:text-3xl font-black text-[var(--text-primary)]"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      <span className="md:hidden">Ask Propcinity&apos;s AI<br />about a property</span>
                      <span className="hidden md:block">Ask Propcinity&apos;s AI anything about a property</span>
                    </h1>
                    <p className="text-sm text-[var(--text-secondary)] flex items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-[var(--primary-light)] text-[var(--primary)]">
                        <Sparkles className="w-2.5 h-2.5" /> AI
                      </span>
                      Get honest, data-backed answers about Pune properties
                    </p>
                  </div>
                  <div
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold self-start md:self-auto ${
                      remaining <= 1 ? 'bg-red-50 text-red-600' : 'bg-[var(--surface-raised)] text-[var(--text-muted)]'
                    }`}
                    role="status"
                    aria-live="polite"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    {isLimitReached ? 'Limit reached' : `${remaining} left today`}
                  </div>
                </div>
              )}
            </SectionContainer>
          </div>

          {/* Chat Workspace */}
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
            {/* Scrollable Messages */}
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="flex-1 min-h-0 overflow-y-auto overscroll-contain bg-[var(--background)]"
            >
              <SectionContainer wide className="space-y-6 pt-6 pb-6">
                {messages.map((m, i) => (
                  <motion.div
                    initial={hasCheckedOnce.current ? { opacity: 0, y: 10 } : false}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    key={i}
                    className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] md:max-w-[70%] flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                      <div
                        className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
                          m.role === 'user'
                            ? 'bg-[var(--primary)] text-white'
                            : 'bg-white border border-[var(--border)] text-[var(--text-secondary)]'
                        }`}
                      >
                        {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                      </div>
                      <div
                        className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                          m.role === 'user'
                            ? 'bg-[var(--primary)] text-white rounded-tr-none'
                            : 'bg-white border border-[var(--border)] text-[var(--text-primary)] rounded-tl-none'
                        }`}
                      >
                        {m.content}
                      </div>
                    </div>
                  </motion.div>
                ))}

                {isLoading && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                    <div className="flex gap-3 max-w-[85%]">
                      <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center bg-white border border-[var(--border)]">
                        <Bot className="w-4 h-4 text-[var(--text-secondary)]" />
                      </div>
                      <div className="p-4 rounded-2xl bg-white border border-[var(--border)] rounded-tl-none">
                        <Loader2 className="w-4 h-4 animate-spin text-[var(--text-muted)]" />
                      </div>
                    </div>
                  </motion.div>
                )}

                {isLimitReached && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center px-4 py-4">
                    <div className="w-full max-w-md bg-orange-50 border border-orange-200 rounded-[var(--radius)] p-4 text-center">
                      <p className="text-sm font-bold text-orange-800">Daily limit reached</p>
                      <p className="text-xs text-orange-600 mt-1">
                        You&apos;ve used today&apos;s {MAX_MESSAGES} AI questions. Your limit resets tomorrow.
                      </p>
                      <a
                        href="tel:+919999999999"
                        className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white text-xs font-bold rounded-full"
                      >
                        Talk to an Expert
                      </a>
                    </div>
                  </motion.div>
                )}
              </SectionContainer>
            </div>

            {/* Preset chips — only for genuinely new chat */}
            {!hasStartedChat && messages.length <= 1 && !isLimitReached && (
              <div className="flex-shrink-0 px-4 pb-2">
                <div className="max-w-6xl mx-auto flex gap-2 overflow-x-auto scrollbar-hide py-2">
                  {presets.map((p, i) => (
                    <button
                      key={i}
                      onClick={() => setInput(p)}
                      className="flex-shrink-0 px-3 py-2 text-xs font-semibold bg-white border border-[var(--border)] text-[var(--text-secondary)] rounded-full hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors whitespace-nowrap"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Composer */}
            <div className="flex-shrink-0 bg-white border-t border-[var(--border)] px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:px-0 md:py-4 md:pb-4">
              <SectionContainer wide>
                <div className="flex gap-3 items-end">
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    disabled={isLoading || isLimitReached}
                    placeholder={
                      isLimitReached ? "Come back tomorrow!" : "Ask anything about Pune real estate..."
                    }
                    rows={1}
                    aria-label="Ask Propcinity AI a question"
                    className="flex-1 min-w-0 resize-none overflow-y-auto px-4 py-3 text-base bg-[var(--surface-raised)] border border-[var(--border-strong)] rounded-[var(--radius)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ maxHeight: '120px' }}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading || isLimitReached}
                    aria-label="Send question"
                    className="flex-shrink-0 w-11 h-11 bg-[var(--primary)] text-white rounded-[var(--radius)] flex items-center justify-center shadow-[var(--shadow-primary)] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
              </SectionContainer>
            </div>
          </div>
        </div>
      )}

      {/* Clear history confirmation dialog */}
      <AnimatePresence>
        {showClearConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
            onClick={() => setShowClearConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[var(--radius)] p-6 max-w-sm w-full shadow-lg"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
                  Start a new chat?
                </h3>
                <button onClick={() => setShowClearConfirm(false)} className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm text-[var(--text-secondary)] mb-6">
                This will clear your current AI chat history.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="px-4 py-2 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearChat}
                  className="px-4 py-2 text-sm font-bold bg-[var(--primary)] text-white rounded-[var(--radius-xs)] hover:opacity-90 transition-opacity"
                >
                  Clear history
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
