'use client';

import Link from 'next/link';
import { useToasts } from '@/lib/toast';
import { CloseIcon } from '@/components/ui/Icons';

/**
 * Toast host. Sits in the layout once.
 *
 * The container is a polite live region so screen readers hear cart
 * confirmations without focus being stolen mid-task.
 */
export default function Toaster() {
  const toasts = useToasts((s) => s.toasts);
  const dismiss = useToasts((s) => s.dismiss);

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed bottom-4 left-1/2 z-[90] flex w-[min(24rem,calc(100vw-2rem))] -translate-x-1/2 flex-col gap-2 sm:left-auto sm:right-4 sm:translate-x-0"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="reveal pointer-events-auto flex items-center gap-3 rounded-[--radius-plate] border border-line bg-surface px-4 py-3 shadow-lg"
        >
          <p className="min-w-0 flex-1 font-body text-sm text-ink">{toast.message}</p>

          {toast.action && (
            <Link
              href={toast.action.href}
              onClick={() => dismiss(toast.id)}
              className="shrink-0 font-body text-2xs font-semibold uppercase tracking-[0.14em] text-link hover:text-link-hover"
            >
              {toast.action.label}
            </Link>
          )}

          <button
            type="button"
            onClick={() => dismiss(toast.id)}
            aria-label="Dismiss notification"
            className="-mr-1 grid h-7 w-7 shrink-0 place-items-center text-subtle hover:text-ink"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
