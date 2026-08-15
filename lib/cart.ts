'use client';

/**
 * Cart state, persisted to localStorage.
 *
 * Modelled as a real commerce cart even though v1 checks out via WhatsApp and
 * email. Line items carry a stable `key` derived from product + variant
 * selection, quantities are editable, and totals are computed from unit prices
 * captured at add-time. Dropping Stripe in later means reading `items` and
 * building a Checkout Session — no shape changes.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { VariantSelection } from './variants';

export interface CartItem {
  /** Stable identity: same product + same variants collapses into one line. */
  key: string;
  productId: string;
  slug: string;
  name: string;
  image: string;
  imageAlt: string;
  /** Unit price at the moment it was added, including variant modifiers. */
  unitPrice: number;
  currency: string;
  quantity: number;
  selection: VariantSelection;
  engraving: string;
  /** Rendered spec lines, so the cart reads correctly without re-deriving. */
  specLines: string[];
}

interface CartState {
  items: CartItem[];
  /** Order notes travel with the WhatsApp/email handoff. */
  notes: string;
  isOpen: boolean;

  addItem: (item: Omit<CartItem, 'key' | 'quantity'>, quantity?: number) => void;
  removeItem: (key: string) => void;
  setQuantity: (key: string, quantity: number) => void;
  setNotes: (notes: string) => void;
  clear: () => void;
  openCart: () => void;
  closeCart: () => void;
}

export function makeCartKey(
  productId: string,
  selection: VariantSelection,
  engraving: string
): string {
  const variantPart = Object.keys(selection)
    .sort()
    .map((k) => `${k}:${selection[k]}`)
    .join('|');
  return `${productId}__${variantPart}__${engraving.trim().toLowerCase()}`;
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      notes: '',
      isOpen: false,

      addItem: (item, quantity = 1) =>
        set((state) => {
          const key = makeCartKey(item.productId, item.selection, item.engraving);
          const existing = state.items.find((i) => i.key === key);

          if (existing) {
            return {
              items: state.items.map((i) =>
                i.key === key ? { ...i, quantity: i.quantity + quantity } : i
              ),
            };
          }

          return { items: [...state.items, { ...item, key, quantity }] };
        }),

      removeItem: (key) => set((state) => ({ items: state.items.filter((i) => i.key !== key) })),

      setQuantity: (key, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((i) => i.key !== key)
              : state.items.map((i) => (i.key === key ? { ...i, quantity } : i)),
        })),

      setNotes: (notes) => set({ notes }),
      clear: () => set({ items: [], notes: '' }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
    }),
    {
      name: 'ma-cart',
      storage: createJSONStorage(() => localStorage),
      // Never persist UI state — a reload should not reopen the drawer.
      partialize: (state) => ({ items: state.items, notes: state.notes }),

      /*
       * v2: lines added from a product page were saved without their build id
       * in `selection`, so checkout could not price them and refused the whole
       * order. Those lines cannot be repaired here — the store has no access to
       * the catalogue — so they are dropped and the customer re-adds.
       *
       * Dropping a stale line is not nice, but it is far better than a cart
       * that looks fine and cannot be paid for.
       */
      version: 2,
      migrate: (persisted, fromVersion) => {
        const state = persisted as { items?: CartItem[]; notes?: string } | undefined;
        if (fromVersion >= 2) return state;
        return { items: [], notes: state?.notes ?? '' };
      },
    }
  )
);

/* -- Selectors. Kept outside the store so components subscribe narrowly. -- */

export const selectCount = (s: CartState): number =>
  s.items.reduce((n, i) => n + i.quantity, 0);

export const selectSubtotal = (s: CartState): number =>
  s.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
