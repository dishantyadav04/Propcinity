'use client';

import { useState, useRef, useEffect } from "react";
import SectionContainer from "@/components/layout/SectionContainer";
import { Send, Bot, User, Sparkles, Loader2, MessageSquare, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { storage } from "@/lib/storage";
import { useGuestMode } from "@/hooks/useGuestMode";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const SESSION_KEY = 'ai_chat_session';
const MAX_MESSAGES = 15;
const SESSION_TTL = 24 * 60 * 60 * 1000;

const GUEST_SESSION_KEY = 'ai_chat_guest_session';
const GUEST_MAX_MESSAGES = 3;
const GUEST_SESSION_TTL = 24 * 60 * 60 * 1000;

function getSessionCount(): number {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return 0;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.ts > SESSION_TTL) {
      localStorage.removeItem(SESSION_KEY);
      return 0;
    }
    return parsed.count || 0;
  } catch {
    return 0;
  }
}

function incrementSessionCount(): number {
  try {
    const count = getSessionCount() + 1;
    localStorage.setItem(SESSION_KEY, JSON.stringify({ count, ts: Date.now() }));
    return count;
  } catch {
    return 0;
  }
}

function getGuestCount(): number {
  try {
    const raw = localStorage.getItem(GUEST_SESSION_KEY);
    if (!raw) return 0;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.ts > GUEST_SESSION_TTL) {
      localStorage.removeItem(GUEST_SESSION_KEY);
      return 0;
    }
    return parsed.count || 0;
  } catch {
    return 0;
  }
}

function incrementGuestCount(): number {
  try {
    const count = getGuestCount() + 1;
    localStorage.setItem(GUEST_SESSION_KEY, JSON.stringify({ count, ts: Date.now() }));
    return count;
  } catch {
    return 0;
  }
}

export default function AIChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hi! I'm your Propcinity Advisor. I have data on verified projects in Pune. Ask me anything — which areas suit your budget, which builders have the best track record, or what to look for in your shortlist." }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { isGuest } = useGuestMode();
  const [guestCount, setGuestCount] = useState(0);

  useEffect(() => {
    setSessionCount(getSessionCount());
  }, []);

  useEffect(() => {
    if (isGuest) {
      setGuestCount(getGuestCount());
    }
  }, [isGuest]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const remaining = MAX_MESSAGES - sessionCount;
  const isLimitReached = remaining <= 0;

  const guestLimitReached = isGuest && guestCount >= GUEST_MAX_MESSAGES;
  const guestRemaining = GUEST_MAX_MESSAGES - guestCount;

  const handleSend = async () => {
    if (isGuest && guestLimitReached) return;
    if (!input.trim() || isLoading || isLimitReached) return;

    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    const newCount = incrementSessionCount();
    setSessionCount(newCount);

    try {
      const userIntent = storage.get<any>('userIntent', null);
      
      const res = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          question: userMsg,
          projectId: '00000000-0000-0000-0000-000000000000',
          userContext: userIntent ? {
            location: userIntent.subLocations?.join(', ') || userIntent.city,
            budget: userIntent.budget,
            bhk: userIntent.bhkType,
          } : undefined
        })
      });
      
      if (res.status === 429) {
        setMessages(prev => [...prev, { role: 'assistant', content: "You've sent too many messages. Please wait a moment before asking again." }]);
        return;
      }
      
      const data = await res.json();
      
      if (data.error && data.error !== 'Project not found') {
        setMessages(prev => [...prev, { role: 'assistant', content: "I'm having trouble connecting right now. Please try again in a moment." }]);
        return;
      }
      
      setMessages(prev => [...prev, { role: 'assistant', content: data.answer || "I don't have enough information to answer that. Try asking about specific projects, locations, or budgets." }]);

      if (isGuest) {
        const newCount = incrementGuestCount();
        setGuestCount(newCount);
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: "I'm having trouble connecting right now. Please try again in a moment." }]);
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

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-[var(--border)] py-4">
        <SectionContainer wide>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--primary-light)] rounded-full flex items-center justify-center text-[var(--primary)]">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h1 className="font-bold text-lg leading-tight">AI Advisor</h1>
                <p className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-yellow-500" /> Pune Real Estate Expert
                </p>
              </div>
            </div>
            {/* Session budget indicator */}
            {!isGuest && (
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
                remaining <= 3 ? 'bg-red-50 text-red-600' : 'bg-[var(--surface-raised)] text-[var(--text-muted)]'
              }`}>
                <MessageSquare className="w-3.5 h-3.5" />
                {isLimitReached ? 'Limit reached' : `${remaining} left today`}
              </div>
            )}
            {isGuest && (
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
                guestRemaining <= 1 ? 'bg-red-50 text-red-600' : 'bg-[var(--surface-raised)] text-[var(--text-muted)]'
              }`}>
                <MessageSquare className="w-3.5 h-3.5" />
                {guestLimitReached ? 'Limit reached' : `${guestRemaining} free left`}
              </div>
            )}
          </div>
        </SectionContainer>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto bg-[var(--background)] py-6">
        <SectionContainer wide className="space-y-6">
          {messages.map((m, i) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={i}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] md:max-w-[70%] flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
                  m.role === 'user' ? 'bg-[var(--primary)] text-white' : 'bg-white border border-[var(--border)] text-[var(--text-secondary)]'
                }`}>
                  {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                  m.role === 'user'
                    ? 'bg-[var(--primary)] text-white rounded-tr-none'
                    : 'bg-white border border-[var(--border)] text-[var(--text-primary)] rounded-tl-none'
                }`}>
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

          {isLimitReached && !isGuest && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex justify-center py-4">
              <div className="bg-orange-50 border border-orange-200 rounded-[var(--radius)] p-4 text-center max-w-sm">
                <p className="text-sm font-bold text-orange-800">Daily limit reached</p>
                <p className="text-xs text-orange-600 mt-1">Your session resets in 24 hours. For more guidance, speak to our team.</p>
                <a href="tel:+919999999999" 
                  className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white text-xs font-bold rounded-full">
                  Talk to an Expert
                </a>
              </div>
            </motion.div>
          )}
        </SectionContainer>
      </div>

      {/* Presets */}
      {messages.length <= 1 && !isLimitReached && !guestLimitReached && (
        <div className="flex-shrink-0 px-4 pb-2">
          <div className="max-w-6xl mx-auto flex gap-2 overflow-x-auto scrollbar-hide py-2">
            {presets.map((p, i) => (
              <button key={i}
                onClick={() => { setInput(p); }}
                className="flex-shrink-0 px-3 py-2 text-xs font-semibold bg-white border border-[var(--border)] text-[var(--text-secondary)] rounded-full hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors whitespace-nowrap">
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Guest counter chip above input */}
      {isGuest && !guestLimitReached && guestCount > 0 && (
        <div className="flex-shrink-0 text-center">
          <p className="text-[10px] text-[var(--text-muted)] pb-1">
            {guestRemaining} free question{guestRemaining !== 1 ? 's' : ''} remaining today
          </p>
        </div>
      )}

      {/* Input or guest limit overlay */}
      {guestLimitReached ? (
        <div className="flex-shrink-0 border-t border-[var(--border)] bg-[var(--surface)] p-4">
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <div className="w-10 h-10 rounded-full bg-[var(--surface-raised)] border border-[var(--border)] flex items-center justify-center">
              <Lock className="w-4 h-4 text-[var(--text-muted)]" />
            </div>
            <div>
              <p className="text-sm font-bold text-[var(--text-primary)]">
                You've used your {GUEST_MAX_MESSAGES} free questions
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Sign up to unlock unlimited AI advice — resets every 24 hours
              </p>
            </div>
            <Link
              href="/onboarding"
              className="px-5 py-2.5 bg-[var(--primary)] text-white text-sm font-bold rounded-[var(--radius-xs)] hover:opacity-90 transition-opacity shadow-[var(--shadow-primary)]"
            >
              Get Started — Free
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex-shrink-0 bg-white border-t border-[var(--border)] py-4">
          <SectionContainer wide>
            <div className="flex gap-3 items-end">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                disabled={isLoading || isLimitReached}
                placeholder={isLimitReached ? "Daily limit reached. Come back tomorrow!" : "Ask anything about Pune real estate..."}
                rows={1}
                className="flex-1 resize-none px-4 py-3 text-sm bg-[var(--surface-raised)] border border-[var(--border-strong)] rounded-[var(--radius)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ maxHeight: '120px' }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading || isLimitReached}
                className="flex-shrink-0 w-11 h-11 bg-[var(--primary)] text-white rounded-[var(--radius)] flex items-center justify-center shadow-[var(--shadow-primary)] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </SectionContainer>
        </div>
      )}
    </div>
  );
}
