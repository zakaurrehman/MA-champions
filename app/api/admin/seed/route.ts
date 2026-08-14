import { NextResponse } from 'next/server';
import raw from '@/data/products.json';
import { db } from '@/lib/db';
import { ensureAllTables } from '@/lib/db-schema';
import { isAdmin } from '@/lib/adminAuth';
import { revalidateCatalogue } from '@/lib/revalidate';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Seeds the catalogue from data/products.json.
 *
 * This exists so seeding can be done from the deployed site, where the
 * database credentials already live, rather than requiring DATABASE_URL to be
 * copied onto a laptop first.
 *
 * ON CONFLICT DO NOTHING, deliberately — unlike scripts/migrate.ts, which
 * upserts. Once a belt has been edited in the admin panel, the JSON file is
 * stale by definition; re-running this must never silently overwrite that work.
 * It only ever fills in what is missing.
 */
export async function POST() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Not authorised.' }, { status: 401 });
  }

  const sql = db();
  if (!sql) {
    return NextResponse.json({ error: 'No database configured.' }, { status: 503 });
  }

  try {
    await ensureAllTables(sql);

    const products = raw.products as unknown as Record<string, unknown>[];
    let inserted = 0;

    for (const [index, p] of products.entries()) {
      const visibility = (p.visibility ?? {}) as Record<string, boolean>;

      const result = (await sql`
        INSERT INTO products (
          slug, name, category, collections, material_tier,
          price, original_price, sale_price, currency,
          in_stock, featured, shop_visible, custom_gallery,
          short_description, description,
          variant_label, specs, variants, images, sort_order
        ) VALUES (
          ${p.slug as string},
          ${p.name as string},
          ${(p.category as string) ?? 'wrestling'},
          ${(p.collections as string[]) ?? []},
          ${(p.materialTier as string) ?? 'hd-cnc-premium'},
          ${p.price as number},
          ${(p.originalPrice as number) ?? null},
          ${(p.salePrice as number) ?? null},
          ${(p.currency as string) ?? 'USD'},
          ${(p.inStock as boolean) ?? true},
          ${(p.featured as boolean) ?? false},
          ${visibility.shop ?? true},
          ${visibility.customGallery ?? false},
          ${(p.shortDescription as string) ?? ''},
          ${(p.description as string) ?? ''},
          ${(p.variantLabel as string) ?? null},
          ${JSON.stringify(p.specs ?? {})},
          ${JSON.stringify(p.variants ?? [])},
          ${JSON.stringify(p.images ?? [])},
          ${index}
        )
        ON CONFLICT (slug) DO NOTHING
        RETURNING slug
      `) as unknown as { slug: string }[];

      if (result.length > 0) inserted++;
    }

    const counts = (await sql`
      SELECT COUNT(*)::int AS total,
             COUNT(*) FILTER (WHERE shop_visible)::int AS visible
      FROM products
    `) as unknown as { total: number; visible: number }[];

    revalidateCatalogue();

    return NextResponse.json({
      ok: true,
      inserted,
      skipped: products.length - inserted,
      total: counts[0]?.total ?? 0,
      visible: counts[0]?.visible ?? 0,
    });
  } catch (error) {
    console.error('[api/admin/seed] failed:', error);
    return NextResponse.json({ error: 'Seed failed. Check the logs.' }, { status: 500 });
  }
}
