'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/admin/Sidebar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isAuthed, setIsAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Check if already authenticated via cookie
    const authed = document.cookie.includes('admin_session=');
    setIsAuthed(authed);
    setChecking(false);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      setIsAuthed(true);
      setError('');
    } else {
      setError('Incorrect password');
    }
  };

  if (checking) return null;

  if (!isAuthed) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center px-6">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-[var(--primary)] rounded-xl flex items-center justify-center text-white font-black text-2xl mx-auto">P</div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">PropIQ Admin</h1>
            <p className="text-sm text-[var(--text-muted)]">Enter your admin password to continue</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Admin password"
              className="w-full px-4 py-3 bg-[var(--surface-raised)] border border-[var(--border)] rounded-[var(--radius)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)]"
            />
            {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
            <button
              type="submit"
              className="w-full py-3 bg-[var(--primary)] text-white font-bold rounded-[var(--radius)]"
            >
              Enter Admin
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[var(--background)]">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
