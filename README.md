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
| `npm run migrate` | Create database tables and seed products from JSON |
| `npm run test:pricing` | 28 assertions on variant pricing, discounts and tampering |

---

## What this is

A storefront **plus a back office**. The shop is statically rendered for speed;
products, orders, reviews and customers live in Postgres, and the owner manages
everything from `/admin` without touching code.

| Area | Where |
| --- | --- |
| Storefront | 17 belts, four build options each, cart, wishlist, fuzzy search |
| Belt Builder | `/build` — six-step visual configurator, live price, quote submission |
| Payments | Crypto (live) · PayPal (needs credentials) · WhatsApp handoff |
| Orders | Captured before every handoff, statuses, courier tracking |
| Customer accounts | Google sign-in, order history. Checkout never requires one |
| Admin | `/admin` — dashboard, products, orders, reviews |
| Content | Pricing table, FAQs, about, MDX blog, policy pages |

### Services it depends on

| Service | Env var | Without it |
| --- | --- | --- |
| Neon Postgres | `DATABASE_URL` | Falls back to the JSON seed; admin is read-only |
| Vercel Blob | `BLOB_READ_WRITE_TOKEN` | Image upload disabled, everything else works |
| Customer accounts | `AUTH_SECRET` | Sign-in hidden; guest checkout unaffected |
| Google sign-in | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Email and password sign-in still works |
| PayPal | `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET` | Card checkout hidden |
| Resend | `RESEND_API_KEY`, `EMAIL_FROM` | Reset links are created but not emailed — issue them from `/admin/settings` |
| Admin access | `ADMIN_USERNAME`, `ADMIN_PASSWORD` (min 12 chars) | `/admin` stays closed |

**Every one degrades to a working site rather than an error.** That is
deliberate: a missing credential should never take the shop down.

---

## Admin panel

Sign in at `/admin` with `ADMIN_USERNAME` and `ADMIN_PASSWORD`. The username
defaults to `admin`; `ADMIN_TOKEN` is still accepted as the password so older
deployments keep working.

The password is never stored in the cookie — the session is a signed token, so
changing `ADMIN_PASSWORD` immediately signs out every existing session.

- **Dashboard** — orders to action, crypto payments to verify, reviews to
  moderate, weekly figures.
- **Products** — create, edit, delete, upload photos, set prices with a live
  discount preview. Saving is blocked if an image has no alt text.
- **Orders** — every WhatsApp intent, crypto payment and build request.
  Statuses, courier tracking, on-chain payment confirmation.
- **Reviews** — approve, reject, mark as verified buyer.
- **Settings** — change your own password; issue a reset link for a locked-out
  customer.

Changing the admin password from Settings stores it (hashed) in `admin_auth`,
which then takes precedence over the environment. **Delete `ADMIN_PASSWORD` and
`ADMIN_TOKEN` from the host afterwards** — until you do, the old password still
works as a fallback for when the database is unreachable.

Product changes revalidate the storefront immediately (see `lib/revalidate.ts`).
Without that call a statically rendered page keeps serving its build-time
snapshot — including a deleted belt.

### First-time setup

1. Set `DATABASE_URL` and `ADMIN_PASSWORD` in the host, then redeploy.
2. Go to `/admin/products` and press **Import belts**. That creates the tables
   and seeds from `data/products.json`.

`npm run migrate` does the same locally.

---

## Project status

Live at **https://www.mawrestlingbelts.com**. `site.url` in `lib/site.ts` and
`siteUrl` in `next-sitemap.config.js` both read `SITE_URL` first and fall back
to that domain — they feed every canonical URL, the sitemap and structured
data, so they must always match the domain actually served.

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

`originalPrice` is currently set on every product at roughly 13–14% above the
sale price. **Only keep it at a price the belts are genuinely offered at.**
Inventing a higher "was" price to manufacture a discount is a false discount
claim and is unlawful under UK CPRs, the US FTC Act and the EU UCPD. The code
will happily display whatever you enter — the restraint has to come from you.

### Pricing: the build ladder

Every belt is sold in four builds. This is the live ladder, applied to all
products (`meta.buildLadder` in `data/products.json`):

| Build | Price | Compare-at |
| --- | --- | --- |
| 2mm Brass | $170 | $195 |
| 4mm Standard | $270 | $310 |
| 4mm CNC | $400 | $460 |
| 6mm CNC | $470 | $545 |

```jsonc
"variantLabel": "Build",
"variants": [
  { "id": "2mm-brass",    "name": "2mm Brass",    "originalPrice": 195, "salePrice": 170, "stock": null, "inStock": true },
  { "id": "4mm-standard", "name": "4mm Standard", "originalPrice": 310, "salePrice": 270, "stock": null, "inStock": true },
  { "id": "4mm-cnc",      "name": "4mm CNC",      "originalPrice": 460, "salePrice": 400, "stock": null, "inStock": true },
  { "id": "6mm-cnc",      "name": "6mm CNC",      "originalPrice": 545, "salePrice": 470, "stock": null, "inStock": true, "isDefault": true }
]
```

`isDefault` marks the build shown in that product's photographs, so the
headline price matches the picture. Without it the cheapest option leads and
every belt appears to be $170.

**Plate material and thickness belong here and nowhere else.** They used to
also exist as unpriced options in `data/variants.json`, which put two
thickness controls on the page — one of which silently did not change the
price. `data/variants.json` is now finishing options only: strap size, leather
colour, engraving.

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

All 17 current products are `shop: false`-free — they are live and purchasable
by client decision, despite their photography showing third-party marks. See
[PLACEHOLDER-IMAGES.md](PLACEHOLDER-IMAGES.md) for what that means and how to
reverse it (one flag per product).

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

## Reviews database (Neon Postgres)

Reviews are the only part of the site backed by a database. Everything else is
static JSON.

**Setup, once:**

1. Copy `.env.example` to `.env.local` and paste your `DATABASE_URL` from the
   Vercel Storage tab (the `.env.local` quickstart snippet).
2. Create the table:
   ```bash
   node --env-file=.env.local scripts/migrate.mjs
   ```
   Safe to re-run — it drops nothing.
3. Add the same `DATABASE_URL` to your Vercel project's environment variables.

**Moderation.** Submitted reviews are stored as `pending` and are invisible on
the site until approved. The form is public with no login, so auto-publishing
would be an open door for spam and fake ratings.

```sql
-- see what is waiting
SELECT id, product_slug, author_name, rating, title, body, created_at
FROM reviews WHERE status = 'pending' ORDER BY created_at DESC;

-- publish one
UPDATE reviews SET status = 'approved', updated_at = NOW() WHERE id = 1;

-- mark it as a confirmed purchase (shows a "Verified buyer" badge)
UPDATE reviews SET verified = TRUE WHERE id = 1;

-- reject
UPDATE reviews SET status = 'rejected', updated_at = NOW() WHERE id = 1;
```

Approved reviews appear within 5 minutes — product pages use
`revalidate = 300`. Ratings and counts recompute automatically.

**Abuse controls** in `app/api/reviews/route.ts`: the product slug must match a
real shop-visible product; one review per submitter per product; three per
submitter per 24h. The submitter key is a SHA-256 hash of IP + user agent — the
raw address is never stored.

**Without `DATABASE_URL`** the site still builds. Reads fall back to the JSON
seed and the form hands off to WhatsApp rather than discarding what was typed.

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
   | `SITE_URL` | Your production URL, e.g. `https://www.mawrestlingbelts.com` |

   This feeds canonical URLs, the sitemap and robots.txt. It must also match
   `site.url` in `lib/site.ts`.
4. Deploy. Add your custom domain under **Settings → Domains**.

Every push to `main` deploys to production; pull requests get preview URLs.
