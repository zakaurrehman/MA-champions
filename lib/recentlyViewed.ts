'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const MAX = 8;

interface RecentState {
  slugs: string[];
  /** Moves an existing slug to the front rather than duplicating it. */
  record: (slug: string) => void;
  clear: () => void;
}

export const useRecentlyViewed = create<RecentState>()(
  persist(
    (set) => ({
      slugs: [],

      record: (slug) =>
        set((state) => ({
          slugs: [slug, ...state.slugs.filter((s) => s !== slug)].slice(0, MAX),
        })),

      clear: () => set({ slugs: [] }),
    }),
    { name: 'ma-recent', storage: createJSONStorage(() => localStorage) }
  )
);
