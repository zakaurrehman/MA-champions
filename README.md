# M.A Champions Belts

Production storefront for M.A Champions Belts — custom championship belts and
replica title belts, made in-house.

**Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · React 19**

---

## Getting started

```bash
npm install
npm run dev          # http://localhost:3000
```

| Script | What it does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Production build (also generates sitemap + robots) |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run blur` | Regenerate blur placeholders for product images |

---

## Project status

All six build phases are complete:

| Phase | What it covers |
| --- | --- |
| 1 | Foundation, design tokens, header/footer, homepage |
| 2 | Collection filtering, product pages, gallery zoom + lightbox |
| 3 | The Belt Builder (`/build`) — six-step visual configurator |
| 4 | Pricing table, FAQs, about, contact, reviews, MDX blog, policies |
| 5 | Cart drawer, wishlist, fuzzy search, recently viewed, toasts |
| 6 | SEO, JSON-LD, sitemap, OG images, error pages, a11y + responsive QA |

Plus a light/dark theme redesign with an oxblood-led palette.

**The site is not launch-ready** — not because of missing code, but because of
missing business facts. See [TODO-BEFORE-LAUNCH.md](TODO-BEFORE-LAUNCH.md).
The single most urgent item is `site.url` in `lib/site.ts`, which is still a
placeholder domain and currently feeds every canonical URL and the sitemap.

Before this site can take real orders, see **[TODO-BEFORE-LAUNCH.md](TODO-BEFORE-LAUNCH.md)** —
it lists every business fact, price and asset that is still missing. Nothing in
the codebase invents these; each one degrades to a safe fallback until supplied.

Image gaps and trademark decisions are tracked in
**[PLACEHOLDER-IMAGES.md](PLACEHOLDER-IMAGES.md)**.

---

## Adding a product

Products live in `data/products.json`. Add an object to the `products` array:

```jsonc
{
  "id": "ma-004",
  "name": "Winged Eagle Style Championship Belt",
  "slug": "winged-eagle-style-championship-belt",
  "category": "wrestling",
  "collections": ["wrestling", "24k-gold"],
  "materialTier": "24k-gold",
  "price": 299,
  "salePrice": null,
  "currency": "USD",
  "inStock": true,
  "featured": true,
  "rating": null,          // null until real reviews exist — never fake this
  "reviewCount": 0,
  "shortDescription": "...",
  "description": "...",
  "specs": { "plateMaterial": "...", "plateThickness": "4mm", "plating": "...",
             "leatherType": "...", "leatherColour": "Black", "plateCount": 5,
             "weight": "...", "size": "...", "stones": "None" },
  "images": [
    { "src": "/products/winged-eagle-01-hero.jpg", "alt": "Real description of the photo",
      "width": 1600, "height": 1000 }
  ],
  "visibility": { "shop": true, "customGallery": false }
}
```

Then:

1. Drop the images in `public/products/` using **kebab-case** filenames.
2. Run `npm run blur` — this writes a `blurDataURL` into each image entry.
   Skip it and the product ships without a blur placeholder.
3. Write **real** `alt` text. It is not optional and it is not decorative.

### Pricing: compare-at and discounts

Two fields drive every price on the site:

```jsonc
"price": 450,            // charged to the customer (legacy field, still works)
"salePrice": null,       // if set, overrides `price`
"originalPrice": 520,    // compare-at only — NEVER charged
```

The frontend computes the discount itself — **never hardcode a percentage**:

```
((520 - 450) / 520) * 100  →  13% OFF
```

`originalPrice` is `null` on every product today, so nothing shows a
struck-through price. **Only set it to a price the belt genuinely sold at.**
Inventing a higher "was" price to manufacture a discount is a false discount
claim and is unlawful under UK CPRs, the US FTC Act and the EU UCPD. The code
will happily display whatever you enter — the restraint has to come from you.

### Pricing: variants (4mm / 6mm / 8mm …)

Add a `variants` array and the product page grows a picker. Each variant
carries its own pricing and overrides the product price completely:

```jsonc
"variantLabel": "Plate thickness",
"variants": [
  { "id": "4mm",  "name": "4mm",  "originalPrice": 520,  "salePrice": 450, "stock": null, "inStock": true },
  { "id": "6mm",  "name": "6mm",  "originalPrice": 600,  "salePrice": 500, "stock": 3,    "inStock": true },
  { "id": "8mm",  "name": "8mm",  "originalPrice": null, "salePrice": 550, "stock": 0,    "inStock": false }
]
```

- Selecting a variant updates the price, the compare-at price and the discount
  badge instantly, with no reload.
- The selected variant is stored on the cart line and shown in the cart.
- `stock: null` means not inventory-tracked; a number caps the quantity picker.
- A product with variants **cannot** be added to the cart without one — see
  `authoritativeLineTotal()` in `lib/pricing.ts`.

Products with no `variants` key keep working exactly as before.

Run `npm run test:pricing` after changing anything here. It covers variant
resolution, discount maths, backward compatibility and price tampering.

### Processing, shipping and warranty

Global defaults live in `lib/site.ts` and apply to every product:

```ts
fulfilment: { processingTime: '7–8 days', shippingTime: '4–5 business days after dispatch' }
warranty:   { available: true, duration: null, replacement: true, exchange: true, description: '…' }
```

Change them once there and every product page updates. A single product can
override either with its own `fulfilment` or `warranty` block, but almost none
should need to.

### The `visibility` flag

`visibility.shop` controls whether a product is publicly purchasable. A product
with `shop: false` never reaches a collection grid, search, the sitemap or a
product route — `lib/products.ts` filters it out at the boundary.

All three current products are `shop: false` because their photography shows
live third-party trademarks. They appear only in the `/custom` gallery.

---

## Swapping placeholder images

No competitor images are used anywhere. If one is ever added as a temporary
stand-in, it **must** be logged in `PLACEHOLDER-IMAGES.md` with the product
name, URL, and `REPLACE BEFORE LAUNCH`.

To replace any image:

1. Put the new file in `public/products/`.
2. Update the `src`, `width`, `height` and `alt` in `data/products.json`.
3. Run `npm run blur`.
4. Delete the row from `PLACEHOLDER-IMAGES.md`.

For the homepage hero, set `HERO_IMAGE` in `components/home/Hero.tsx` — it
switches from the typographic plinth to a photographic one automatically.

---

## Architecture

```
app/               Routes (App Router)
components/
  layout/          Header, footer, nav, announcement bar
  home/            Homepage sections
  product/         Product card
  ui/              Shared primitives
lib/
  products.ts      ← data access boundary
  tiers.ts         Material tiers + sport collections
  reviews.ts       Reviews (empty by design)
  blog.ts          Blog (MDX in Phase 4)
  site.ts          Business facts — nulls until confirmed
  types.ts         Domain types
data/              JSON source of truth
scripts/           Build-time tooling
```

### Swapping the data source

Components never import `data/*.json`. They call `lib/products.ts`, whose
functions are all `async` despite reading a local file — deliberately, so
moving to Shopify Storefront or Sanity touches only the function bodies:

1. Replace `loadProducts()` with your fetch or query.
2. Map the response onto the `Product` type in `lib/types.ts`.
3. Leave every exported signature unchanged.

No component, page or call site changes.

### SEO and structured data

All JSON-LD is built in `lib/seo.ts` and rendered through
`components/seo/JsonLd.tsx` — never inline in a page. That keeps every field
defined once, so the markup cannot drift from the visible page (drift is what
gets rich results suppressed).

Emitted: `Organization` and `WebSite` site-wide, plus `BreadcrumbList` on
product, collection, blog and FAQ pages, `Product` on product pages, `FAQPage`
on `/faqs`, and `BlogPosting` on posts.

`aggregateRating` is emitted **only** when a product has real reviews. Never
change this to a default value — Google issues manual actions for ratings that
do not match visible content, and fabricated reviews are unlawful in the US,
UK and EU.

Social share images are generated at build time by `app/opengraph-image.tsx`
using `next/og`. Note that Satori (which renders them) is not a browser: SVG
`<text>` is unsupported, and any glyph outside the bundled font triggers a
network font fetch that fails the build. Keep to plain HTML elements and
common characters.

### Design tokens

Six palette tokens in `app/globals.css`, grounded in belt materials: a warm
near-black base, a **three-stop gold ramp** (plating shifts across its face
rather than sitting flat), oxblood, nickel and bone. Type pairs **Anton**
(condensed display) with **Archivo** (grotesk body). Motion is minimal and
fully disabled under `prefers-reduced-motion`.

---

## Deploying to Vercel

1. Push to GitHub.
2. Import the repo at [vercel.com/new](https://vercel.com/new). Vercel detects
   Next.js automatically — no build config needed.
3. Set the environment variable:

   | Variable | Value |
   | --- | --- |
   | `SITE_URL` | Your production URL, e.g. `https://machampionsbelts.com` |

   This feeds canonical URLs, the sitemap and robots.txt. It must also match
   `site.url` in `lib/site.ts`.
4. Deploy. Add your custom domain under **Settings → Domains**.

Every push to `main` deploys to production; pull requests get preview URLs.
