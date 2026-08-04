'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { BuildState } from '@/lib/builder';
import { describeBuild } from '@/lib/builder';
import { buildQuoteText, quoteChannels } from '@/lib/quote';
import { WhatsAppIcon } from '@/components/ui/Icons';

interface Props {
  build: BuildState;
  price: number;
}

export default function ReviewStep({ build, price }: Props) {
  const [contactName, setName] = useState('');
  const [contactEmail, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [copied, setCopied] = useState(false);

  const payload = { build, price, contactName, contactEmail, notes };
  const channels = quoteChannels(payload);

  const copySpec = async () => {
    try {
      await navigator.clipboard.writeText(buildQuoteText(payload));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-2xl text-ink">Your build</h2>
        <dl className="mt-5 grid gap-x-6 sm:grid-cols-2">
          {describeBuild(build).map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4 border-b border-line py-2.5">
              <dt className="font-body text-sm text-muted">{label}</dt>
              <dd className="text-right font-body text-sm font-semibold text-ink">{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Contact */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="q-name" className="mb-2 block font-body text-2xs font-semibold uppercase tracking-[0.2em] text-subtle">
            Your name
          </label>
          <input
            id="q-name"
            type="text"
            value={contactName}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-[--radius-plate] border border-subtle/25 bg-canvas px-4 py-3 font-body text-sm text-ink focus:border-primary focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="q-email" className="mb-2 block font-body text-2xs font-semibold uppercase tracking-[0.2em] text-subtle">
            Your email
          </label>
          <input
            id="q-email"
            type="email"
            value={contactEmail}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-[--radius-plate] border border-subtle/25 bg-canvas px-4 py-3 font-body text-sm text-ink focus:border-primary focus:outline-none"
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="q-notes" className="mb-2 block font-body text-2xs font-semibold uppercase tracking-[0.2em] text-subtle">
            Anything else we should know?
          </label>
          <textarea
            id="q-notes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Deadline, event date, quantity, reference images…"
            className="w-full rounded-[--radius-plate] border border-subtle/25 bg-canvas px-4 py-3 font-body text-sm text-ink placeholder:text-subtle/60 focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      {/* Send */}
      <div className="flex flex-col gap-3">
        {channels.whatsapp && (
          <a
            href={channels.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center gap-2.5 rounded-[--radius-plate] bg-primary px-7 py-4 font-display text-base uppercase tracking-wide text-on-primary transition-colors hover:bg-primary-hover"
          >
            <WhatsAppIcon className="h-5 w-5" />
            Send on WhatsApp
          </a>
        )}

        {channels.email && (
          <a
            href={channels.email}
            className="inline-flex w-full items-center justify-center rounded-[--radius-plate] border border-subtle/40 px-7 py-4 font-display text-base uppercase tracking-wide text-ink transition-colors hover:border-primary hover:text-link"
          >
            Send by email
          </a>
        )}

        {channels.needsContactPage && (
          <>
            {/* No WhatsApp number or email is configured yet, so we never
                render a send button that silently goes nowhere. */}
            <button
              type="button"
              onClick={copySpec}
              className="w-full rounded-[--radius-plate] bg-primary px-7 py-4 font-display text-base uppercase tracking-wide text-on-primary transition-colors hover:bg-primary-hover"
            >
              {copied ? 'Spec copied' : 'Copy spec to clipboard'}
            </button>
            <Link
              href="/contact"
              className="inline-flex w-full items-center justify-center rounded-[--radius-plate] border border-subtle/40 px-7 py-4 font-display text-base uppercase tracking-wide text-ink transition-colors hover:border-primary hover:text-link"
            >
              Go to contact page
            </Link>
            <p className="text-2xs leading-relaxed text-muted">
              Our WhatsApp line and quote inbox are being connected. Copy your spec above and
              send it from the contact page — nothing you have configured is lost.
            </p>
          </>
        )}

        {build.artwork && !channels.needsContactPage && (
          <p className="text-2xs leading-relaxed text-muted">
            Remember to attach <strong className="text-ink">{build.artwork.name}</strong> to your
            message — files cannot travel with this link automatically.
          </p>
        )}
      </div>
    </div>
  );
}
