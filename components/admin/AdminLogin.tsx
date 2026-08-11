'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLogin({ configured }: { configured: boolean }) {
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || busy) return;

    setBusy(true);
    setError('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      if (res.ok) {
        setToken('');
        router.refresh();
        return;
      }

      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setError(data.error ?? 'Incorrect token.');
    } catch {
      setError('Could not reach the server.');
    } finally {
      setBusy(false);
    }
  };

  if (!configured) {
    return (
      <div className="max-w-md rounded-[--radius-plate] border border-line p-6">
        <p className="font-body text-base font-semibold text-ink">Admin is not configured</p>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Set <code className="text-ink">ADMIN_TOKEN</code> in your hosting environment to at
          least 16 characters, then redeploy. Until then this panel stays closed.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="max-w-md rounded-[--radius-plate] border border-line p-6">
      <label
        htmlFor="admin-token"
        className="mb-2 block font-body text-2xs font-semibold uppercase tracking-[0.2em] text-subtle"
      >
        Admin token
      </label>
      <input
        id="admin-token"
        type="password"
        autoComplete="current-password"
        value={token}
        onChange={(e) => setToken(e.target.value)}
        className="w-full rounded-[--radius-plate] border border-subtle/25 bg-canvas px-4 py-3 font-body text-sm text-ink focus:border-primary focus:outline-none"
      />

      {error && (
        <p role="alert" className="mt-3 text-sm text-link">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!token || busy}
        className="mt-5 w-full rounded-[--radius-plate] bg-primary px-6 py-3.5 font-display text-sm uppercase tracking-wide text-on-primary transition-colors hover:bg-primary-hover disabled:opacity-40"
      >
        {busy ? 'Checking…' : 'Sign in'}
      </button>
    </form>
  );
}
