'use client';

import { useState } from 'react';
import Link from 'next/link';
import { whatsAppHref, mailtoHref } from '@/lib/site';
import { StarIcon } from '@/components/ui/Icons';

interface Props {
  productName: string;
  productSlug: string;
}

const MAX_BODY = 1200;

/**
 * Write-a-review form.
 *
 * SUBMISSION PATH: this project has no database and no server runtime — the
 * whole site is statically exported. Rather than POST to an endpoint that
 * cannot store anything, or fake persistence in localStorage where it would be
 * invisible to everyone else, the review is composed and sent through the same
 * WhatsApp/email channel every other enquiry uses. We publish it against the
 * order once verified, which is also what keeps ratings honest.
 *
 * TODO: when a database is connected, swap the send handler for a POST to
 * `/api/reviews`. Every field below already matches the Review model in
 * lib/reviews.ts, so nothing about this form needs to change.
 */
export default function ReviewForm({ productName, productSlug }: Props) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [touched, setTouched] = useState(false);

  const valid = rating > 0 && name.trim().length > 1 && body.trim().length > 9;

  const message = [
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

  const wa = whatsAppHref(message);
  const mail = mailtoHref(`Review: ${productName}`);
  const mailWithBody = mail ? `${mail}&body=${encodeURIComponent(message)}` : null;

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

  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      aria-label={`Write a review for ${productName}`}
      className="max-w-xl rounded-[--radius-plate] border border-line p-6"
    >
      <h3 className="font-body text-base font-semibold text-ink">Write a review</h3>

      {/* Rating */}
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
          {rating > 0 && (
            <span className="ml-2 font-body text-sm text-muted">{rating} of 5</span>
          )}
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
            Reviews are published once we match them to an order.
          </span>
          <span className="shrink-0 text-2xs tabular-nums text-subtle">
            {body.length}/{MAX_BODY}
          </span>
        </div>
      </div>

      {touched && !valid && (
        <p role="alert" className="mt-3 text-sm text-link">
          Please add a star rating, your name, and at least a sentence of review.
        </p>
      )}

      <div className="mt-6 flex flex-col gap-3">
        {wa ? (
          <a
            href={valid ? wa : undefined}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              if (!valid) {
                e.preventDefault();
                setTouched(true);
              }
            }}
            aria-disabled={!valid}
            className={`inline-flex w-full items-center justify-center rounded-[--radius-plate] bg-primary px-6 py-3.5 font-display text-sm uppercase tracking-wide text-on-primary transition-colors hover:bg-primary-hover ${
              valid ? '' : 'opacity-50'
            }`}
          >
            Submit review
          </a>
        ) : mailWithBody ? (
          <a
            href={mailWithBody}
            className="inline-flex w-full items-center justify-center rounded-[--radius-plate] bg-primary px-6 py-3.5 font-display text-sm uppercase tracking-wide text-on-primary hover:bg-primary-hover"
          >
            Submit review
          </a>
        ) : (
          <Link
            href="/contact"
            className="inline-flex w-full items-center justify-center rounded-[--radius-plate] bg-primary px-6 py-3.5 font-display text-sm uppercase tracking-wide text-on-primary hover:bg-primary-hover"
          >
            Send via contact page
          </Link>
        )}

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
