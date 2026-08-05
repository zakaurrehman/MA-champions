'use client';

import { whatsAppHref } from '@/lib/site';
import { WhatsAppIcon } from '@/components/ui/Icons';

/**
 * Floating WhatsApp button.
 *
 * Renders nothing at all when no number is configured — a float button that
 * opens a broken wa.me link is worse than no button, because it looks like a
 * working support channel.
 *
 * Positioned bottom-LEFT so it never covers the toast stack or a cart CTA.
 */
export default function WhatsAppFloat() {
  const href = whatsAppHref('Hi, I have a question about a championship belt.');
  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-4 left-4 z-[60] grid h-13 w-13 place-items-center rounded-full bg-[#25D366] p-3.5 text-white shadow-lg transition-transform hover:scale-105 motion-reduce:transition-none motion-reduce:hover:scale-100"
    >
      <WhatsAppIcon className="h-6 w-6" />
    </a>
  );
}
