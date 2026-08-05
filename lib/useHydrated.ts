'use client';

import { useEffect, useState } from 'react';

/**
 * True only after the client has hydrated.
 *
 * Anything read from localStorage — cart count, wishlist state, recently
 * viewed — differs between the server render (empty) and the first client
 * render (populated). Rendering that difference directly is a hydration
 * mismatch: React throws in development and silently keeps the WRONG markup
 * in production. Gate on this instead.
 */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}
