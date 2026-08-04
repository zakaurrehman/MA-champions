'use client';

import { useState } from 'react';
import Link from 'next/link';
import { site, whatsAppHref, mailtoHref } from '@/lib/site';
import { WhatsAppIcon } from '@/components/ui/Icons';

interface Props {
  subject: string;
  /** Extra leading field, e.g. an order number on /track-order. */
  referenceLabel?: string;
  messageLabel?: string;
  messagePlaceholder?: string;
}

/**
 * Contact form without a backend.
 *
 * v1 has no server to post to, so rather than a form that silently discards
 * submissions, this composes a real message and hands it to whichever channel
 * is configured. If none is, it offers copy-to-clipboard and routes on — the
 * visitor's typing is never thrown away.
 *
 * TODO (Phase 5/6): add `app/api/contact/route.ts` and post to it. Keep this
 * component's fields identical so nothing visible changes.
 */
export default function ContactForm({
  subject,
  referenceLabel,
  messageLabel = 'Message',
  messagePlaceholder = 'Tell us what you are after…',
}: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [reference, setReference] = useState('');
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);

  const bodyLines: string[] = [subject, ''];
  if (name) bodyLines.push(`Name: ${name}`);
  if (email) bodyLines.push(`Email: ${email}`);
  if (reference && referenceLabel) bodyLines.push(`${referenceLabel}: ${reference}`);
  bodyLines.push('', message);
  const body = bodyLines.join('\n');

  const wa = whatsAppHref(body);
  const mail = mailtoHref(subject);
  const mailWithBody = mail ? `${mail}&body=${encodeURIComponent(body)}` : null;
  const noChannel = !wa && !mailWithBody;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(body);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  };

  const field =
    'w-full rounded-[--radius-plate] border border-subtle/25 bg-canvas px-4 py-3 font-body text-sm text-ink placeholder:text-subtle/60 focus:border-primary focus:outline-none';
  const label =
    'mb-2 block font-body text-2xs font-semibold uppercase tracking-[0.2em] text-subtle';

  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      className="flex max-w-xl flex-col gap-5"
      aria-label={subject}
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="cf-name" className={label}>
            Your name
          </label>
          <input id="cf-name" type="text" value={name} onChange={(e) => setName(e.target.value)} className={field} />
        </div>
        <div>
          <label htmlFor="cf-email" className={label}>
            Your email
          </label>
          <input id="cf-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={field} />
        </div>
      </div>

      {referenceLabel && (
        <div>
          <label htmlFor="cf-ref" className={label}>
            {referenceLabel}
          </label>
          <input id="cf-ref" type="text" value={reference} onChange={(e) => setReference(e.target.value)} className={field} />
        </div>
      )}

      <div>
        <label htmlFor="cf-message" className={label}>
          {messageLabel}
        </label>
        <textarea
          id="cf-message"
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={messagePlaceholder}
          className={field}
        />
      </div>

      <div className="flex flex-col gap-3">
        {wa && (
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center gap-2.5 rounded-[--radius-plate] bg-primary px-7 py-4 font-display text-base uppercase tracking-wide text-on-primary transition-colors hover:bg-primary-hover"
          >
            <WhatsAppIcon className="h-5 w-5" />
            Send on WhatsApp
          </a>
        )}

        {mailWithBody && (
          <a
            href={mailWithBody}
            className="inline-flex w-full items-center justify-center rounded-[--radius-plate] border border-subtle/40 px-7 py-4 font-display text-base uppercase tracking-wide text-ink transition-colors hover:border-primary hover:text-link"
          >
            Send by email
          </a>
        )}

        {noChannel && (
          <>
            <button
              type="button"
              onClick={copy}
              className="w-full rounded-[--radius-plate] bg-primary px-7 py-4 font-display text-base uppercase tracking-wide text-on-primary transition-colors hover:bg-primary-hover"
            >
              {copied ? 'Copied' : 'Copy my message'}
            </button>
            <p className="text-2xs leading-relaxed text-muted">
              {/* Honest about the gap rather than pretending to send. */}
              Our contact inbox and WhatsApp line are being connected. Copy your message above
              and it is ready to paste and send the moment they go live — or reach us through{' '}
              <Link href="/build" className="text-link hover:text-link-hover">
                the Belt Builder
              </Link>
              .
            </p>
          </>
        )}
      </div>

      {site.shipping.freeTo.length > 0 && (
        <p className="text-2xs uppercase tracking-[0.14em] text-subtle">
          Free shipping to {site.shipping.freeTo.join(', ')}
        </p>
      )}
    </form>
  );
}
