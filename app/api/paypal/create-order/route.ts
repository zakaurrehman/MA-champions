import { NextResponse } from 'next/server';
import { paypalConfigured, paypalFetch } from '@/lib/paypal';
import { getAllProducts } from '@/lib/products';
import { authoritativeLineTotal } from '@/lib/pricing';
import { site } from '@/lib/site';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface LineInput {
  slug?: unknown;
  variantId?: unknown;
  quantity?: unknown;
}

/**
 * Creates a PayPal order from the customer's cart.
 *
 * The browser sends slug, variant and quantity — nothing else. Every price and
 * the grand total are computed here from the catalogue. This is the whole
 * point: a client-supplied amount can be edited in devtools, and PayPal will
 * happily charge whatever it is told to.
 */
export async function POST(request: Request) {
  if (!paypalConfigured()) {
    return NextResponse.json(
      { error: 'Card payment is not enabled yet. Please order on WhatsApp.' },
      { status: 503 }
    );
  }

  let body: { items?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const rawLines = Array.isArray(body.items) ? (body.items as LineInput[]) : [];
  if (rawLines.length === 0) {
    return NextResponse.json({ error: 'Your cart is empty.' }, { status: 400 });
  }

  const products = await getAllProducts();

  const lines: { name: string; quantity: number; unitPrice: number; total: number }[] = [];
  let total = 0;
  let currency = 'USD';

  for (const line of rawLines.slice(0, 50)) {
    const product = products.find((p) => p.slug === String(line.slug));
    // An unknown slug is either a stale cart or tampering. Refuse rather than
    // silently charging for a subset of what the customer thinks they bought.
    if (!product) {
      return NextResponse.json(
        { error: 'One of the belts in your cart is no longer available.' },
        { status: 409 }
      );
    }
    if (!product.visibility.shop || !product.inStock) {
      return NextResponse.json(
        { error: `${product.name} is not available to buy right now.` },
        { status: 409 }
      );
    }

    const quantity = Math.min(99, Math.max(1, Math.floor(Number(line.quantity) || 1)));
    const variantId = line.variantId ? String(line.variantId) : null;

    const priced = authoritativeLineTotal(product, variantId, quantity);
    if (!priced) {
      return NextResponse.json(
        { error: `Please choose a build for ${product.name}.` },
        { status: 400 }
      );
    }

    total += priced.total;
    currency = product.currency;
    lines.push({
      name: priced.variant ? `${product.name} (${priced.variant.name})` : product.name,
      quantity,
      unitPrice: priced.unitPrice,
      total: priced.total,
    });
  }

  const amount = (Math.round(total * 100) / 100).toFixed(2);

  try {
    const order = await paypalFetch<{ id: string }>('/v2/checkout/orders', {
      method: 'POST',
      body: {
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: currency,
              value: amount,
              breakdown: {
                item_total: { currency_code: currency, value: amount },
              },
            },
            items: lines.map((l) => ({
              name: l.name.slice(0, 127),
              quantity: String(l.quantity),
              unit_amount: {
                currency_code: currency,
                value: l.unitPrice.toFixed(2),
              },
            })),
            // Shipping is free to the stated regions, so no shipping line.
            description: `${site.name} order`.slice(0, 127),
          },
        ],
        application_context: {
          brand_name: site.name,
          shipping_preference: 'GET_FROM_FILE',
          user_action: 'PAY_NOW',
        },
      },
    });

    return NextResponse.json({ id: order.id, amount, currency });
  } catch (error) {
    console.error('[paypal/create-order] failed:', error);
    return NextResponse.json(
      { error: 'Could not start the payment. Please try again.' },
      { status: 502 }
    );
  }
}
