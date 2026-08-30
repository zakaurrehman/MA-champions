'use client';

import { useState } from 'react';
import { whatsAppHref } from '@/lib/site';
import { WhatsAppIcon } from '@/components/ui/Icons';
import { contactKind } from '@/lib/contact';
import OrderDetail, { type OrderView } from '@/components/order/OrderDetail';

/**
 * Guest order lookup.
 *
 * The reference alone still works and still returns the status summary — that
 * is what customers have been using and breaking it would strand them. Adding
 * the email or phone from checkout unlocks the full order: prices, total and
 * payment status.
 *
 * The email/phone box is optional in the markup but the copy pushes towards
 * filling it in, because the fuller answer is the one people actually came for.
 */
export default function TrackOrderLookup() {
  const [reference, setReference] = useState('');
  const [contact, setContact] = useState('');
  const [result, setResult] = useState<OrderView | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const contactType = contactKind(contact);
  const contactLooksWrong = contact.trim().length > 0 && contactType === 'unknown';

  const lookup = async () => {
    if (!reference.trim() || busy) return;
    setBusy(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference, contact: contact.trim() }),
      });
      const data = (await res.json().catch(() => ({}))) as OrderView & { error?: string };

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

  const label =
    'mb-2 block font-body text-2xs font-semibold uppercase tracking-[0.2em] text-subtle';

  return (
    <div className="max-w-xl">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void lookup();
        }}
      >
        <label htmlFor="track-ref" className={label}>
          Order reference
        </label>
        <input
          id="track-ref"
          value={reference}
          onChange={(e) => setReference(e.target.value.toUpperCase())}
          placeholder="MA-7QK2F"
          // Uppercase and wide-tracked: references get retyped from a chat,
          // and mixed case invites transcription errors.
          className="w-full rounded-[--radius-plate] border border-subtle/25 bg-canvas px-4 py-3 font-body text-base uppercase tracking-widest text-ink placeholder:tracking-normal placeholder:text-subtle/60 focus:border-primary focus:outline-none"
        />

        <label htmlFor="track-contact" className={`${label} mt-5`}>
          Email or phone used at checkout
        </label>
        <input
          id="track-contact"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          autoComplete="email"
          placeholder="you@example.com or +92 300 0000000"
          className="w-full rounded-[--radius-plate] border border-subtle/25 bg-canvas px-4 py-3 font-body text-base text-ink placeholder:text-subtle/60 focus:border-primary focus:outline-none"
        />
        <p className="mt-2 text-2xs leading-relaxed text-muted">
          {contactLooksWrong
            ? 'That does not look like an email address or a phone number.'
            : 'Needed to see prices and payment status. Without it you will still get the delivery status.'}
        </p>

        <button
          type="submit"
          disabled={busy || !reference.trim()}
          className="mt-5 w-full rounded-[--radius-plate] bg-primary px-7 py-3.5 font-display text-sm uppercase tracking-wide text-on-primary transition-colors hover:bg-primary-hover disabled:opacity-40 sm:w-auto"
        >
          {busy ? 'Checking…' : 'Find my order'}
        </button>
      </form>

      {busy && (
        <p aria-live="polite" className="mt-6 text-sm text-muted">
          Looking up your order…
        </p>
      )}

      {error && (
        <div role="alert" className="mt-6 rounded-[--radius-plate] border border-line p-5">
          <p className="font-body text-sm font-semibold text-ink">Order not found</p>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">{error}</p>
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
        <div role="status" className="mt-8">
          <OrderDetail order={result} />

          {!result.detailed && (
            <p className="mt-4 text-2xs leading-relaxed text-muted">
              Add the email or phone you used at checkout above to see prices, your total and
              payment status.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
