'use client';

import { useState } from 'react';
import { CUSTOM_ORDER_GROUPS, UNSURE, allowedValues } from '@/lib/customOrder';
import { site } from '@/lib/site';

const field =
  'w-full rounded-[--radius-plate] border border-subtle/25 bg-canvas px-4 py-2.5 font-body text-sm text-ink placeholder:text-subtle/60 focus:border-primary focus:outline-none';
const label =
  'mb-1.5 block font-body text-2xs font-semibold uppercase tracking-[0.2em] text-subtle';

/**
 * Send us your design and specs, and we quote it.
 *
 * The straight-to-the-point route for someone who already knows what they want
 * — or who has a picture of it. The visual builder is the other route; this one
 * exists because a customer holding a reference photo should not have to click
 * through six steps to send it.
 *
 * No price is shown or calculated. A one-off build is quoted by a human.
 */
export default function CustomOrderForm() {
  const [choice, setChoice] = useState<Record<string, string>>({});
  const [design, setDesign] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState<{ reference: string } | null>(null);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (busy) return;

    setBusy(true);
    setError('');

    const form = new FormData(e.currentTarget);
    for (const [id, value] of Object.entries(choice)) form.set(id, value);
    if (design) form.set('design', design);

    try {
      const res = await fetch('/api/custom-orders', { method: 'POST', body: form });
      const data = (await res.json().catch(() => ({}))) as {
        reference?: string;
        error?: string;
      };

      if (res.ok && data.reference) {
        setDone({ reference: data.reference });
        return;
      }
      setError(data.error ?? 'Could not send your request.');
    } catch {
      setError('Could not reach the server. Please try again, or message us on WhatsApp.');
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div role="status" className="rounded-[--radius-plate] border border-line p-8 text-center">
        <p className="font-display text-3xl text-ink">Request received</p>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Your reference is <strong className="text-ink">{done.reference}</strong>. We will look at
          your design and come back with a price and a timeline.
        </p>
        <p className="mt-4 text-2xs leading-relaxed text-muted">
          Nothing has been charged. No belt is cut until you have approved a design and a price.
        </p>
        {site.whatsapp && (
          <a
            href={`https://wa.me/${site.whatsapp}?text=${encodeURIComponent(
              `Hi, I just sent a custom belt request. My reference is ${done.reference}.`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-block rounded-[--radius-plate] border border-subtle/40 px-6 py-3 font-body text-xs font-semibold uppercase tracking-[0.14em] text-ink hover:border-primary hover:text-link"
          >
            Follow up on WhatsApp
          </a>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-[--radius-plate] border border-line p-6 sm:p-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="co-name" className={label}>
            Your name *
          </label>
          <input id="co-name" name="name" required autoComplete="name" className={field} />
        </div>
        <div>
          <label htmlFor="co-email" className={label}>
            Email *
          </label>
          <input
            id="co-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className={field}
          />
        </div>
        <div>
          <label htmlFor="co-phone" className={label}>
            Phone / WhatsApp
          </label>
          <input id="co-phone" name="phone" autoComplete="tel" className={field} />
        </div>
        <div>
          <label htmlFor="co-budget" className={label}>
            Your budget in USD
          </label>
          <input
            id="co-budget"
            name="budget"
            inputMode="numeric"
            placeholder="e.g. 400–600"
            className={field}
          />
        </div>
      </div>

      {/* Artwork */}
      <div className="mt-6">
        <span className={label}>Your design, reference photo or sketch</span>

        <input
          id="co-design"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml,application/pdf"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0] ?? null;
            setDesign(file);
            // Object URLs keep large files out of React state.
            setPreview(file && file.type.startsWith('image/') ? URL.createObjectURL(file) : null);
          }}
        />

        {design ? (
          <div className="flex items-center gap-3 rounded-[--radius-plate] border border-line p-3">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element -- local blob: URL, not a remote asset
              <img
                src={preview}
                alt=""
                className="h-16 w-16 shrink-0 rounded-[--radius-plate] object-cover"
              />
            ) : (
              <span className="grid h-16 w-16 shrink-0 place-items-center rounded-[--radius-plate] border border-line font-body text-2xs uppercase text-subtle">
                {design.type === 'application/pdf' ? 'PDF' : 'SVG'}
              </span>
            )}
            <span className="min-w-0 flex-1">
              <span className="block truncate font-body text-sm text-ink">{design.name}</span>
              <span className="block text-2xs text-muted">
                {(design.size / 1024 / 1024).toFixed(1)} MB
              </span>
            </span>
            <button
              type="button"
              onClick={() => {
                setDesign(null);
                setPreview(null);
              }}
              className="shrink-0 font-body text-2xs font-semibold uppercase tracking-[0.14em] text-link hover:text-link-hover"
            >
              Remove
            </button>
          </div>
        ) : (
          <label
            htmlFor="co-design"
            className="flex cursor-pointer flex-col items-center rounded-[--radius-plate] border-2 border-dashed border-subtle/30 px-4 py-8 text-center transition-colors hover:border-primary"
          >
            <span className="font-body text-sm font-semibold text-ink">
              Attach your design or a photo of the belt you want
            </span>
            <span className="mt-1 text-2xs text-muted">
              PNG, JPG, SVG or PDF · up to 8 MB · optional
            </span>
          </label>
        )}
      </div>

      {/* Specs */}
      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        {CUSTOM_ORDER_GROUPS.map((group) => (
          <fieldset key={group.id}>
            <legend className={label}>{group.label}</legend>
            <div className="flex flex-wrap gap-1.5">
              {allowedValues(group).map((value) => {
                const active = choice[group.id] === value;
                return (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={active}
                    onClick={() =>
                      setChoice((prev) => ({
                        ...prev,
                        // Clicking the active chip clears it, so a mis-tap is undoable.
                        [group.id]: active ? '' : value,
                      }))
                    }
                    className={`rounded-[--radius-plate] border px-3 py-2 font-body text-2xs font-semibold transition-colors ${
                      active
                        ? 'border-primary bg-primary/10 text-link'
                        : 'border-subtle/30 text-muted hover:border-subtle/60'
                    } ${value === UNSURE ? 'italic' : ''}`}
                  >
                    {value}
                  </button>
                );
              })}
            </div>
          </fieldset>
        ))}
      </div>

      <div className="mt-6">
        <label htmlFor="co-instructions" className={label}>
          Anything else we should know?
        </label>
        <textarea
          id="co-instructions"
          name="instructions"
          rows={4}
          placeholder="Nameplate text, side plate wording, colours, a deadline, a belt you want it to match…"
          className={field}
        />
      </div>

      {error && (
        <p role="alert" className="mt-4 text-sm text-link">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="mt-6 w-full rounded-[--radius-plate] bg-primary px-6 py-4 font-display text-sm uppercase tracking-wide text-on-primary transition-colors hover:bg-primary-hover disabled:opacity-40"
      >
        {busy ? 'Sending…' : 'Send my custom belt request'}
      </button>

      <p className="mt-4 text-2xs leading-relaxed text-muted">
        This is a quote request, not a purchase. Nothing is charged now. We will confirm the price
        and the build time with you before anything is made — a one-off belt cannot be priced
        honestly from a form, so we will not pretend otherwise.
      </p>
    </form>
  );
}
