'use client';

import { useState } from 'react';

interface Props {
  endpoint: string;
  /**
   * False for a Google account that has never had a password — there is
   * nothing to confirm, and demanding a current password would make it
   * impossible to add one.
   */
  requireCurrent?: boolean;
  minLength?: number;
  /** Shown after a successful change, above the generic confirmation. */
  afterNote?: React.ReactNode;
  submitLabel?: string;
}

/**
 * Change (or set) a password. Shared by the admin panel and the customer
 * account page — the flow is identical, only the endpoint and the wording
 * differ, and two copies would drift apart the first time one was fixed.
 */
export default function PasswordChangeForm({
  endpoint,
  requireCurrent = true,
  minLength = 8,
  afterNote,
  submitLabel = 'Change password',
}: Props) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;

    // Checked here so a typo is caught before it becomes a request, and again
    // on the server, which is the check that actually counts.
    if (next !== confirm) {
      setError('The two new passwords do not match.');
      return;
    }

    setBusy(true);
    setError('');

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };

      if (res.ok) {
        setCurrent('');
        setNext('');
        setConfirm('');
        setDone(true);
        return;
      }
      setError(data.error ?? 'Could not change the password.');
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

  if (done) {
    return (
      <div role="status" className="max-w-md rounded-[--radius-plate] border border-line p-5">
        <p className="font-body text-sm font-semibold text-ink">Password changed</p>
        {afterNote && <div className="mt-2 text-2xs leading-relaxed text-muted">{afterNote}</div>}
        <button
          type="button"
          onClick={() => setDone(false)}
          className="mt-4 font-body text-2xs font-semibold uppercase tracking-[0.14em] text-link hover:underline"
        >
          Change it again
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="max-w-md">
      {requireCurrent && (
        <div className="mb-4">
          <label htmlFor="pw-current" className={label}>
            Current password
          </label>
          <input
            id="pw-current"
            type="password"
            required
            autoComplete="current-password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            className={field}
          />
        </div>
      )}

      <div className="mb-4">
        <label htmlFor="pw-next" className={label}>
          New password
        </label>
        <div className="relative">
          <input
            id="pw-next"
            type={show ? 'text' : 'password'}
            required
            minLength={minLength}
            autoComplete="new-password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
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
        <p className="mt-1.5 text-2xs text-muted">At least {minLength} characters.</p>
      </div>

      <div>
        <label htmlFor="pw-confirm" className={label}>
          Repeat new password
        </label>
        <input
          id="pw-confirm"
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
        disabled={busy || !next || !confirm}
        className="mt-5 rounded-[--radius-plate] bg-primary px-6 py-3 font-display text-sm uppercase tracking-wide text-on-primary transition-colors hover:bg-primary-hover disabled:opacity-40"
      >
        {busy ? 'Saving…' : submitLabel}
      </button>
    </form>
  );
}
