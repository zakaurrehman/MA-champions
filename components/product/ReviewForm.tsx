'use client';

import { useState } from 'react';
import { whatsAppHref } from '@/lib/site';
import { StarIcon } from '@/components/ui/Icons';

interface Props {
  productName: string;
  productSlug: string;
}

const MAX_BODY = 1200;

type Status = 'idle' | 'sending' | 'done' | 'error';

/**
 * Write-a-review form.
 *
 * Posts to /api/reviews, which validates the product, rate-limits by a hashed
 * submitter key and stores the review as `pending`. Nothing appears on the site
 * until it is approved — a public form with no login would otherwise be an open
 * door for spam and fake ratings.
 *
 * If the API reports no database configured (503), it falls back to sending via
 * WhatsApp so a customer's writing is never simply discarded.
 */
export default function ReviewForm({ productName, productSlug }: Props) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');
  /** Set when we fall back to WhatsApp, so a blocked popup still has a link. */
  const [fallbackHref, setFallbackHref] = useState<string | null>(null);

  const valid = rating > 0 && name.trim().length > 1 && body.trim().length > 9;

  const asText = [
    `PRODUCT REVIEW — ${productName}`,
    `Product: /products/${productSlug}`,
    '',
    `Rating: ${rating} out of 5`,
    `Name: ${name.trim()}`,
    title.trim() && `Title: ${title.trim()}`,
    '',
    body.trim(),
  ]
    .filter(Boolean)
    .join('\n');

  const submit = async () => {
    if (!valid || status === 'sending') return;
    setStatus('sending');
    setMessage('');

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productSlug, name, title, body, rating }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        message?: string;
        error?: string;
      };

      if (res.ok) {
        setStatus('done');
        setMessage(data.message ?? 'Thank you. Your review will appear once we have checked it.');
        return;
      }

      /*
       * Reviews are not wired up on this deployment. Hand off to WhatsApp so
       * what they wrote is not lost. Popup blockers can stop window.open, so
       * fall through to a visible link rather than assuming it worked.
       */
      if (res.status === 503) {
        const wa = whatsAppHref(asText);
        if (wa) {
          const opened = window.open(wa, '_blank', 'noopener,noreferrer');
          setStatus('done');
          setMessage(
            opened
              ? 'Thanks — send that message and we will add your review.'
              : 'Reviews are not connected yet. Please send it to us on WhatsApp and we will add it.'
          );
          setFallbackHref(wa);
          return;
        }
      }

      setStatus('error');
      setMessage(data.error ?? 'Something went wrong. Please try again.');
    } catch {
      setStatus('error');
      setMessage('Could not reach the server. Please check your connection and try again.');
    }
  };

  const field =
    'w-full rounded-[--radius-plate] border border-subtle/25 bg-canvas px-4 py-3 font-body text-sm text-ink placeholder:text-subtle/60 focus:border-primary focus:outline-none';
  const label =
    'mb-2 block font-body text-2xs font-semibold uppercase tracking-[0.2em] text-subtle';

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-[--radius-plate] border border-subtle/40 px-6 py-3 font-display text-sm uppercase tracking-wide text-ink transition-colors hover:border-primary hover:text-link"
      >
        Write a review
      </button>
    );
  }

  if (status === 'done') {
    return (
      <div role="status" className="max-w-xl rounded-[--radius-plate] border border-line p-6">
        <p className="font-body text-base font-semibold text-ink">
          {fallbackHref ? 'Almost there' : 'Review received'}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted">{message}</p>
        {fallbackHref && (
          <a
            href={fallbackHref}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex rounded-[--radius-plate] bg-primary px-5 py-3 font-display text-sm uppercase tracking-wide text-on-primary hover:bg-primary-hover"
          >
            Send on WhatsApp
          </a>
        )}
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
      aria-label={`Write a review for ${productName}`}
      className="max-w-xl rounded-[--radius-plate] border border-line p-6"
    >
      <h3 className="font-body text-base font-semibold text-ink">Write a review</h3>

      <fieldset className="mt-5">
        <legend className={label}>Your rating</legend>
        <div className="flex items-center gap-1" onMouseLeave={() => setHovered(0)}>
          {[1, 2, 3, 4, 5].map((n) => {
            const filled = n <= (hovered || rating);
            return (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                onMouseEnter={() => setHovered(n)}
                aria-label={`${n} star${n > 1 ? 's' : ''}`}
                aria-pressed={rating === n}
                className="p-1"
              >
                {/* StarIcon fills with currentColor, so colour is the state. */}
                <StarIcon className={`h-7 w-7 ${filled ? 'text-gold' : 'text-subtle/30'}`} />
              </button>
            );
          })}
          {rating > 0 && <span className="ml-2 font-body text-sm text-muted">{rating} of 5</span>}
        </div>
      </fieldset>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="rv-name" className={label}>
            Your name
          </label>
          <input
            id="rv-name"
            type="text"
            maxLength={80}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={field}
          />
        </div>
        <div>
          <label htmlFor="rv-title" className={label}>
            Headline (optional)
          </label>
          <input
            id="rv-title"
            type="text"
            maxLength={120}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={field}
          />
        </div>
      </div>

      <div className="mt-4">
        <label htmlFor="rv-body" className={label}>
          Your review
        </label>
        <textarea
          id="rv-body"
          rows={5}
          value={body}
          maxLength={MAX_BODY}
          onChange={(e) => setBody(e.target.value)}
          placeholder="How does it look in person? How was the finish, the weight, the delivery?"
          className={field}
        />
        <div className="mt-2 flex justify-between gap-4">
          <span className="text-2xs text-muted">
            Reviews are checked before they appear on the site.
          </span>
          <span className="shrink-0 text-2xs tabular-nums text-subtle">
            {body.length}/{MAX_BODY}
          </span>
        </div>
      </div>

      {status === 'error' && message && (
        <p role="alert" className="mt-3 text-sm text-link">
          {message}
        </p>
      )}

      <div className="mt-6 flex items-center gap-4">
        <button
          type="submit"
          disabled={!valid || status === 'sending'}
          className="rounded-[--radius-plate] bg-primary px-6 py-3.5 font-display text-sm uppercase tracking-wide text-on-primary transition-colors hover:bg-primary-hover disabled:opacity-40"
        >
          {status === 'sending' ? 'Sending…' : 'Submit review'}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="font-body text-2xs uppercase tracking-[0.14em] text-subtle hover:text-link"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
