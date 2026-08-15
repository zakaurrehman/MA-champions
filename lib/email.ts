import 'server-only';
import { site } from './site';

/**
 * Transactional email.
 *
 * Optional, like every other service here. Without RESEND_API_KEY nothing is
 * sent and every caller is told so plainly — no silent failures, and no
 * pretending a reset link went out when it did not.
 *
 * Resend over raw SMTP because serverless functions and long-lived SMTP
 * connections are a poor match, and because it needs no dependency: one POST.
 */

export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

interface Message {
  to: string;
  subject: string;
  /** Plain text. Also used to build the HTML part, so write it readably. */
  text: string;
}

export async function sendEmail({ to, subject, text }: Message): Promise<boolean> {
  if (!emailConfigured()) return false;

  const html = text
    .split('\n\n')
    .map((block) => `<p style="margin:0 0 16px;line-height:1.6">${escapeHtml(block)}</p>`)
    .join('');

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to,
        reply_to: site.email ?? undefined,
        subject,
        text,
        html: `<div style="font-family:system-ui,sans-serif;font-size:15px;color:#1a1a1a">${html}</div>`,
      }),
      cache: 'no-store',
    });

    if (!res.ok) {
      console.error('[email] send failed:', res.status, await res.text().catch(() => ''));
      return false;
    }
    return true;
  } catch (error) {
    console.error('[email] send threw:', error);
    return false;
  }
}

/** Anything interpolated into the HTML part must go through this. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
