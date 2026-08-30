import 'server-only';

/**
 * Identify an image by its actual bytes, not by what the upload claims.
 *
 * A Content-Type header is set by the client and means nothing. `shell.php`
 * renamed to `photo.jpg` and posted with `image/jpeg` passes every check that
 * only reads metadata. Reading the magic bytes is what makes the claim
 * verifiable.
 *
 * SVG is deliberately absent. It is XML, it can carry <script>, and browsers
 * execute it when it is served from your own origin. There is no reason a
 * customer photo of a belt would be an SVG.
 */

export type SniffedType = 'image/jpeg' | 'image/png' | 'image/webp';

const startsWith = (buf: Uint8Array, bytes: number[], offset = 0): boolean =>
  bytes.every((b, i) => buf[offset + i] === b);

/** Returns the real type, or null when the bytes are not a supported image. */
export function sniffImageType(buf: Uint8Array): SniffedType | null {
  // JPEG: FF D8 FF
  if (startsWith(buf, [0xff, 0xd8, 0xff])) return 'image/jpeg';

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (startsWith(buf, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'image/png';

  // WebP: "RIFF" .... "WEBP" — the size field sits between the two markers.
  if (startsWith(buf, [0x52, 0x49, 0x46, 0x46]) && startsWith(buf, [0x57, 0x45, 0x42, 0x50], 8)) {
    return 'image/webp';
  }

  return null;
}

/**
 * Pixel dimensions, read from the header only.
 *
 * Guards against a decompression bomb: a 40MB PNG can be a handful of
 * kilobytes on disk and still exhaust memory when something tries to render
 * it. Returns null when the dimensions cannot be read cheaply, and the caller
 * decides — we do not pull in an image library to find out.
 */
export function readDimensions(
  buf: Uint8Array,
  type: SniffedType
): { width: number; height: number } | null {
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);

  try {
    if (type === 'image/png') {
      // IHDR width/height are big-endian at bytes 16 and 20.
      return { width: view.getUint32(16), height: view.getUint32(20) };
    }

    if (type === 'image/jpeg') {
      // Walk the segment markers to the start-of-frame, which carries the size.
      let offset = 2;
      while (offset + 9 < buf.length) {
        if (buf[offset] !== 0xff) {
          offset++;
          continue;
        }
        const marker = buf[offset + 1]!;
        // SOF0-SOF15, excluding the non-frame markers DHT/JPG/DAC.
        if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
          return { height: view.getUint16(offset + 5), width: view.getUint16(offset + 7) };
        }
        offset += 2 + view.getUint16(offset + 2);
      }
      return null;
    }

    if (type === 'image/webp') {
      const fourcc = String.fromCharCode(...buf.slice(12, 16));
      if (fourcc === 'VP8X') {
        // 24-bit little-endian, stored as (value - 1).
        const w = 1 + (buf[24]! | (buf[25]! << 8) | (buf[26]! << 16));
        const h = 1 + (buf[27]! | (buf[28]! << 8) | (buf[29]! << 16));
        return { width: w, height: h };
      }
      if (fourcc === 'VP8 ') {
        return { width: view.getUint16(26, true) & 0x3fff, height: view.getUint16(28, true) & 0x3fff };
      }
      if (fourcc === 'VP8L') {
        const bits = view.getUint32(21, true);
        return { width: 1 + (bits & 0x3fff), height: 1 + ((bits >> 14) & 0x3fff) };
      }
      return null;
    }
  } catch {
    return null;
  }

  return null;
}
