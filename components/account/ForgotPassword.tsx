'use client';

import { useState } from 'react';
import { site } from '@/lib/site';

/**
 * Request a reset link.
 *
 * The confirmation is identical whether or not the address has an account —
 * anything else would turn this form into a way to check who is a customer.
 */
export default function ForgotPassword({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;

    setBusy(true);
    setError('');

    try {
      const res = await fetch('/api/auth/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json().catch(() => ({}))) as { message?: string; error?: string };

      if (res.ok) {
        setSent(data.message ?? 'If that email has an account, a reset link is on its way.');
        return;
      }
      setError(data.error ?? 'Could not send a reset link.');
    } catch {
      setError('Could not reach the server. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <div role="status" className="max-w-md rounded-[--radius-plate] border border-line p-5">
        <p className="font-body text-sm font-semibold text-ink">Check your email</p>
        <p className="mt-2 text-sm leading-relaxed text-muted">{sent}</p>
        <p className="mt-3 text-2xs leading-relaxed text-muted">
          Nothing after a few minutes? Message us on WhatsApp or email{' '}
          <a href={`mailto:${site.email}`} className="text-link hover:underline">
            {site.email}
          </a>{' '}
          and we will send you a link by hand.
        </p>
        <button
          type="button"
          onClick={onBack}
          className="mt-4 font-body text-2xs font-semibold uppercase tracking-[0.14em] text-link hover:underline"
        >
          Back to sign in
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="max-w-md">
      <p className="font-display text-2xl text-ink">Forgotten password</p>
      <p className="mt-1.5 mb-5 text-sm leading-relaxed text-muted">
        Enter the email on your account and we will send you a link to choose a new password.
      </p>

      <label
        htmlFor="forgot-email"
        className="mb-1.5 block font-body text-2xs font-semibold uppercase tracking-[0.2em] text-subtle"
      >
        Email
      </label>
      <input
        id="forgot-email"
        type="email"
        required
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full rounded-[--radius-plate] border border-subtle/25 bg-canvas px-4 py-2.5 font-body text-sm text-ink focus:border-primary focus:outline-none"
      />

      {error && (
        <p role="alert" className="mt-3 text-sm text-link">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy || !email}
        className="mt-5 w-full rounded-[--radius-plate] bg-primary px-6 py-3.5 font-display text-sm uppercase tracking-wide text-on-primary transition-colors hover:bg-primary-hover disabled:opacity-40"
      >
        {busy ? 'Sending…' : 'Send reset link'}
      </button>

      <button
        type="button"
        onClick={onBack}
        className="mt-4 w-full font-body text-2xs font-semibold uppercase tracking-[0.14em] text-subtle hover:text-link"
      >
        Back to sign in
      </button>
    </form>
  );
}
