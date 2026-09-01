'use client';

import { useState, useRef, useEffect, useCallback } from "react";
import SectionContainer from "@/components/layout/SectionContainer";
import { Send, Bot, User, Sparkles, Loader2, MessageSquare, Lock, X, RotateCcw, Building2, MapPin, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { storage } from "@/lib/storage";
import { useGuestMode } from "@/hooks/useGuestMode";
import { createResourceCache } from "@/lib/client-cache";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AIChatCacheData {
  messages: Message[];
  remaining: number;
  hasStartedChat: boolean;
}

// ─── Constants & Caching ────────────────────────────────────────────────────────
const MAX_MESSAGES = 5;
const CHAT_STORAGE_KEY = 'propcinity_ai_chat_cache';

const aiChatResourceCache = createResourceCache<AIChatCacheData>('ai-chat:data', 10 * 60 * 1000);

const PRESET_QUESTIONS = [
  { icon: MapPin, text: "Which areas in Pune have best value for 2BHK under 80L?" },
  { icon: Building2, text: "Which builders have the best delivery track record in Pune?" },
  { icon: ShieldCheck, text: "What should I check before booking an under-construction property?" },
  { icon: Sparkles, text: "Compare Hinjewadi vs Kharadi for long-term appreciation" },
];

function getInitialChatData(welcomeMsg: Message): AIChatCacheData {
  const cached = aiChatResourceCache.get();
  if (cached && Array.isArray(cached.messages) && cached.messages.length > 0) {
    return cached;
  }
  const stored = storage.get<AIChatCacheData | null>(CHAT_STORAGE_KEY, null);
  if (stored && Array.isArray(stored.messages) && stored.messages.length > 0) {
    aiChatResourceCache.set(stored);
    return stored;
  }
  return {
    messages: [welcomeMsg],
    remaining: MAX_MESSAGES,
    hasStartedChat: false,
  };
}

// ─── Guest Lock Screen UI ──────────────────────────────────────────────────────
function GuestLockScreen() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 px-6 py-12 text-center gap-5 my-auto">
      <div className="w-16 h-16 rounded-2xl bg-[var(--primary-light)] border border-[var(--primary)]/20 flex items-center justify-center shadow-sm">
        <Lock className="w-7 h-7 text-[var(--primary)]" />
      </div>
      <div className="space-y-2 max-w-sm">
        <h2
          className="text-2xl font-black text-[var(--text-primary)]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          AI Advisor is for members
        </h2>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
          Create a free account to unlock your daily AI consultations — personalized Pune real estate advice backed by RERA data, zero brokerage.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs pt-2">
        <Link
          href="/auth/signup"
          className="flex-1 py-3 bg-[var(--primary)] text-white text-sm font-bold rounded-xl hover:opacity-90 transition-opacity shadow-[var(--shadow-primary)] text-center"
        >
          Get Started — Free
        </Link>
        <Link
          href="/auth/signin"
          className="flex-1 py-3 bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text-secondary)] text-sm font-bold rounded-xl hover:border-[var(--primary)] transition-colors text-center"
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
      "Hi! I'm your Propcinity Advisor. I have verified RERA data on top residential projects across Pune. Ask me anything — which areas suit your budget, builder track records, or what to inspect before booking.",
  };

  const initialDataRef = useRef<AIChatCacheData | null>(null);
  if (!initialDataRef.current) {
    initialDataRef.current = getInitialChatData(WELCOME_MESSAGE);
  }

  const [messages, setMessages] = useState<Message[]>(initialDataRef.current.messages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [remaining, setRemaining] = useState(initialDataRef.current.remaining);
  const [hasStartedChat, setHasStartedChat] = useState(initialDataRef.current.hasStartedChat);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const shouldAutoScroll = useRef(true);

  const hasCheckedOnce = useRef(false);
  useEffect(() => {
    if (!isChecking) hasCheckedOnce.current = true;
  }, [isChecking]);

  const updateCache = useCallback((msgs: Message[], rem: number) => {
    const hasStarted = msgs.length > 1;
    setMessages(msgs);
    setRemaining(rem);
    setHasStartedChat(hasStarted);
    const cacheData: AIChatCacheData = { messages: msgs, remaining: rem, hasStartedChat: hasStarted };
    aiChatResourceCache.set(cacheData);
    storage.set(CHAT_STORAGE_KEY, cacheData);
  }, []);

  // Background fetch for logged-in users to sync latest messages and limits
  useEffect(() => {
    if (isChecking || isGuest) return;
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch('/api/ai/ask');
        const data = await res.json();
        if (cancelled) return;

        let serverMsgs = initialDataRef.current?.messages || [WELCOME_MESSAGE];
        let serverRem = initialDataRef.current?.remaining ?? MAX_MESSAGES;

        if (Array.isArray(data.messages) && data.messages.length > 0) {
          serverMsgs = data.messages.map((m: any) => ({ role: m.role, content: m.content }));
        }
        if (typeof data.remainingToday === 'number') {
          serverRem = data.remainingToday;
        }

        updateCache(serverMsgs, serverRem);
      } catch {
        // Network hiccup — cached state remains visible smoothly
      }
    })();

    return () => { cancelled = true };
  }, [isChecking, isGuest, updateCache]);

  // Smart scroll: only auto-scroll message container if user is near bottom
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

  const sendQuestion = async (questionText: string) => {
    if (!questionText.trim() || isLoading || isLimitReached || isGuest) return;

    const userMsg = questionText.trim();
    setInput("");
    const updatedUserMsgs = [...messages, { role: 'user' as const, content: userMsg }];
    updateCache(updatedUserMsgs, remaining);
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
        const rateLimitMsgs = [
          ...updatedUserMsgs,
          { role: 'assistant' as const, content: "You've sent too many messages. Please wait a moment before asking again." },
        ];
        updateCache(rateLimitMsgs, remaining);
        return;
      }

      const data = await res.json();

      if (data.error && data.error !== 'Project not found') {
        const errorMsgs = [
          ...updatedUserMsgs,
          { role: 'assistant' as const, content: "I'm having trouble connecting right now. Please try again in a moment." },
        ];
        updateCache(errorMsgs, remaining);
        return;
      }

      const assistantContent =
        data.answer ||
        "I don't have enough information to answer that. Try asking about specific projects, locations, or budgets.";
      const finalMsgs = [...updatedUserMsgs, { role: 'assistant' as const, content: assistantContent }];
      const newRem = typeof data.remainingToday === 'number' ? data.remainingToday : remaining;
      updateCache(finalMsgs, newRem);
    } catch {
      const connErrorMsgs = [
        ...updatedUserMsgs,
        { role: 'assistant' as const, content: "I'm having trouble connecting right now. Please try again in a moment." },
      ];
      updateCache(connErrorMsgs, remaining);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = () => {
    sendQuestion(input);
  };

  const handleClearChat = async () => {
    const resetMsgs = [WELCOME_MESSAGE];
    updateCache(resetMsgs, remaining);
    setShowClearConfirm(false);
    try {
      await fetch('/api/ai/ask', { method: 'DELETE' });
    } catch {
      // Non-critical
    }
  };

  // ── Main render ─────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col flex-1 h-full min-h-0 overflow-hidden bg-[var(--background)]">
      {isChecking ? (
        <div className="flex items-center justify-center flex-1">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--text-muted)]" />
        </div>
      ) : isGuest ? (
        <div className="flex flex-col flex-1 min-h-0 overflow-y-auto">
          <div className="flex-shrink-0 bg-white border-b border-[var(--border)] py-5">
            <SectionContainer wide>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-[var(--primary)] text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI Advisor</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-[var(--text-primary)]"
                  style={{ fontFamily: 'var(--font-display)' }}>
                  Ask Propcinity&apos;s AI about Pune properties
                </h1>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
                  Get honest, data-backed answers using RERA records — zero sales pitch.
                </p>
              </div>
            </SectionContainer>
          </div>
          <GuestLockScreen />
        </div>
      ) : (
        <div className="flex flex-col flex-1 h-full min-h-0 overflow-hidden">
          {/* Sub-Header Bar (Fixed at top of chat container) */}
          <div className="flex-shrink-0 bg-white border-b border-[var(--border)] px-4 py-2.5 sm:px-6 z-10">
            <SectionContainer wide className="p-0">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-[var(--primary-light)] border border-[var(--primary)]/20 flex items-center justify-center text-[var(--primary)] flex-shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h1 className="text-sm sm:text-base font-bold text-[var(--text-primary)] truncate leading-tight" style={{ fontFamily: 'var(--font-display)' }}>
                      Propcinity AI Advisor
                    </h1>
                    <p className="text-[11px] text-[var(--text-muted)] truncate hidden sm:block">
                      Pune Real Estate Intelligence • RERA Verified
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {hasStartedChat && (
                    <button
                      onClick={() => setShowClearConfirm(true)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--primary)] hover:bg-[var(--surface-raised)] rounded-lg transition-colors"
                      title="Clear chat history"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span className="hidden xs:inline">New chat</span>
                    </button>
                  )}

                  <div
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
                      remaining <= 1 ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-[var(--surface-raised)] text-[var(--text-secondary)] border border-[var(--border)]'
                    }`}
                    role="status"
                    aria-live="polite"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>{isLimitReached ? 'Limit reached' : `${remaining} left today`}</span>
                  </div>
                </div>
              </div>
            </SectionContainer>
          </div>

          {/* Scrollable Messages Container */}
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex-1 min-h-0 overflow-y-auto overscroll-contain bg-[var(--background)] px-4 py-3 sm:px-6 flex flex-col justify-end"
          >
            <SectionContainer wide className="p-0 max-w-4xl mx-auto space-y-3.5 w-full mt-auto">
              {messages.map((m, i) => (
                <motion.div
                  initial={hasCheckedOnce.current ? { opacity: 0, y: 8 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  key={i}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[88%] sm:max-w-[78%] flex gap-2.5 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs shadow-xs ${
                        m.role === 'user'
                          ? 'bg-[var(--primary)] text-white'
                          : 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-amber-400 border border-slate-700/40'
                      }`}
                    >
                      {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>

                    <div
                      className={`px-4 py-3 text-sm leading-relaxed ${
                        m.role === 'user'
                          ? 'bg-[var(--primary)] text-white shadow-sm rounded-2xl rounded-tr-sm font-medium'
                          : 'bg-white border border-[var(--border)] text-[var(--text-primary)] shadow-xs rounded-2xl rounded-tl-sm'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{m.content}</div>
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Loading / Typing indicator */}
              {isLoading && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
                  <div className="flex gap-2.5 max-w-[88%] sm:max-w-[78%]">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-amber-400 border border-slate-700/40">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="px-4 py-3.5 rounded-2xl rounded-tl-sm bg-white border border-[var(--border)] shadow-xs flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-[var(--primary)] animate-pulse" />
                        <span className="w-2 h-2 rounded-full bg-[var(--primary)] animate-pulse [animation-delay:150ms]" />
                        <span className="w-2 h-2 rounded-full bg-[var(--primary)] animate-pulse [animation-delay:300ms]" />
                      </div>
                      <span className="text-xs text-[var(--text-muted)] font-semibold ml-1">Analyzing Pune property data...</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Limit reached banner */}
              {isLimitReached && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center px-2 py-3">
                  <div className="w-full max-w-md bg-orange-50/80 border border-orange-200 rounded-2xl p-4 text-center shadow-xs">
                    <p className="text-sm font-bold text-orange-900">Daily limit reached</p>
                    <p className="text-xs text-orange-700 mt-1">
                      You&apos;ve used today&apos;s {MAX_MESSAGES} AI questions. Limit resets tomorrow!
                    </p>
                    <a
                      href="tel:+919999999999"
                      className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white text-xs font-bold rounded-xl shadow-sm hover:opacity-90 transition-opacity"
                    >
                      Talk to a Pune Expert
                    </a>
                  </div>
                </motion.div>
              )}

              {/* Quick Prompt Cards — visible when chat is fresh */}
              {!hasStartedChat && messages.length <= 1 && !isLimitReached && (
                <div className="pt-1">
                  <div className="text-xs font-bold text-[var(--text-muted)] mb-2 flex items-center gap-1.5 uppercase tracking-wider">
                    <Sparkles className="w-3 h-3 text-[var(--primary)]" />
                    <span>Suggested Questions</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {PRESET_QUESTIONS.map((p, i) => (
                      <button
                        key={i}
                        onClick={() => sendQuestion(p.text)}
                        className="flex items-start gap-2.5 p-3 text-left bg-white border border-[var(--border)] hover:border-[var(--primary)] hover:shadow-sm rounded-xl transition-all group"
                      >
                        <div className="p-1.5 rounded-lg bg-[var(--surface-raised)] group-hover:bg-[var(--primary-light)] text-[var(--text-secondary)] group-hover:text-[var(--primary)] transition-colors flex-shrink-0 mt-0.5">
                          <p.icon className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-semibold text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] leading-snug">
                          {p.text}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </SectionContainer>
          </div>

          {/* Fixed Composer Bar at bottom of chat viewport */}
          <div className="flex-shrink-0 bg-white/95 backdrop-blur-md border-t border-[var(--border)] px-4 py-3 sm:px-6">
            <SectionContainer wide className="p-0 max-w-4xl mx-auto">
              <div className="flex gap-2.5 items-end">
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
                    isLimitReached ? "Daily limit reached. Come back tomorrow!" : "Ask anything about Pune real estate..."
                  }
                  rows={1}
                  aria-label="Ask Propcinity AI a question"
                  className="flex-1 min-w-0 resize-none overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden px-4 py-3 text-base sm:text-sm bg-[var(--surface-raised)] border border-[var(--border-strong)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] focus:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  style={{ maxHeight: '120px' }}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading || isLimitReached}
                  aria-label="Send question"
                  className="flex-shrink-0 w-11 h-11 bg-[var(--primary)] text-white rounded-xl flex items-center justify-center shadow-[var(--shadow-primary)] hover:opacity-95 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 transition-all"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </SectionContainer>
          </div>
        </div>
      )}

      {/* Clear history confirmation modal */}
      <AnimatePresence>
        {showClearConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-xs"
            onClick={() => setShowClearConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-lg border border-[var(--border)]"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
                  Start a new chat?
                </h3>
                <button onClick={() => setShowClearConfirm(false)} className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-lg transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm text-[var(--text-secondary)] mb-6 leading-relaxed">
                This will clear your current AI chat conversation.
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
                  className="px-4 py-2 text-sm font-bold bg-[var(--primary)] text-white rounded-xl hover:opacity-90 transition-opacity shadow-xs"
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
