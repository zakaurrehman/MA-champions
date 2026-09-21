/**
 * Shown across every admin page while the database is unreachable.
 *
 * The wording is deliberate. The first thing an owner needs to know is that
 * nothing has been lost, and the second is what customers are experiencing
 * right now — because "the shop looks fine" is exactly why an outage like this
 * goes unnoticed while orders quietly fail to save.
 */
export default function DbHealthBanner({ reason }: { reason: 'quota' | 'unreachable' }) {
  return (
    <div role="alert" className="rounded-[--radius-plate] border border-primary/60 p-5">
      <p className="font-body text-2xs font-semibold uppercase tracking-[0.16em] text-link">
        Database unavailable
      </p>

      <p className="mt-2 text-sm leading-relaxed text-ink">
        {reason === 'quota'
          ? 'The database provider (Neon) has blocked access because this project used up its monthly data transfer allowance.'
          : 'The site cannot reach its database right now.'}{' '}
        <strong>Your products, orders and reviews are safe</strong> — they simply cannot be read or
        saved until access is restored.
      </p>

      <p className="mt-3 text-sm font-semibold text-ink">What customers see meanwhile</p>
      <ul className="mt-1 list-disc pl-5 text-sm leading-relaxed text-muted">
        <li>A backup copy of the catalogue, which is smaller than your live one.</li>
        <li>
          Orders, payment confirmations, reviews and new accounts <strong>cannot be saved</strong>.
          Anyone who has paid should be pointed to WhatsApp.
        </li>
      </ul>

      {reason === 'quota' && (
        <p className="mt-3 text-sm leading-relaxed text-muted">
          <strong className="text-ink">To fix it:</strong> open the Neon console, go to Billing,
          and either upgrade the plan or wait for the allowance to reset. Nothing needs
          re-uploading.
        </p>
      )}
    </div>
  );
}
