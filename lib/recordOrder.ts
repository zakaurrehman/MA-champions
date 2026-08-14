'use client';

export interface OrderLineInput {
  slug: string;
  variantId?: string | null;
  quantity: number;
  specLines?: string[];
}

export interface RecordOrderInput {
  kind: 'cart' | 'product' | 'build';
  channel?: 'whatsapp' | 'email' | 'copy';
  items?: OrderLineInput[];
  buildSpec?: unknown;
  customerName?: string;
  customerEmail?: string;
  note?: string;
}

/**
 * Logs an order intent, then gets out of the way.
 *
 * Called immediately before handing off to WhatsApp. Two rules matter:
 *
 *  1. It NEVER throws and never blocks. If logging fails, the customer still
 *     reaches WhatsApp — their order is worth more than our record of it.
 *  2. It sends no prices. The server recomputes every line from the catalogue,
 *     because anything the browser claims about price can be edited.
 *
 * Returns the reference (e.g. "MA-7QK2F") when one was created, so it can be
 * quoted in the message the customer sends.
 */
export async function recordOrder(input: RecordOrderInput): Promise<string | null> {
  try {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channel: 'whatsapp', ...input }),
      // Survives the tab navigating away to WhatsApp mid-request.
      keepalive: true,
    });

    const data = (await res.json().catch(() => ({}))) as { reference?: string };
    return data.reference ?? null;
  } catch {
    return null;
  }
}
