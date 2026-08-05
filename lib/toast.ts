'use client';

import { create } from 'zustand';

export interface Toast {
  id: number;
  message: string;
  /** Optional link rendered as an action, e.g. "View cart". */
  action?: { label: string; href: string };
}

interface ToastState {
  toasts: Toast[];
  push: (message: string, action?: Toast['action']) => void;
  dismiss: (id: number) => void;
}

let nextId = 0;

export const useToasts = create<ToastState>()((set) => ({
  toasts: [],

  push: (message, action) => {
    const id = nextId++;
    set((state) => ({ toasts: [...state.toasts, { id, message, action }] }));
    // Auto-dismiss. The Toaster also allows manual dismissal, and screen
    // readers get the message via an aria-live region regardless.
    window.setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 4000);
  },

  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));
