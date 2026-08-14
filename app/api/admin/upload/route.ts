import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { isAdmin } from '@/lib/adminAuth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

/**
 * Product image upload to Vercel Blob.
 *
 * The file is validated on the SERVER, not just in the browser: an attacker
 * posts here directly and never runs our client code. Content type and size
 * are both checked, and the stored filename is generated rather than taken
 * from the upload, so a crafted name cannot traverse paths or collide with an
 * existing object.
 */
export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Not authorised.' }, { status: 401 });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      {
        error:
          'Image storage is not configured. Add a Vercel Blob store and redeploy.',
        setup: 'Vercel dashboard → Storage → Create Blob store',
      },
      { status: 503 }
    );
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get('file');

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file received.' }, { status: 400 });
  }
  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json(
      { error: 'Use a JPG, PNG, WebP or AVIF image.' },
      { status: 400 }
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `That image is ${(file.size / 1024 / 1024).toFixed(1)}MB. The limit is 10MB.` },
      { status: 400 }
    );
  }

  const slug = String(form?.get('slug') ?? 'product')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60);

  const ext = file.type.split('/')[1]?.replace('jpeg', 'jpg') ?? 'jpg';

  try {
    const blob = await put(`products/${slug}-${Date.now()}.${ext}`, file, {
      access: 'public',
      addRandomSuffix: true,
    });

    return NextResponse.json({ ok: true, url: blob.url });
  } catch (error) {
    console.error('[api/admin/upload] failed:', error);
    return NextResponse.json({ error: 'Upload failed. Please try again.' }, { status: 500 });
  }
}
