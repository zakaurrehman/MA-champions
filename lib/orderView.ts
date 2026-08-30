import 'server-only';

/**
 * Turning a stored order row into what a customer is allowed to see.
 *
 * There are two views, and the difference between them is the whole security
 * model of guest order lookup:
 *
 *  - SUMMARY needs only the reference. A reference is quoted over WhatsApp and
 *    is effectively public, so this view contains nothing that would hurt if a
 *    stranger guessed one: a stage name, a belt name, a tracking number.
 *
 *  - DETAIL needs proof — a signed access token from the checkout redirect, or
 *    the email/phone actually recorded on the order. It adds money, contact
 *    details and payment status.
 *
 * Neither view ever includes the internal row id, the submitter key, the
 * payment reference, the payment proof, or the admin's notes. The id is not
 * exposed because nothing outside the database needs it and exposing it invites
 * someone to try it somewhere else. The payment fields are not exposed because
 * a transaction id is a credential-shaped thing that belongs to the payment
 * provider, not on a page anyone can reach with a guessed reference.
 */

export interface OrderRowForView {
  reference: string;
  status: string;
  kind: string;
  channel: string;
  items: unknown;
  subtotal: string | number;
  currency: string;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  customer_note: string | null;
  tracking_carrier: string | null;
  tracking_number: string | null;
  payment_method: string | null;
  payment_verified: boolean;
  created_at: string | Date;
  updated_at: string | Date;
}

export interface OrderStage {
  label: string;
  detail: string;
  step: number;
}

export const ORDER_STAGES: Record<string, OrderStage> = {
  new: { label: 'Received', detail: 'We have your order and are preparing it.', step: 1 },
  quoted: {
    label: 'Quoted',
    detail: 'Your quote has been sent. Production starts once it is confirmed.',
    step: 2,
  },
  paid: { label: 'Confirmed', detail: 'Payment received. Your belt is queued to build.', step: 3 },
  production: { label: 'In production', detail: 'Your belt is on the bench being made.', step: 4 },
  shipped: { label: 'Shipped', detail: 'On its way to you.', step: 5 },
  completed: { label: 'Delivered', detail: 'Order complete. Enjoy the belt.', step: 6 },
  cancelled: { label: 'Cancelled', detail: 'This order was cancelled.', step: 0 },
};

export const TOTAL_ORDER_STEPS = 6;

export interface OrderItemView {
  name: string;
  quantity: number;
  variantName: string | null;
  unitPrice: number | null;
  total: number | null;
}

function viewItems(raw: unknown, withPrices: boolean): OrderItemView[] {
  if (!Array.isArray(raw)) return [];

  return raw.slice(0, 50).map((entry) => {
    const item = entry as Record<string, unknown>;
    return {
      name: String(item.name ?? 'Item'),
      quantity: Number(item.quantity) || 1,
      variantName: typeof item.variantName === 'string' ? item.variantName : null,
      unitPrice: withPrices && typeof item.unitPrice === 'number' ? item.unitPrice : null,
      total: withPrices && typeof item.total === 'number' ? item.total : null,
    };
  });
}

/**
 * Payment state in words, without any payment identifiers.
 *
 * "Awaiting confirmation" is deliberate for manual crypto and PayPal transfers:
 * the customer has sent money but a human has not yet checked the account, and
 * telling them "Paid" before that would be a claim we cannot support.
 */
function paymentSummary(row: OrderRowForView): { label: string; settled: boolean } {
  const method =
    row.payment_method === 'crypto'
      ? 'Crypto transfer'
      : row.payment_method === 'paypal'
        ? 'PayPal'
        : row.channel === 'paypal'
          ? 'PayPal'
          : row.channel === 'whatsapp'
            ? 'Arranged on WhatsApp'
            : 'Not yet paid';

  if (row.status === 'cancelled') return { label: `${method} · cancelled`, settled: false };

  // Defaulted, not asserted: the CHECK constraint makes an unknown status
  // unlikely, but a status page must not 500 because one slipped through.
  const stage = ORDER_STAGES[row.status] ?? ORDER_STAGES.new!;
  const settled = row.payment_verified || row.status === 'paid' || stage.step > 3;
  return {
    label: settled ? `${method} · received` : `${method} · awaiting confirmation`,
    settled,
  };
}

export function summaryView(row: OrderRowForView) {
  const stage = ORDER_STAGES[row.status] ?? ORDER_STAGES.new!;
  return {
    reference: row.reference,
    stage: stage.label,
    detail: stage.detail,
    step: stage.step,
    totalSteps: TOTAL_ORDER_STEPS,
    placedAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
    items: viewItems(row.items, false),
    tracking:
      row.tracking_number != null
        ? { carrier: row.tracking_carrier, number: row.tracking_number }
        : null,
  };
}

/** Masks all but the first character and the domain: b••@example.com. */
function maskEmail(email: string): string {
  const [user = '', domain = ''] = email.split('@');
  if (!domain) return '•••';
  return `${user.slice(0, 1)}${'•'.repeat(Math.max(2, user.length - 1))}@${domain}`;
}

/** Keeps only the last four digits: •••• 7417. */
function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return digits.length <= 4 ? '••••' : `•••• ${digits.slice(-4)}`;
}

export function detailView(row: OrderRowForView) {
  const payment = paymentSummary(row);

  return {
    ...summaryView(row),
    detailed: true as const,
    items: viewItems(row.items, true),
    subtotal: Number(row.subtotal),
    currency: row.currency,
    payment,
    note: row.customer_note,
    customer: {
      name: row.customer_name,
      /*
       * Masked even here. The viewer has proved they know one contact detail;
       * that does not mean the screen should print the other one in full, on a
       * page that might be open on a shared or shoulder-surfed device.
       */
      email: row.customer_email ? maskEmail(row.customer_email) : null,
      phone: row.customer_phone ? maskPhone(row.customer_phone) : null,
    },
  };
}
