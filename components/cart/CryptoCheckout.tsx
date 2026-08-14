'use client';

import { useState } from 'react';
import { useCart, selectSubtotal } from '@/lib/cart';
import { formatPrice } from '@/lib/format';

export interface Wallet {
  label: string;
  network: string;
  address: string;
}

type Stage = 'idle' | 'paying' | 'sending' | 'done';

export default function CryptoCheckout({ wallets }: { wallets: Wallet[] }) {
  const items = useCart((s) => s.items);
  const subtotal = useCart(selectSubtotal);
  const clear = useCart((s) => s.clear);

  const [stage, setStage] = useState<Stage>('idle');
  const [wallet, setWallet] = useState<Wallet | null>(wallets[0] ?? null);
  const [copied, setCopied] = useState(false);
  const [txReference, setTx] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [note, setNote] = useState('');
  const [proof, setProof] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ reference: string } | null>(null);

  if (wallets.length === 0 || items.length === 0) return null;

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const submit = async () => {
    setStage('sending');
    setError('');

    const form = new FormData();
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
      const res = await fetch('/api/payments/crypto', { method: 'POST', body: form });
      const data = (await res.json().catch(() => ({}))) as {
        reference?: string;
        error?: string;
      };

      if (res.ok && data.reference) {
        setResult({ reference: data.reference });
        setStage('done');
        clear();
        return;
      }
      setError(data.error ?? 'Could not record your payment.');
      setStage('paying');
    } catch {
      setError('Could not reach the server. Please try again.');
      setStage('paying');
    }
  };

  const field =
    'w-full rounded-[--radius-plate] border border-subtle/25 bg-canvas px-4 py-2.5 font-body text-sm text-ink placeholder:text-subtle/60 focus:border-primary focus:outline-none';
  const label =
    'mb-1.5 block font-body text-2xs font-semibold uppercase tracking-[0.2em] text-subtle';

  if (stage === 'done' && result) {
    return (
      <div role="status" className="rounded-[--radius-plate] border border-line p-5 text-center">
        <p className="font-display text-2xl text-ink">Payment submitted</p>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Your reference is <strong className="text-ink">{result.reference}</strong>. We will
          confirm the transaction on-chain and email you once it clears — usually within a few
          hours. Nothing is built until we have confirmed it.
        </p>
      </div>
    );
  }

  if (stage === 'idle') {
    return (
      <button
        type="button"
        onClick={() => setStage('paying')}
        className="w-full rounded-[--radius-plate] border border-subtle/40 px-6 py-3.5 font-display text-sm uppercase tracking-wide text-ink transition-colors hover:border-primary hover:text-link"
      >
        Pay with crypto
      </button>
    );
  }

  return (
    <div className="rounded-[--radius-plate] border border-line p-5">
      <p className="font-body text-sm font-semibold text-ink">Pay with crypto</p>
      <p className="mt-1.5 text-2xs leading-relaxed text-muted">
        Send {formatPrice(subtotal)} worth, then paste the transaction ID below so we can confirm
        it.
      </p>

      {/* Wallet picker */}
      {wallets.length > 1 && (
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

      {wallet && (
        <div className="mt-4 rounded-[--radius-plate] border border-line p-4">
          {/* Network is called out hard: sending on the wrong chain destroys funds. */}
          <p className="font-body text-2xs font-semibold uppercase tracking-[0.16em] text-link">
            Send on {wallet.network} only
          </p>
          <p className="mt-2 break-all font-body text-sm tracking-wide text-ink">
            {wallet.address}
          </p>
          <button
            type="button"
            onClick={() => copy(wallet.address)}
            className="mt-3 rounded-[--radius-plate] border border-subtle/40 px-4 py-2 font-body text-2xs font-semibold uppercase tracking-[0.14em] text-ink hover:border-primary hover:text-link"
          >
            {copied ? 'Copied' : 'Copy address'}
          </button>
          <p className="mt-3 text-2xs leading-relaxed text-muted">
            Crypto transfers cannot be reversed. Check the address and the network before you
            send.
          </p>
        </div>
      )}

      {/* Proof */}
      <div className="mt-5 grid gap-4">
        <div>
          <label htmlFor="cx-tx" className={label}>
            Transaction ID / hash
          </label>
          <input
            id="cx-tx"
            value={txReference}
            onChange={(e) => setTx(e.target.value)}
            placeholder="Paste from your wallet"
            className={field}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="cx-name" className={label}>
              Your name
            </label>
            <input id="cx-name" value={name} onChange={(e) => setName(e.target.value)} className={field} />
          </div>
          <div>
            <label htmlFor="cx-email" className={label}>
              Email
            </label>
            <input
              id="cx-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={field}
            />
          </div>
        </div>

        <div>
          <label htmlFor="cx-proof" className={label}>
            Screenshot (optional)
          </label>
          <input
            id="cx-proof"
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={(e) => setProof(e.target.files?.[0] ?? null)}
            className="w-full font-body text-sm text-muted file:mr-3 file:rounded-[--radius-plate] file:border file:border-subtle/40 file:bg-transparent file:px-4 file:py-2 file:font-body file:text-2xs file:uppercase file:tracking-[0.14em] file:text-ink"
          />
        </div>

        <div>
          <label htmlFor="cx-note" className={label}>
            Anything else?
          </label>
          <textarea
            id="cx-note"
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
        disabled={stage === 'sending' || txReference.trim().length < 6 || !email.includes('@')}
        className="mt-5 w-full rounded-[--radius-plate] bg-primary px-6 py-3.5 font-display text-sm uppercase tracking-wide text-on-primary transition-colors hover:bg-primary-hover disabled:opacity-40"
      >
        {stage === 'sending' ? 'Submitting…' : 'I have sent the payment'}
      </button>

      <p className="mt-3 text-2xs leading-relaxed text-muted">
        We verify every transaction on-chain before starting your belt. You will get an email
        once it clears.
      </p>
    </div>
  );
}
