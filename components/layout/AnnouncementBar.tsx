'use client';

import { useEffect, useState } from 'react';
import { site, leadTimeLabel } from '@/lib/site';

/**
 * Rotating announcement bar.
 *
 * Only states facts we actually hold. The brief also asked for a "current
 * discount" message — we have no discount figure from the client, so that slot
 * is omitted rather than invented. Add it to `messages` once supplied.
 */
function buildMessages(): string[] {
  const out: string[] = [`Free shipping to ${site.shipping.freeTo.join(', ')}`];

  if (site.shipping.worldwide) out.push('Worldwide delivery on every belt');

  // TODO: add discount message when the client supplies a live promotion.

  const custom = leadTimeLabel('custom');
  if (custom) out.push(`Custom belts: ${custom}`);

  out.push('Free digital proof before we cut metal');
  return out;
}

const ROTATE_MS = 5000;

export default function AnnouncementBar() {
  const messages = buildMessages();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (messages.length < 2) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Under reduced-motion we still rotate (the copy matters) but never animate.
    const id = window.setInterval(
      () => setIndex((i) => (i + 1) % messages.length),
      reduced ? ROTATE_MS * 2 : ROTATE_MS
    );
    return () => window.clearInterval(id);
  }, [messages.length]);

  return (
    <div className="relative z-50 bg-oxblood text-bone">
      <div className="mx-auto flex h-9 max-w-7xl items-center justify-center px-4">
        <p
          key={index}
          aria-live="polite"
          className="animate-[reveal-up_0.4s_ease-out] text-center text-2xs font-medium uppercase tracking-[0.16em] sm:text-xs"
        >
          {messages[index]}
        </p>
      </div>
    </div>
  );
}
