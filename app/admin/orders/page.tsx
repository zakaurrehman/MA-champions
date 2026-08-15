import type { Metadata } from 'next';
import AdminShell from '@/components/admin/AdminShell';
import OrderRow, { type AdminOrder } from '@/components/admin/OrderRow';
import { isAdmin } from '@/lib/adminAuth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Orders — Admin',
  robots: { index: false, follow: false, nocache: true },
};

interface Row {
  id: number;
  reference: string;
  kind: AdminOrder['kind'];
  channel: string;
  status: string;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  customer_note: string | null;
  design_url: string | null;
  items: AdminOrder['items'];
  build_spec: Record<string, unknown> | null;
  subtotal: string | number;
  currency: string;
  tracking_carrier: string | null;
  tracking_number: string | null;
  payment_method: string | null;
  payment_reference: string | null;
  payment_network: string | null;
  payment_proof_url: string | null;
  payment_verified: boolean;
  created_at: string;
}

async function loadOrders(): Promise<AdminOrder[] | null> {
  const sql = db();
  if (!sql) return null;

  try {
    const rows = (await sql`
      SELECT id, reference, kind, channel, status,
             customer_name, customer_email, customer_phone, customer_note,
             items, build_spec, subtotal, currency, design_url,
             tracking_carrier, tracking_number,
             payment_method, payment_reference, payment_network,
             payment_proof_url, payment_verified, created_at
      FROM orders
      -- Open work first, then newest. This page exists to clear a queue.
      ORDER BY (status IN ('completed','cancelled')) ASC, created_at DESC
      LIMIT 200
    `) as unknown as Row[];

    return rows.map((r) => ({
      id: Number(r.id),
      reference: r.reference,
      kind: r.kind,
      channel: r.channel,
      status: r.status,
      customerName: r.customer_name,
      customerEmail: r.customer_email,
      customerPhone: r.customer_phone,
      customerNote: r.customer_note,
      designUrl: r.design_url,
      items: r.items ?? [],
      buildSpec: r.build_spec,
      subtotal: Number(r.subtotal),
      currency: r.currency,
      trackingCarrier: r.tracking_carrier,
      trackingNumber: r.tracking_number,
      paymentMethod: r.payment_method,
      paymentReference: r.payment_reference,
      paymentNetwork: r.payment_network,
      paymentProofUrl: r.payment_proof_url,
      paymentVerified: Boolean(r.payment_verified),
      createdAt: new Date(r.created_at).toISOString(),
    }));
  } catch {
    // Table not created yet — no orders have been placed.
    return [];
  }
}

export default async function AdminOrdersPage() {
  const orders = (await isAdmin()) ? await loadOrders() : [];

  if (orders === null) {
    return (
      <AdminShell title="Orders">
        <p className="text-sm text-muted">No database is configured on this deployment.</p>
      </AdminShell>
    );
  }

  const open = orders.filter((o) => !['completed', 'cancelled'].includes(o.status));

  return (
    <AdminShell
      title="Orders"
      intro={
        open.length > 0
          ? `${open.length} order${open.length === 1 ? '' : 's'} needing attention.`
          : 'Nothing open. Every order that reaches WhatsApp is recorded here.'
      }
    >
      <p className="mb-6 rounded-[--radius-plate] border border-line px-5 py-4 text-2xs leading-relaxed text-muted">
        These are order <strong className="text-ink">intents</strong>, captured when a customer
        taps through to WhatsApp. We cannot read your WhatsApp conversations, so an entry here
        means someone configured a belt and reached the handoff — not that they paid. Match each
        one to the chat that arrives and move it along the statuses.
      </p>

      {orders.length === 0 ? (
        <p className="text-sm leading-relaxed text-muted">
          No orders yet. They appear here the moment a customer taps Checkout on WhatsApp, sends
          a Belt Builder spec, or uses Buy on WhatsApp from a product page.
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {orders.map((order) => (
            <OrderRow key={order.id} order={order} />
          ))}
        </ul>
      )}
    </AdminShell>
  );
}
