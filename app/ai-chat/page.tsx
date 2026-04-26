'use client';

import { useState, useRef, useEffect } from "react";
import SectionContainer from "@/components/layout/SectionContainer";
import { Send, Bot, User, Sparkles, Building2, ChevronRight, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AIChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hello! I'm your Propcinity Advisor. I have data on over 50 verified projects in Pune. How can I help you find your dream home today?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: userMsg })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: "I'm having trouble connecting right now. Please try again in a moment." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const presets = [
    "Which projects have the best trust scores in Pune?",
    "Show me 2 BHKs near Hinjewadi IT Park under 80L.",
    "Which builders have the best delivery track record?",
    "Explain the risk level for luxury projects in Baner."
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] md:h-[calc(100vh-64px)]">
      <div className="flex-shrink-0 bg-white border-b border-[var(--border)] py-4">
        <SectionContainer wide>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[var(--primary-light)] rounded-full flex items-center justify-center text-[var(--primary)]">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">AI Advisor</h1>
              <p className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-yellow-500" /> Powered by Real-Time Pune Real Estate Data
              </p>
            </div>
          </div>
        </SectionContainer>
      </div>

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
            <div className="flex justify-start">
              <div className="bg-white border border-[var(--border)] p-4 rounded-2xl rounded-tl-none shadow-sm flex gap-2">
                <div className="w-2 h-2 bg-[var(--text-muted)] rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-[var(--text-muted)] rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 bg-[var(--text-muted)] rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}
        </SectionContainer>
      </div>

      <div className="flex-shrink-0 bg-white border-t border-[var(--border)] p-4">
        <SectionContainer wide>
          {messages.length === 1 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
              {presets.map(p => (
                <button
                  key={p}
                  onClick={() => setInput(p)}
                  className="text-left p-3 rounded-xl border border-[var(--border)] text-xs font-semibold text-[var(--text-secondary)] hover:border-[var(--primary)] hover:bg-[var(--primary-light)] transition-all"
                >
                  {p}
                </button>
              ))}
            </div>
          )}
          <div className="relative">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Ask anything about Pune real estate..."
              className="w-full pl-5 pr-14 py-4 bg-[var(--surface-raised)] border border-[var(--border)] rounded-2xl focus:outline-none focus:border-[var(--primary)] transition-all"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-[var(--primary)] text-white rounded-xl flex items-center justify-center disabled:opacity-50 transition-all shadow-lg shadow-orange-200"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </SectionContainer>
      </div>
    </div>
  );
}
