'use client';

import { useState } from 'react';

/**
 * Creates a one-time reset link for a customer who cannot get in, so the
 * operator can send it over WhatsApp or email by hand.
 *
 * Shown once and never retrievable — the token is stored hashed. If it gets
 * lost, issue another.
 */
export default function ResetLinkIssuer({ presetEmail = '' }: { presetEmail?: string }) {
  const [email, setEmail] = useState(presetEmail);
  const [url, setUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const issue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;

    setBusy(true);
    setError('');
    setUrl('');

    try {
      const res = await fetch('/api/admin/resets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };

      if (res.ok && data.url) {
        setUrl(data.url);
        return;
      }
      setError(data.error ?? 'Could not create a link.');
    } catch {
      setError('Could not reach the server.');
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <form onSubmit={issue} className="flex flex-wrap items-end gap-3">
        <div className="min-w-[16rem] flex-1">
          <label
            htmlFor="reset-issue-email"
            className="mb-1.5 block font-body text-2xs font-semibold uppercase tracking-[0.2em] text-subtle"
          >
            Customer email
          </label>
          <input
            id="reset-issue-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-[--radius-plate] border border-subtle/25 bg-canvas px-4 py-2.5 font-body text-sm text-ink focus:border-primary focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={busy || !email}
          className="rounded-[--radius-plate] border border-subtle/40 px-5 py-2.5 font-body text-xs font-semibold uppercase tracking-[0.14em] text-ink transition-colors hover:border-primary hover:text-link disabled:opacity-40"
        >
          {busy ? 'Creating…' : 'Create link'}
        </button>
      </form>

      {error && (
        <p role="alert" className="mt-3 text-sm text-link">
          {error}
        </p>
      )}

      {url && (
        <div className="mt-4 rounded-[--radius-plate] border border-line p-4">
          <p className="font-body text-2xs font-semibold uppercase tracking-[0.16em] text-link">
            Send this to the customer — it expires in 1 hour
          </p>
          <p className="mt-2 break-all font-body text-sm text-ink">{url}</p>
          <button
            type="button"
            onClick={copy}
            className="mt-3 rounded-[--radius-plate] border border-subtle/40 px-4 py-2 font-body text-2xs font-semibold uppercase tracking-[0.14em] text-ink hover:border-primary hover:text-link"
          >
            {copied ? 'Copied' : 'Copy link'}
          </button>
          <p className="mt-3 text-2xs leading-relaxed text-muted">
            Shown once. It is stored hashed, so it cannot be looked up again — create another if
            this one is lost. Anyone holding this link can set the password on that account, so
            send it only to the customer.
          </p>
        </div>
      )}
    </div>
  );
}
