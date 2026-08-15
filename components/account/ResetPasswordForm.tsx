'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

/** Sets a new password from a reset link. The token comes from the URL. */
export default function ResetPasswordForm({ token }: { token: string }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const router = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;

    if (password !== confirm) {
      setError('The two passwords do not match.');
      return;
    }

    setBusy(true);
    setError('');

    try {
      const res = await fetch('/api/auth/reset', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };

      if (res.ok) {
        setDone(true);
        // They are signed in by the same response, so send them straight in.
        router.refresh();
        return;
      }
      setError(data.error ?? 'Could not set your new password.');
    } catch {
      setError('Could not reach the server. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const field =
    'w-full rounded-[--radius-plate] border border-subtle/25 bg-canvas px-4 py-2.5 font-body text-sm text-ink focus:border-primary focus:outline-none';
  const label =
    'mb-1.5 block font-body text-2xs font-semibold uppercase tracking-[0.2em] text-subtle';

  if (!token) {
    return (
      <p className="max-w-md text-sm leading-relaxed text-muted">
        This link is incomplete. Request a new one from the{' '}
        <Link href="/account" className="text-link hover:underline">
          account page
        </Link>
        .
      </p>
    );
  }

  if (done) {
    return (
      <div role="status" className="max-w-md rounded-[--radius-plate] border border-line p-5">
        <p className="font-display text-2xl text-ink">Password updated</p>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          You are signed in. That reset link has been used up and will not work again.
        </p>
        <Link
          href="/account"
          className="mt-5 inline-block rounded-[--radius-plate] bg-primary px-6 py-3 font-display text-sm uppercase tracking-wide text-on-primary transition-colors hover:bg-primary-hover"
        >
          Go to your account
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="max-w-md">
      <div className="mb-4">
        <label htmlFor="reset-password" className={label}>
          New password
        </label>
        <div className="relative">
          <input
            id="reset-password"
            type={show ? 'text' : 'password'}
            required
            minLength={8}
            autoComplete="new-password"
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
        <p className="mt-1.5 text-2xs text-muted">At least 8 characters.</p>
      </div>

      <div>
        <label htmlFor="reset-confirm" className={label}>
          Repeat new password
        </label>
        <input
          id="reset-confirm"
          type={show ? 'text' : 'password'}
          required
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className={field}
        />
      </div>

      {error && (
        <p role="alert" className="mt-3 text-sm text-link">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy || !password || !confirm}
        className="mt-5 w-full rounded-[--radius-plate] bg-primary px-6 py-3.5 font-display text-sm uppercase tracking-wide text-on-primary transition-colors hover:bg-primary-hover disabled:opacity-40"
      >
        {busy ? 'Saving…' : 'Set new password'}
      </button>
    </form>
  );
}
