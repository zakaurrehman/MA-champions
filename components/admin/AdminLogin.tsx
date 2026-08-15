'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLogin({ configured }: { configured: boolean }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password || busy) return;

    setBusy(true);
    setError('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        setPassword('');
        router.refresh();
        return;
      }

      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setError(data.error ?? 'Incorrect username or password.');
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
          Set <code className="text-ink">ADMIN_PASSWORD</code> in your hosting environment to at
          least 12 characters — and <code className="text-ink">ADMIN_USERNAME</code> if you want
          something other than <code className="text-ink">admin</code> — then redeploy. Until then
          this panel stays closed.
        </p>
      </div>
    );
  }

  const field =
    'w-full rounded-[--radius-plate] border border-subtle/25 bg-canvas px-4 py-3 font-body text-sm text-ink focus:border-primary focus:outline-none';
  const label =
    'mb-2 block font-body text-2xs font-semibold uppercase tracking-[0.2em] text-subtle';

  return (
    <form onSubmit={submit} className="max-w-md rounded-[--radius-plate] border border-line p-6">
      <p className="font-display text-2xl text-ink">Staff sign-in</p>
      <p className="mt-1.5 mb-5 text-2xs leading-relaxed text-muted">
        This panel manages the live shop. Do not share these details.
      </p>

      <div className="mb-4">
        <label htmlFor="admin-username" className={label}>
          Username
        </label>
        <input
          id="admin-username"
          name="username"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className={field}
        />
      </div>

      <div>
        <label htmlFor="admin-password" className={label}>
          Password
        </label>
        <div className="relative">
          <input
            id="admin-password"
            name="password"
            type={show ? 'text' : 'password'}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
      </div>

      {error && (
        <p role="alert" className="mt-3 text-sm text-link">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!username || !password || busy}
        className="mt-5 w-full rounded-[--radius-plate] bg-primary px-6 py-3.5 font-display text-sm uppercase tracking-wide text-on-primary transition-colors hover:bg-primary-hover disabled:opacity-40"
      >
        {busy ? 'Checking…' : 'Sign in'}
      </button>
    </form>
  );
}
