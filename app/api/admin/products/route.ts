import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureProductsTable } from '@/lib/db-schema';
import { isAdmin } from '@/lib/adminAuth';
import { revalidateCatalogue } from '@/lib/revalidate';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ImageInput {
  src: string;
  alt: string;
}

/** Slugify, then guarantee something usable rather than an empty string. */
function toSlug(value: string): string {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90);
  return slug || `belt-${Date.now()}`;
}

function money(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : null;
}

interface VariantInput {
  id?: unknown;
  name?: unknown;
  salePrice?: unknown;
  originalPrice?: unknown;
  stock?: unknown;
  inStock?: unknown;
  isDefault?: unknown;
}

/**
 * Normalises the build ladder before it is stored.
 *
 * These prices are what customers are actually charged — lib/pricing.ts reads
 * them back as authoritative — so a slip in the admin form must not become a
 * NaN, a negative price or a nameless build on the live product page.
 *
 * Builds with no name or no price are dropped rather than rejected: a
 * half-filled row is almost always one the admin added and abandoned, and
 * failing the whole save over it would lose the rest of their work.
 */
function normaliseVariants(raw: unknown): {
  variants: Record<string, unknown>[];
  error?: string;
} {
  if (!Array.isArray(raw)) return { variants: [] };

  const variants: Record<string, unknown>[] = [];
  const seenIds = new Set<string>();

  for (const entry of (raw as VariantInput[]).slice(0, 20)) {
    const name = String(entry.name ?? '').trim().slice(0, 80);
    const salePrice = money(entry.salePrice);
    if (!name || salePrice === null || salePrice <= 0) continue;

    const originalPrice = entry.originalPrice == null ? null : money(entry.originalPrice);
    if (originalPrice !== null && originalPrice <= salePrice) {
      return {
        variants: [],
        error: `“${name}”: the compare-at price must be higher than the price charged, or left blank.`,
      };
    }

    // Ids are referenced by carts and saved orders. A duplicate would make one
    // build unreachable and could price a line at the wrong variant.
    let id = String(entry.id ?? '').trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    while (seenIds.has(id)) id = `${id}-2`;
    seenIds.add(id);

    variants.push({
      id,
      name,
      salePrice,
      originalPrice,
      stock: typeof entry.stock === 'number' ? entry.stock : null,
      inStock: entry.inStock !== false,
      isDefault: entry.isDefault === true,
    });
  }

  // Exactly one default, or the product page has no build to lead with and
  // falls back to the cheapest — headlining every belt at the entry price.
  const defaults = variants.filter((v) => v.isDefault);
  if (variants.length > 0 && defaults.length !== 1) {
    for (const v of variants) v.isDefault = false;
    const lead = variants.find((v) => v.inStock) ?? variants[0]!;
    lead.isDefault = true;
  }

  return { variants };
}

/** Create or update. `slug` present means update, absent means create. */
export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Not authorised.' }, { status: 401 });
  }

  const sql = db();
  if (!sql) {
    return NextResponse.json({ error: 'No database configured.' }, { status: 503 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const name = String(body.name ?? '').trim();
  if (name.length < 3) {
    return NextResponse.json({ error: 'Give the belt a name.' }, { status: 400 });
  }

  const price = money(body.price);
  if (price === null) {
    return NextResponse.json({ error: 'Enter a valid price.' }, { status: 400 });
  }

  const originalPrice = body.originalPrice == null ? null : money(body.originalPrice);

  // A compare-at below the selling price would render a negative discount.
  // lib/pricing.ts already refuses to display it, but storing it is still wrong.
  if (originalPrice !== null && originalPrice <= price) {
    return NextResponse.json(
      { error: 'The compare-at price must be higher than the selling price, or left blank.' },
      { status: 400 }
    );
  }

  const { variants, error: variantError } = normaliseVariants(body.variants);
  if (variantError) {
    return NextResponse.json({ error: variantError }, { status: 400 });
  }

  const slug = body.slug ? String(body.slug) : toSlug(name);
  const images = Array.isArray(body.images) ? (body.images as ImageInput[]) : [];

  // Alt text is not optional. A product image with no alt is invisible to
  // screen readers and to image search.
  const missingAlt = images.filter((i) => !i.alt || i.alt.trim().length < 3);
  if (missingAlt.length > 0) {
    return NextResponse.json(
      { error: `${missingAlt.length} image(s) still need alt text describing the belt.` },
      { status: 400 }
    );
  }

  try {
    await ensureProductsTable(sql);

    const isUpdate = Boolean(body.slug);

    await sql`
      INSERT INTO products (
        slug, name, category, collections, material_tier,
        price, original_price, sale_price, currency,
        in_stock, featured, shop_visible, custom_gallery,
        short_description, description,
        variant_label, specs, variants, images
      ) VALUES (
        ${slug},
        ${name},
        ${String(body.category ?? 'wrestling')},
        ${(body.collections as string[]) ?? []},
        ${String(body.materialTier ?? 'hd-cnc-premium')},
        ${price},
        ${originalPrice},
        ${body.salePrice == null ? null : money(body.salePrice)},
        ${String(body.currency ?? 'USD')},
        ${body.inStock !== false},
        ${body.featured === true},
        ${body.shopVisible !== false},
        ${body.customGallery === true},
        ${String(body.shortDescription ?? '')},
        ${String(body.description ?? '')},
        ${body.variantLabel ? String(body.variantLabel) : null},
        ${JSON.stringify(body.specs ?? {})},
        ${JSON.stringify(variants)},
        ${JSON.stringify(images)}
      )
      ON CONFLICT (slug) DO UPDATE SET
        name              = EXCLUDED.name,
        category          = EXCLUDED.category,
        collections       = EXCLUDED.collections,
        material_tier     = EXCLUDED.material_tier,
        price             = EXCLUDED.price,
        original_price    = EXCLUDED.original_price,
        sale_price        = EXCLUDED.sale_price,
        currency          = EXCLUDED.currency,
        in_stock          = EXCLUDED.in_stock,
        featured          = EXCLUDED.featured,
        shop_visible      = EXCLUDED.shop_visible,
        custom_gallery    = EXCLUDED.custom_gallery,
        short_description = EXCLUDED.short_description,
        description       = EXCLUDED.description,
        variant_label     = EXCLUDED.variant_label,
        specs             = EXCLUDED.specs,
        variants          = EXCLUDED.variants,
        images            = EXCLUDED.images,
        updated_at        = NOW()
    `;

    // The storefront is statically rendered — without this the change is
    // invisible until the next deploy.
    revalidateCatalogue();

    return NextResponse.json({ ok: true, slug, created: !isUpdate });
  } catch (error) {
    console.error('[api/admin/products] save failed:', error);
    return NextResponse.json({ error: 'Could not save the belt.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Not authorised.' }, { status: 401 });
  }

  const sql = db();
  if (!sql) {
    return NextResponse.json({ error: 'No database configured.' }, { status: 503 });
  }

  const slug = new URL(request.url).searchParams.get('slug');
  if (!slug) return NextResponse.json({ error: 'Missing slug.' }, { status: 400 });

  try {
    await sql`DELETE FROM products WHERE slug = ${slug}`;

    // Especially important on delete: a removed belt must stop being
    // purchasable immediately, not in five minutes.
    revalidateCatalogue();

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[api/admin/products] delete failed:', error);
    return NextResponse.json({ error: 'Could not delete the belt.' }, { status: 500 });
  }
}
