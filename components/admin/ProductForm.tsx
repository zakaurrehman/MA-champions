'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Product, ProductVariant } from '@/lib/types';
import { formatPrice } from '@/lib/format';
import { discountPercent } from '@/lib/pricing';
import { DEFAULT_VARIANT_LABEL } from '@/lib/buildLadder';
import ImageUploader, { type EditableImage } from './ImageUploader';
import VariantEditor from './VariantEditor';

const TIERS = [
  'brass',
  'boxing',
  'zinc',
  '24k-gold',
  'hd-cnc-premium',
  'fully-custom',
] as const;

/** Must stay in step with the `category` union in lib/types.ts. */
const CATEGORIES = [
  'wrestling',
  'boxing',
  'mma',
  'nfl',
  'nba',
  'nhl',
  'mlb',
  'fantasy',
  'corporate',
  'custom',
] as const;

const field =
  'w-full rounded-[--radius-plate] border border-subtle/25 bg-canvas px-4 py-2.5 font-body text-sm text-ink placeholder:text-subtle/60 focus:border-primary focus:outline-none';
const label =
  'mb-1.5 block font-body text-2xs font-semibold uppercase tracking-[0.2em] text-subtle';

export default function ProductForm({ product }: { product: Product | null }) {
  const isNew = product === null;
  const router = useRouter();

  const [name, setName] = useState(product?.name ?? '');
  const [shortDescription, setShort] = useState(product?.shortDescription ?? '');
  const [description, setDescription] = useState(product?.description ?? '');
  const [price, setPrice] = useState(String(product?.price ?? ''));
  const [originalPrice, setOriginal] = useState(
    product?.originalPrice != null ? String(product.originalPrice) : ''
  );
  const [category, setCategory] = useState(product?.category ?? 'wrestling');
  const [materialTier, setTier] = useState(product?.materialTier ?? 'hd-cnc-premium');
  const [collections, setCollections] = useState((product?.collections ?? []).join(', '));
  const [inStock, setInStock] = useState(product?.inStock ?? true);
  const [featured, setFeatured] = useState(product?.featured ?? false);
  const [shopVisible, setShopVisible] = useState(product?.visibility?.shop ?? true);
  const [images, setImages] = useState<EditableImage[]>(
    (product?.images ?? []).map((i) => ({ src: i.src, alt: i.alt }))
  );
  const [variants, setVariants] = useState<ProductVariant[]>(product?.variants ?? []);
  const [variantLabel, setVariantLabel] = useState(product?.variantLabel ?? '');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const priceNum = Number(price);
  const originalNum = originalPrice === '' ? null : Number(originalPrice);
  const preview = discountPercent(originalNum, priceNum);

  const save = async () => {
    setSaving(true);
    setError('');

    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: product?.slug,
          name,
          shortDescription,
          description,
          price: priceNum,
          originalPrice: originalNum,
          category,
          materialTier,
          collections: collections
            .split(',')
            .map((c) => c.trim())
            .filter(Boolean),
          inStock,
          featured,
          shopVisible,
          images,
          variants,
          variantLabel: variantLabel.trim() || DEFAULT_VARIANT_LABEL,
          specs: product?.specs ?? {},
          currency: product?.currency ?? 'USD',
        }),
      });

      const data = (await res.json().catch(() => ({}))) as { error?: string; slug?: string };

      if (res.ok) {
        router.push('/admin/products');
        router.refresh();
        return;
      }
      setError(data.error ?? 'Could not save.');
    } catch {
      setError('Could not reach the server.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
      className="flex flex-col gap-8"
    >
      <section className="rounded-[--radius-plate] border border-line p-5">
        <div className="grid gap-4">
          <div>
            <label htmlFor="p-name" className={label}>
              Belt name
            </label>
            <input
              id="p-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={field}
              placeholder="Winged Eagle Style Championship Belt"
            />
            <p className="mt-1.5 text-2xs text-muted">
              Avoid trademarked names. Keep searchable words like “championship belt”.
            </p>
          </div>

          <div>
            <label htmlFor="p-short" className={label}>
              Short description
            </label>
            <textarea
              id="p-short"
              rows={2}
              value={shortDescription}
              onChange={(e) => setShort(e.target.value)}
              className={field}
            />
          </div>

          <div>
            <label htmlFor="p-desc" className={label}>
              Full description
            </label>
            <textarea
              id="p-desc"
              rows={6}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={field}
            />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="rounded-[--radius-plate] border border-line p-5">
        <h2 className="mb-4 font-body text-sm font-semibold uppercase tracking-wide text-ink">
          Pricing
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="p-price" className={label}>
              Selling price (charged)
            </label>
            <input
              id="p-price"
              type="number"
              min={0}
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className={field}
            />
          </div>
          <div>
            <label htmlFor="p-original" className={label}>
              Compare-at price (optional)
            </label>
            <input
              id="p-original"
              type="number"
              min={0}
              step="0.01"
              value={originalPrice}
              onChange={(e) => setOriginal(e.target.value)}
              className={field}
              placeholder="Leave blank for no discount"
            />
          </div>
        </div>

        <div className="mt-4 rounded-[--radius-plate] border border-line px-4 py-3">
          <span className="font-body text-2xs uppercase tracking-[0.16em] text-subtle">
            Customer sees
          </span>
          <p className="mt-1.5 flex items-baseline gap-2.5">
            {preview !== null && originalNum !== null && (
              <span className="text-sm text-subtle line-through">{formatPrice(originalNum)}</span>
            )}
            <span className="font-display text-2xl text-plated">
              {Number.isFinite(priceNum) ? formatPrice(priceNum) : '—'}
            </span>
            {preview !== null && (
              <span className="rounded-[--radius-plate] bg-primary px-2 py-0.5 font-body text-2xs font-bold uppercase text-on-primary">
                {preview}% off
              </span>
            )}
          </p>
          <p className="mt-2 text-2xs leading-relaxed text-muted">
            Only set a compare-at price the belt genuinely sold at. A “was” price you never
            charged is a false discount claim.
          </p>
        </div>

        <p className="mt-4 text-2xs leading-relaxed text-muted">
          {variants.length > 0
            ? 'Used only where no build is selected — the build prices below are what customers are charged.'
            : 'This belt sells at one price. Add builds below to price each plate thickness separately.'}
        </p>
      </section>

      {/* Builds */}
      <section className="rounded-[--radius-plate] border border-line p-5">
        <h2 className="font-body text-sm font-semibold uppercase tracking-wide text-ink">
          Builds &amp; prices
        </h2>
        <p className="mb-4 mt-1.5 text-2xs leading-relaxed text-muted">
          What the customer picks under “{variantLabel || 'Build'}” on the product page.
        </p>

        <div className="mb-5 max-w-xs">
          <label htmlFor="p-variant-label" className={label}>
            What are they choosing?
          </label>
          <input
            id="p-variant-label"
            value={variantLabel}
            onChange={(e) => setVariantLabel(e.target.value)}
            placeholder={DEFAULT_VARIANT_LABEL}
            className={field}
          />
        </div>

        <VariantEditor variants={variants} onChange={setVariants} />
      </section>

      {/* Images */}
      <section className="rounded-[--radius-plate] border border-line p-5">
        <ImageUploader
          slug={product?.slug ?? name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}
          images={images}
          onChange={setImages}
        />
      </section>

      {/* Organisation */}
      <section className="rounded-[--radius-plate] border border-line p-5">
        <h2 className="mb-4 font-body text-sm font-semibold uppercase tracking-wide text-ink">
          Organisation
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="p-cat" className={label}>
              Category
            </label>
            <select
              id="p-cat"
              value={category}
              onChange={(e) => setCategory(e.target.value as Product['category'])}
              className={field}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="p-tier" className={label}>
              Material tier
            </label>
            <select
              id="p-tier"
              value={materialTier}
              onChange={(e) => setTier(e.target.value as Product['materialTier'])}
              className={field}
            >
              {TIERS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="p-collections" className={label}>
              Collections (comma separated)
            </label>
            <input
              id="p-collections"
              value={collections}
              onChange={(e) => setCollections(e.target.value)}
              className={field}
              placeholder="wrestling, replica-style, 24k-gold"
            />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-5">
          {[
            { id: 'stock', on: inStock, set: setInStock, text: 'In stock' },
            { id: 'featured', on: featured, set: setFeatured, text: 'Featured' },
            { id: 'visible', on: shopVisible, set: setShopVisible, text: 'Visible in shop' },
          ].map((t) => (
            <label key={t.id} className="flex cursor-pointer items-center gap-2.5 text-sm text-ink">
              <input
                type="checkbox"
                checked={t.on}
                onChange={() => t.set(!t.on)}
                className="h-4 w-4 accent-[--color-primary]"
              />
              {t.text}
            </label>
          ))}
        </div>
      </section>

      {error && (
        <p role="alert" className="text-sm text-link">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-[--radius-plate] bg-primary px-7 py-3.5 font-display text-sm uppercase tracking-wide text-on-primary transition-colors hover:bg-primary-hover disabled:opacity-40"
        >
          {saving ? 'Saving…' : isNew ? 'Create belt' : 'Save changes'}
        </button>
        <Link
          href="/admin/products"
          className="font-body text-2xs font-semibold uppercase tracking-[0.14em] text-subtle hover:text-link"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
