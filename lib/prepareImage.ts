/**
 * Downscale and re-encode an image in the browser before it is uploaded.
 *
 * Product photos come off a phone at 3–8MB and 4000px wide. Nothing on the
 * site displays a belt wider than ~1600px, so the rest is pure waste — waste
 * we used to pay for twice: once storing it, once every time Vercel resized it
 * on the fly.
 *
 * Doing it here means the file in Blob is already the file we serve, so the
 * image optimizer is not needed at all. That is what stops the 402.
 *
 * Runs in the browser only (canvas). Never import this from server code.
 */

const MAX_EDGE = 1600;
const QUALITY = 0.82;
/** Below this, re-encoding usually makes the file bigger, not smaller. */
const SKIP_UNDER_BYTES = 300 * 1024;

async function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === 'function') {
    try {
      // from-image so a portrait phone photo is not rotated on its side.
      return await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {
      /* fall through to the <img> path */
    }
  }

  const url = URL.createObjectURL(file);
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('decode failed'));
      img.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Returns a web-ready WebP, or the original file when shrinking it would not
 * help. Never throws — a failure here must not block the upload, because a
 * large photo on the site beats no photo on the site.
 */
export async function prepareImageForUpload(file: File): Promise<File> {
  // SVG has no pixels to resample, and animated GIF would lose its frames.
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') return file;
  if (file.size < SKIP_UNDER_BYTES) return file;

  try {
    const source = await loadBitmap(file);
    const width = 'naturalWidth' in source ? source.naturalWidth : source.width;
    const height = 'naturalHeight' in source ? source.naturalHeight : source.height;
    if (!width || !height) return file;

    const scale = Math.min(1, MAX_EDGE / Math.max(width, height));
    const targetW = Math.round(width * scale);
    const targetH = Math.round(height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;

    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(source as CanvasImageSource, 0, 0, targetW, targetH);

    if ('close' in source) source.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/webp', QUALITY)
    );

    // Some encoders make small or already-compressed images larger. Keep
    // whichever is actually smaller rather than assuming we improved it.
    if (!blob || blob.size >= file.size) return file;

    const name = file.name.replace(/\.[^.]+$/, '') + '.webp';
    return new File([blob], name, { type: 'image/webp' });
  } catch {
    return file;
  }
}
