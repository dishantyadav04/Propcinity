'use client';

import { useEffect, useState, useCallback } from 'react';
import { Mail, Search, Clock, CheckCircle2, MessageSquare } from 'lucide-react';

const STATUS_STYLE: Record<string, string> = {
  new: 'bg-blue-50 text-blue-700 border-blue-200',
  read: 'bg-gray-100 text-gray-600 border-gray-200',
  replied: 'bg-green-50 text-green-700 border-green-200',
};

export default function AdminContactPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(() => {
    setIsLoading(true);
    const params = new URLSearchParams({
      ...(search && { search }),
      ...(statusFilter && { status: statusFilter }),
    });
    fetch(`/api/admin/contact?${params}`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => { setMessages(d.messages || []); setTotal(d.total || 0); })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [search, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/admin/contact?id=${id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    load();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[var(--text-primary)]"
            style={{ fontFamily: 'var(--font-display)' }}>
            Contact Messages
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">{total} total messages</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-[var(--surface)] border border-[var(--border)] rounded-lg
              text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)]"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm bg-[var(--surface)] border border-[var(--border)] rounded-lg
            text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
        >
          <option value="">All Status</option>
          <option value="new">New</option>
          <option value="read">Read</option>
          <option value="replied">Replied</option>
        </select>
      </div>

      {/* Messages list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-[var(--surface-raised)] rounded-xl animate-pulse" />
          ))}
        </div>
      ) : messages.length === 0 ? (
        <div className="text-center py-16">
          <MessageSquare className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-3" />
          <p className="text-sm font-semibold text-[var(--text-muted)]">No messages yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map(msg => (
            <div key={msg.id}
              className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden">
              <button
                className="w-full text-left p-4 hover:bg-[var(--surface-raised)] transition-colors"
                onClick={() => {
                  setExpanded(expanded === msg.id ? null : msg.id);
                  if (msg.status === 'new') updateStatus(msg.id, 'read');
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-9 h-9 bg-[var(--primary-light)] rounded-full flex items-center justify-center flex-shrink-0">
                      <Mail className="w-4 h-4 text-[var(--primary)]" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-[var(--text-primary)]">{msg.name}</p>
                        {msg.subject && (
                          <span className="text-xs text-[var(--text-muted)]">&mdash; {msg.subject}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-[var(--text-muted)]">
                        {msg.email && <span>{msg.email}</span>}
                        {msg.phone && <span>{msg.phone}</span>}
                      </div>
                      <p className="text-sm text-[var(--text-secondary)] mt-1 truncate">{msg.message}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize ${STATUS_STYLE[msg.status] || STATUS_STYLE.new}`}>
                      {msg.status}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                      <Clock className="w-3 h-3" />
                      {new Date(msg.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                </div>
              </button>

              {expanded === msg.id && (
                <div className="px-4 pb-4 pt-0 space-y-3 border-t border-[var(--border)]">
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed pt-3 whitespace-pre-wrap">
                    {msg.message}
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-xs font-bold text-[var(--text-muted)]">Mark as:</span>
                    {['new', 'read', 'replied'].map(s => (
                      <button
                        key={s}
                        onClick={() => updateStatus(msg.id, s)}
                        className={`text-xs font-bold px-3 py-1 rounded-full border capitalize transition-all ${
                          msg.status === s
                            ? STATUS_STYLE[s]
                            : 'bg-transparent text-[var(--text-muted)] border-[var(--border)] hover:border-[var(--border-strong)]'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                    {msg.email && (
                      <a
                        href={`mailto:${msg.email}?subject=Re: ${msg.subject || 'Your message to Propcinity'}`}
                        className="ml-auto text-xs font-bold text-[var(--primary)] hover:underline"
                      >
                        Reply via Email &rarr;
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
