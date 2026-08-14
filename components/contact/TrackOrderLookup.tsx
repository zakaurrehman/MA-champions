'use client';

import { useState } from 'react';
import { site, whatsAppHref } from '@/lib/site';
import { WhatsAppIcon } from '@/components/ui/Icons';

interface Result {
  reference: string;
  stage: string;
  detail: string;
  step: number;
  totalSteps: number;
  placedAt: string;
  updatedAt: string;
  items: { name: string; quantity: number; variantName: string | null }[];
  tracking: { carrier: string | null; number: string } | null;
}

const date = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

export default function TrackOrderLookup() {
  const [reference, setReference] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const lookup = async () => {
    if (!reference.trim() || busy) return;
    setBusy(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference }),
      });
      const data = (await res.json().catch(() => ({}))) as Result & { error?: string };

      if (res.ok) setResult(data);
      else setError(data.error ?? 'Could not find that order.');
    } catch {
      setError('Could not reach the server. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const wa = whatsAppHref(
    `Hi, I'd like an update on my order${reference.trim() ? ` ${reference.trim().toUpperCase()}` : ''}.`
  );

  return (
    <div className="max-w-xl">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void lookup();
        }}
      >
        <label
          htmlFor="track-ref"
          className="mb-2 block font-body text-2xs font-semibold uppercase tracking-[0.2em] text-subtle"
        >
          Order reference
        </label>
        <div className="flex flex-wrap gap-3 sm:flex-nowrap">
          <input
            id="track-ref"
            value={reference}
            onChange={(e) => setReference(e.target.value.toUpperCase())}
            placeholder="MA-7QK2F"
            // Uppercase and monospaced: references get retyped from a chat,
            // and mixed case invites transcription errors.
            className="w-full flex-1 rounded-[--radius-plate] border border-subtle/25 bg-canvas px-4 py-3 font-body text-base uppercase tracking-widest text-ink placeholder:tracking-normal placeholder:text-subtle/60 focus:border-primary focus:outline-none"
          />
          <button
            type="submit"
            disabled={busy || !reference.trim()}
            className="shrink-0 rounded-[--radius-plate] bg-primary px-7 py-3 font-display text-sm uppercase tracking-wide text-on-primary transition-colors hover:bg-primary-hover disabled:opacity-40"
          >
            {busy ? 'Checking…' : 'Track'}
          </button>
        </div>
        <p className="mt-2 text-2xs text-muted">
          Your reference is in the message we sent when you ordered.
        </p>
      </form>

      {error && (
        <div role="alert" className="mt-6 rounded-[--radius-plate] border border-line p-5">
          <p className="text-sm text-ink">{error}</p>
          {wa && (
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 font-body text-2xs font-semibold uppercase tracking-[0.14em] text-link hover:text-link-hover"
            >
              <WhatsAppIcon className="h-4 w-4" />
              Ask us directly
            </a>
          )}
        </div>
      )}

      {result && (
        <div role="status" className="mt-8 rounded-[--radius-plate] border border-line p-6">
          <p className="font-body text-2xs uppercase tracking-[0.16em] text-subtle">
            {result.reference}
          </p>
          <p className="mt-1 font-display text-3xl text-ink">{result.stage}</p>
          <p className="mt-2 text-sm leading-relaxed text-muted">{result.detail}</p>

          {/* Progress */}
          {result.step > 0 && (
            <div className="mt-5">
              <div
                className="flex gap-1"
                role="img"
                aria-label={`Step ${result.step} of ${result.totalSteps}`}
              >
                {Array.from({ length: result.totalSteps }, (_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 flex-1 rounded-full ${
                      i < result.step ? 'bg-primary' : 'bg-subtle/20'
                    }`}
                  />
                ))}
              </div>
              <p className="mt-2 text-2xs uppercase tracking-[0.14em] text-subtle">
                Step {result.step} of {result.totalSteps}
              </p>
            </div>
          )}

          {result.items.length > 0 && (
            <ul className="mt-5 border-t border-line pt-4">
              {result.items.map((item, i) => (
                <li key={i} className="py-1 text-sm text-muted">
                  <span className="text-ink">{item.quantity} ×</span> {item.name}
                  {item.variantName && ` — ${item.variantName}`}
                </li>
              ))}
            </ul>
          )}

          {result.tracking && (
            <div className="mt-5 rounded-[--radius-plate] border border-line p-4">
              <p className="font-body text-2xs font-semibold uppercase tracking-[0.16em] text-subtle">
                {result.tracking.carrier ?? 'Tracking'}
              </p>
              <p className="mt-1 font-body text-base tracking-wider text-ink">
                {result.tracking.number}
              </p>
            </div>
          )}

          <p className="mt-5 text-2xs text-subtle">
            Placed {date(result.placedAt)} · Updated {date(result.updatedAt)}
          </p>

          {site.shipping.freeTo.length > 0 && (
            <p className="mt-3 text-2xs uppercase tracking-[0.14em] text-subtle">
              Free shipping to {site.shipping.freeTo.join(', ')}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
