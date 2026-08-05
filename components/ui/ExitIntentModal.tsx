'use client';

import { useEffect, useState } from 'react';
import { CloseIcon } from '@/components/ui/Icons';

const SESSION_KEY = 'ma-exit-shown';

/**
 * Exit-intent newsletter prompt.
 *
 * Rules, because this pattern is usually done badly:
 *  - Once per session, tracked in sessionStorage.
 *  - Desktop pointer devices only. On touch there is no "moving to the close
 *    button" signal, so the same trigger fires on ordinary scrolling.
 *  - Never before 20 seconds — an exit-intent popup on a bounce is just an
 *    interruption.
 *  - Escape closes it, focus is not trapped away from the page content.
 */
export default function ExitIntentModal() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.sessionStorage.getItem(SESSION_KEY)) return;

    // Touch and coarse pointers get no exit-intent at all.
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    let armed = false;
    const armTimer = window.setTimeout(() => {
      armed = true;
    }, 20_000);

    const onLeave = (e: MouseEvent) => {
      // Only when the cursor exits through the TOP of the viewport.
      if (!armed || e.clientY > 4) return;
      setOpen(true);
      window.sessionStorage.setItem(SESSION_KEY, '1');
      document.removeEventListener('mouseout', onLeave);
    };

    document.addEventListener('mouseout', onLeave);
    return () => {
      window.clearTimeout(armTimer);
      document.removeEventListener('mouseout', onLeave);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[85] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        onClick={() => setOpen(false)}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="exit-title"
        className="border-plate relative w-full max-w-md rounded-[--radius-plate] bg-surface p-8"
      >
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close"
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center text-subtle hover:text-ink"
        >
          <CloseIcon className="h-5 w-5" />
        </button>

        <span aria-hidden="true" className="mb-5 block h-px w-14 bg-plated" />

        {done ? (
          <>
            <h2 id="exit-title" className="text-2xl text-ink">
              You&rsquo;re on the list
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              We&rsquo;ll be in touch when the next giveaway opens.
            </p>
          </>
        ) : (
          <>
            <h2 id="exit-title" className="text-2xl text-ink">
              Before you go
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Join the list for new builds, workshop notes and belt giveaways. No spam, and one
              click to leave.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                // TODO: no mailing-list provider is connected yet. The address
                // is NOT stored anywhere — see TODO-BEFORE-LAUNCH.md.
                setDone(true);
              }}
              className="mt-6 flex flex-col gap-3 sm:flex-row"
            >
              <label htmlFor="exit-email" className="sr-only">
                Email address
              </label>
              <input
                id="exit-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="min-w-0 flex-1 rounded-[--radius-plate] border border-subtle/25 bg-canvas px-4 py-3 font-body text-sm text-ink placeholder:text-subtle/60 focus:border-primary focus:outline-none"
              />
              <button
                type="submit"
                className="shrink-0 rounded-[--radius-plate] bg-primary px-6 py-3 font-display text-sm uppercase tracking-wide text-on-primary hover:bg-primary-hover"
              >
                Join
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
