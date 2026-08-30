import { NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { put } from '@vercel/blob';
import { db } from '@/lib/db';
import { ensureAuthAttemptsTable } from '@/lib/db-schema';
import { sniffImageType, readDimensions } from '@/lib/imageSniff';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BYTES = 6 * 1024 * 1024;
/** Above this in either direction it is a decompression bomb, not a photo. */
const MAX_EDGE = 8000;
const RATE_WINDOW_MINUTES = 60;
const RATE_MAX_UPLOADS = 12;

/** Public prefix for review photos, so they are distinguishable in the store. */
const PREFIX = 'review-photos';

function uploaderKey(request: Request): string {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown';
  const ua = request.headers.get('user-agent') ?? '';
  return `revphoto:${createHash('sha256').update(`${ip}|${ua}`).digest('hex').slice(0, 24)}`;
}

/**
 * Review photo upload.
 *
 * This endpoint is PUBLIC — a customer leaving a review has no account — which
 * makes it the most exposed write path on the site. It is therefore the one
 * place where "the browser already checked" counts for nothing:
 *
 *  - The type is decided by the file's magic bytes, not its Content-Type
 *    header or its extension. A renamed script passes both of those.
 *  - SVG is refused outright. It is XML that can carry <script>, and it would
 *    be served from a domain we control.
 *  - Dimensions are read from the header, so a 20KB PNG claiming to be
 *    40000x40000 never reaches an image decoder.
 *  - The stored name is generated here. Nothing from the upload reaches the
 *    path, so a crafted filename cannot traverse or collide.
 *  - Rate limited per IP, because an open upload endpoint is free storage for
 *    anyone who finds it.
 *
 * A photo uploaded here is not public on its own: it only ever appears on the
 * site once the review carrying it has been approved by an admin.
 */
export async function POST(request: Request) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: 'Photo uploads are not switched on. You can still post your review without one.' },
      { status: 503 }
    );
  }

  const key = uploaderKey(request);
  const sql = db();

  // Rate limiting needs the database. If it is unreachable the upload is
  // refused rather than left unmetered — this is the one endpoint where
  // failing open would hand out free storage.
  if (!sql) {
    return NextResponse.json(
      { error: 'Photo uploads are unavailable right now. You can still post your review.' },
      { status: 503 }
    );
  }

  try {
    await ensureAuthAttemptsTable(sql);
    const rows = (await sql`
      SELECT COUNT(*)::int AS n FROM auth_attempts
      WHERE key = ${key} AND created_at > NOW() - make_interval(mins => ${RATE_WINDOW_MINUTES})
    `) as unknown as { n: number }[];

    if ((rows[0]?.n ?? 0) >= RATE_MAX_UPLOADS) {
      return NextResponse.json(
        { error: 'Too many photo uploads. Please try again later.' },
        { status: 429 }
      );
    }
  } catch (error) {
    console.error('[reviews/photos] rate check failed:', error);
    return NextResponse.json({ error: 'Upload failed. Please try again.' }, { status: 503 });
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get('file');

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No image received.' }, { status: 400 });
  }
  if (file.size === 0) {
    return NextResponse.json({ error: 'That file is empty.' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `That photo is ${(file.size / 1024 / 1024).toFixed(1)}MB. The limit is 6MB.` },
      { status: 400 }
    );
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const sniffed = sniffImageType(bytes);

  if (!sniffed) {
    return NextResponse.json(
      { error: 'That is not a JPG, PNG or WebP image. Please choose a photo.' },
      { status: 400 }
    );
  }

  const size = readDimensions(bytes, sniffed);
  if (size && (size.width > MAX_EDGE || size.height > MAX_EDGE)) {
    return NextResponse.json(
      { error: 'That image is too large in pixels. Please use a normal photo.' },
      { status: 400 }
    );
  }

  const ext = sniffed === 'image/jpeg' ? 'jpg' : sniffed === 'image/png' ? 'png' : 'webp';

  try {
    const blob = await put(`${PREFIX}/${Date.now()}.${ext}`, new Blob([bytes], { type: sniffed }), {
      access: 'public',
      addRandomSuffix: true,
      contentType: sniffed,
    });

    await sql`INSERT INTO auth_attempts (key) VALUES (${key})`.catch(() => {});

    return NextResponse.json({ ok: true, url: blob.url });
  } catch (error) {
    console.error('[reviews/photos] upload failed:', error);
    return NextResponse.json({ error: 'Upload failed. Please try again.' }, { status: 500 });
  }
}
