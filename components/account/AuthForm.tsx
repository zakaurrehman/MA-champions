'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { site } from '@/lib/site';

type Mode = 'login' | 'register';

export default function AuthForm({ googleEnabled }: { googleEnabled: boolean }) {
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;

    setBusy(true);
    setError('');

    try {
      const res = await fetch('/api/auth/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, email, password, name }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };

      if (res.ok) {
        router.refresh();
        return;
      }
      setError(data.error ?? 'Something went wrong.');
    } catch {
      setError('Could not reach the server. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const field =
    'w-full rounded-[--radius-plate] border border-subtle/25 bg-canvas px-4 py-2.5 font-body text-sm text-ink placeholder:text-subtle/60 focus:border-primary focus:outline-none';
  const label =
    'mb-1.5 block font-body text-2xs font-semibold uppercase tracking-[0.2em] text-subtle';

  return (
    <div className="max-w-md">
      {/* Tabs */}
      <div role="tablist" aria-label="Sign in or create an account" className="flex border-b border-line">
        {(['login', 'register'] as Mode[]).map((m) => (
          <button
            key={m}
            role="tab"
            aria-selected={mode === m}
            onClick={() => {
              setMode(m);
              setError('');
            }}
            className={`border-b-2 px-5 py-3 font-body text-xs font-semibold uppercase tracking-[0.14em] transition-colors ${
              mode === m ? 'border-primary text-link' : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            {m === 'login' ? 'Sign in' : 'Create account'}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
        {mode === 'register' && (
          <div>
            <label htmlFor="auth-name" className={label}>
              Your name
            </label>
            <input
              id="auth-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              className={field}
            />
          </div>
        )}

        <div>
          <label htmlFor="auth-email" className={label}>
            Email
          </label>
          <input
            id="auth-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className={field}
          />
        </div>

        <div>
          <label htmlFor="auth-password" className={label}>
            Password
          </label>
          <div className="relative">
            <input
              id="auth-password"
              type={show ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              // Tells password managers whether to offer saving or filling.
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              className={`${field} pr-16`}
            />
            <button
              type="button"
              onClick={() => setShow(!show)}
              className="absolute right-3 top-1/2 -translate-y-1/2 font-body text-2xs font-semibold uppercase tracking-[0.14em] text-subtle hover:text-link"
            >
              {show ? 'Hide' : 'Show'}
            </button>
          </div>
          {mode === 'register' && (
            <p className="mt-1.5 text-2xs text-muted">At least 8 characters.</p>
          )}
        </div>

        {error && (
          <p role="alert" className="text-sm text-link">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="rounded-[--radius-plate] bg-primary px-6 py-3.5 font-display text-sm uppercase tracking-wide text-on-primary transition-colors hover:bg-primary-hover disabled:opacity-40"
        >
          {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
        </button>

        {mode === 'login' && (
          <p className="text-2xs leading-relaxed text-muted">
            {/*
              Honest about the limitation rather than shipping a reset link that
              goes nowhere. Removed once a transactional email service exists.
            */}
            Forgotten your password? Email{' '}
            <a href={`mailto:${site.email}`} className="text-link hover:underline">
              {site.email}
            </a>{' '}
            and we will reset it for you.
          </p>
        )}
      </form>

      {googleEnabled && (
        <>
          <div className="my-6 flex items-center gap-4">
            <span className="h-px flex-1 bg-line" />
            <span className="font-body text-2xs uppercase tracking-[0.16em] text-subtle">or</span>
            <span className="h-px flex-1 bg-line" />
          </div>

          <a
            href="/api/auth/google"
            className="flex w-full items-center justify-center gap-3 rounded-[--radius-plate] border border-subtle/40 px-6 py-3.5 font-body text-sm font-semibold text-ink transition-colors hover:border-primary hover:text-link"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M21.6 12.2c0-.6-.1-1.3-.2-1.9H12v3.6h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.2Z" />
              <path fill="#34A853" d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22Z" />
              <path fill="#FBBC05" d="M6.4 14c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V7.4H3.1a10 10 0 0 0 0 9.2L6.4 14Z" />
              <path fill="#EA4335" d="M12 5.9c1.5 0 2.8.5 3.8 1.5l2.8-2.8A10 10 0 0 0 3.1 7.4L6.4 10c.8-2.3 3-4.1 5.6-4.1Z" />
            </svg>
            Continue with Google
          </a>
        </>
      )}
    </div>
  );
}
