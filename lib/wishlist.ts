'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface WishlistState {
  /** Product slugs. Slugs rather than ids so saved items survive a CMS swap. */
  slugs: string[];
  toggle: (slug: string) => void;
  remove: (slug: string) => void;
  clear: () => void;
}

export const useWishlist = create<WishlistState>()(
  persist(
    (set) => ({
      slugs: [],

      toggle: (slug) =>
        set((state) => ({
          slugs: state.slugs.includes(slug)
            ? state.slugs.filter((s) => s !== slug)
            : [slug, ...state.slugs],
        })),

      remove: (slug) => set((state) => ({ slugs: state.slugs.filter((s) => s !== slug) })),
      clear: () => set({ slugs: [] }),
    }),
    { name: 'ma-wishlist', storage: createJSONStorage(() => localStorage) }
  )
);

export const selectIsWished = (slug: string) => (s: WishlistState) => s.slugs.includes(slug);
