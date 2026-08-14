'use client';

import { useState } from 'react';
import { useCart, selectSubtotal } from '@/lib/cart';
import { formatPrice } from '@/lib/format';

export interface Wallet {
  label: string;
  network: string;
  address: string;
}

interface Props {
  method: 'crypto' | 'paypal';
  wallets?: Wallet[];
  paypalEmail?: string | null;
}

/**
 * Manual payment: the customer pays outside the site, then tells us the
 * reference and attaches a screenshot.
 *
 * One component for crypto and PayPal because the flow is identical — pay,
 * prove, we verify. Only the destination and the wording differ, and
 * duplicating the whole form for that would just be two things to keep in step.
 */
export default function ManualPayment({ method, wallets = [], paypalEmail }: Props) {
  const items = useCart((s) => s.items);
  const subtotal = useCart(selectSubtotal);
  const clear = useCart((s) => s.clear);

  const [open, setOpen] = useState(false);
  const [wallet, setWallet] = useState<Wallet | null>(wallets[0] ?? null);
  const [copied, setCopied] = useState(false);
  const [txReference, setTx] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [note, setNote] = useState('');
  const [proof, setProof] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState<{ reference: string } | null>(null);

  const isPayPal = method === 'paypal';
  const destination = isPayPal ? paypalEmail : wallet?.address;

  if (items.length === 0 || !destination) return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(destination);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const submit = async () => {
    setSending(true);
    setError('');

    const form = new FormData();
    form.append('method', method);
    form.append('txReference', txReference);
    form.append('network', wallet?.network ?? '');
    form.append('name', name);
    form.append('email', email);
    form.append('note', note);
    form.append(
      'items',
      JSON.stringify(
        items.map((i) => ({
          slug: i.slug,
          variantId: typeof i.selection.variant === 'string' ? i.selection.variant : null,
          quantity: i.quantity,
        }))
      )
    );
    if (proof) form.append('proof', proof);

    try {
      const res = await fetch('/api/payments/manual', { method: 'POST', body: form });
      const data = (await res.json().catch(() => ({}))) as {
        reference?: string;
        error?: string;
      };

      if (res.ok && data.reference) {
        setDone({ reference: data.reference });
        clear();
        return;
      }
      setError(data.error ?? 'Could not record your payment.');
    } catch {
      setError('Could not reach the server. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const field =
    'w-full rounded-[--radius-plate] border border-subtle/25 bg-canvas px-4 py-2.5 font-body text-sm text-ink placeholder:text-subtle/60 focus:border-primary focus:outline-none';
  const label =
    'mb-1.5 block font-body text-2xs font-semibold uppercase tracking-[0.2em] text-subtle';

  if (done) {
    return (
      <div role="status" className="rounded-[--radius-plate] border border-line p-5 text-center">
        <p className="font-display text-2xl text-ink">Payment submitted</p>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Your reference is <strong className="text-ink">{done.reference}</strong>. We will check
          the payment and email you once it clears. Nothing is built until we have confirmed it.
        </p>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-[--radius-plate] border border-subtle/40 px-6 py-3.5 font-display text-sm uppercase tracking-wide text-ink transition-colors hover:border-primary hover:text-link"
      >
        {isPayPal ? 'Pay with PayPal' : 'Pay with crypto'}
      </button>
    );
  }

  return (
    <div className="rounded-[--radius-plate] border border-line p-5">
      <p className="font-body text-sm font-semibold text-ink">
        {isPayPal ? 'Pay with PayPal' : 'Pay with crypto'}
      </p>
      <p className="mt-1.5 text-2xs leading-relaxed text-muted">
        Send {formatPrice(subtotal)}, then paste the transaction ID below so we can confirm it.
      </p>

      {!isPayPal && wallets.length > 1 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {wallets.map((w) => (
            <button
              key={w.address}
              type="button"
              onClick={() => setWallet(w)}
              className={`rounded-[--radius-plate] border px-3 py-1.5 font-body text-2xs font-semibold transition-colors ${
                wallet?.address === w.address
                  ? 'border-primary bg-primary/10 text-link'
                  : 'border-subtle/30 text-muted hover:border-subtle/60'
              }`}
            >
              {w.label}
            </button>
          ))}
        </div>
      )}

      <div className="mt-4 rounded-[--radius-plate] border border-line p-4">
        <p className="font-body text-2xs font-semibold uppercase tracking-[0.16em] text-link">
          {isPayPal ? 'Send to this PayPal account' : `Send on ${wallet?.network} only`}
        </p>
        <p className="mt-2 break-all font-body text-sm tracking-wide text-ink">{destination}</p>
        <button
          type="button"
          onClick={copy}
          className="mt-3 rounded-[--radius-plate] border border-subtle/40 px-4 py-2 font-body text-2xs font-semibold uppercase tracking-[0.14em] text-ink hover:border-primary hover:text-link"
        >
          {copied ? 'Copied' : isPayPal ? 'Copy address' : 'Copy wallet address'}
        </button>
        <p className="mt-3 text-2xs leading-relaxed text-muted">
          {isPayPal
            ? 'Send as “Goods and Services” so you keep PayPal’s buyer protection. Include your email in the note.'
            : 'Crypto transfers cannot be reversed. Check the address and the network before you send.'}
        </p>
      </div>

      <div className="mt-5 grid gap-4">
        <div>
          <label htmlFor={`mp-tx-${method}`} className={label}>
            {isPayPal ? 'PayPal transaction ID' : 'Transaction ID / hash'}
          </label>
          <input
            id={`mp-tx-${method}`}
            value={txReference}
            onChange={(e) => setTx(e.target.value)}
            placeholder={isPayPal ? 'From your PayPal receipt' : 'Paste from your wallet'}
            className={field}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor={`mp-name-${method}`} className={label}>
              Your name
            </label>
            <input
              id={`mp-name-${method}`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={field}
            />
          </div>
          <div>
            <label htmlFor={`mp-email-${method}`} className={label}>
              Email
            </label>
            <input
              id={`mp-email-${method}`}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={field}
            />
          </div>
        </div>

        <div>
          <label htmlFor={`mp-proof-${method}`} className={label}>
            Screenshot of your payment
          </label>
          <input
            id={`mp-proof-${method}`}
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={(e) => setProof(e.target.files?.[0] ?? null)}
            className="w-full font-body text-sm text-muted file:mr-3 file:rounded-[--radius-plate] file:border file:border-subtle/40 file:bg-transparent file:px-4 file:py-2 file:font-body file:text-2xs file:uppercase file:tracking-[0.14em] file:text-ink"
          />
        </div>

        <div>
          <label htmlFor={`mp-note-${method}`} className={label}>
            Anything else?
          </label>
          <textarea
            id={`mp-note-${method}`}
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className={field}
          />
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-3 text-sm text-link">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={sending || txReference.trim().length < 6 || !email.includes('@')}
        className="mt-5 w-full rounded-[--radius-plate] bg-primary px-6 py-3.5 font-display text-sm uppercase tracking-wide text-on-primary transition-colors hover:bg-primary-hover disabled:opacity-40"
      >
        {sending ? 'Submitting…' : 'I have sent the payment'}
      </button>

      <p className="mt-3 text-2xs leading-relaxed text-muted">
        We check every payment before starting your belt. You will get an email once it clears.
      </p>
    </div>
  );
}
