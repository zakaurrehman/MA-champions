'use client';

import { useState } from 'react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { useCart } from '@/lib/cart';
import { formatPrice } from '@/lib/format';

interface Props {
  clientId: string;
  currency?: string;
}

/**
 * PayPal checkout.
 *
 * Sends only slug, variant and quantity — never a price. The server builds the
 * PayPal order from the catalogue, so what the customer is charged cannot be
 * altered from the page.
 *
 * Renders nothing without a client id, so the WhatsApp route stays the only
 * checkout until PayPal credentials exist.
 */
export default function PayPalCheckout({ clientId, currency = 'USD' }: Props) {
  const items = useCart((s) => s.items);
  const notes = useCart((s) => s.notes);
  const clear = useCart((s) => s.clear);

  const [error, setError] = useState('');
  const [done, setDone] = useState<{ reference: string; amount: number } | null>(null);

  if (!clientId || items.length === 0) return null;

  const lines = items.map((i) => ({
    slug: i.slug,
    variantId: typeof i.selection.variant === 'string' ? i.selection.variant : null,
    quantity: i.quantity,
  }));

  if (done) {
    return (
      <div role="status" className="rounded-[--radius-plate] border border-line p-5 text-center">
        <p className="font-display text-2xl text-ink">Payment received</p>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Your reference is <strong className="text-ink">{done.reference}</strong>. Keep it — you
          can check progress any time on our track order page.
        </p>
        <p className="mt-1 text-2xs text-subtle">
          {formatPrice(done.amount, currency)} paid. We will be in touch to confirm your build.
        </p>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <p role="alert" className="mb-3 text-sm text-link">
          {error}
        </p>
      )}

      <PayPalScriptProvider
        options={{ clientId, currency, intent: 'capture' }}
      >
        <PayPalButtons
          style={{ layout: 'vertical', shape: 'rect', label: 'pay' }}
          // Recreated whenever the cart changes, so the amount can never be
          // stale relative to what is on screen.
          forceReRender={[JSON.stringify(lines)]}
          createOrder={async () => {
            setError('');
            const res = await fetch('/api/paypal/create-order', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ items: lines }),
            });
            const data = (await res.json().catch(() => ({}))) as {
              id?: string;
              error?: string;
            };
            if (!res.ok || !data.id) {
              setError(data.error ?? 'Could not start the payment.');
              throw new Error(data.error ?? 'create-order failed');
            }
            return data.id;
          }}
          onApprove={async (data) => {
            const res = await fetch('/api/paypal/capture', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ orderId: data.orderID, items: lines, note: notes }),
            });
            const result = (await res.json().catch(() => ({}))) as {
              reference?: string;
              amount?: number;
              error?: string;
            };
            if (!res.ok || !result.reference) {
              setError(result.error ?? 'Payment could not be confirmed. Please contact us.');
              return;
            }
            setDone({ reference: result.reference, amount: result.amount ?? 0 });
            clear();
          }}
          onError={() => setError('Something went wrong with PayPal. Please try again.')}
        />
      </PayPalScriptProvider>
    </div>
  );
}
