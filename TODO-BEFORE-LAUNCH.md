# TODO BEFORE LAUNCH

Every item here is a real fact or asset we do not hold. Nothing has been guessed —
each one renders as a safe fallback until you fill it in.

---

## 1. Business facts — `lib/site.ts`

You confirmed you have these. Send the values and I'll wire them in one pass.

| Field | Used by | Currently renders as |
| --- | --- | --- |
| `whatsapp` | Checkout handoff, float button, "Buy on WhatsApp", footer | Contact-page link instead |
| `email` | Footer, contact, order enquiries, quote submissions | Contact-page link instead |
| `phone` | Contact page, Organization JSON-LD | Omitted |
| `address.*` | `/contact`, `/about`, embedded map, JSON-LD | Address block omitted entirely |
| `foundedYear` | "X years in business" on `/about` | Omitted |
| `leadTimes.stockBuildDays` | Product pages, FAQs, announcement bar | Message omitted from rotation |
| `leadTimes.customBuildDays` | `/build`, `/custom`, FAQs | Message omitted from rotation |
| `leadTimes.shippingDays` | Shipping policy, product pages | Omitted |
| `social.*` | Footer social row | Row omitted |
| `url` | Canonicals, sitemap, OG tags | **Placeholder domain in use** — `machampionsbelts.com` |

> `url` also appears in `next-sitemap.config.js`. Change both together, or set `SITE_URL`.

---

## 2. Pricing — `data/tiers.json`

All six tiers are `confirmed: false`. While any is false, the homepage prints
"Indicative starting prices — final pricing is confirmed on your quote."

| Tier | Draft floor | Competitor | Basis |
| --- | --- | --- | --- |
| Brass | $119.99 | $139.99 | 14% under |
| Boxing | $129.99 | $149.99 | 13% under |
| Zinc | $219.99 | $249.99 | 12% under |
| 24K Gold | $224.99 | $249.99 | 10% under |
| HD & CNC Premium | $429.99 | $699.99 | **Anchored to your real $430 belt**, not the undercut rule |
| Fully Custom | $159.99 | $179.99 | 11% under |

Also confirm: is **$430** a list price or already discounted? And is
"**$450 with shipping**" specific to that belt, or your standard terms?

---

## 2b. Marketing claims — `lib/site.ts` → `claims`

Each is `null` and stays off the site entirely until you confirm it. Say yes and
it appears in the announcement bar, hero and custom process automatically.

| Claim | Question |
| --- | --- |
| `freeDigitalProof` | Do you send a design proof for approval before production? Is it free? |
| `responseTime` | Typical first reply to an enquiry — "one working day"? |
| `trackedShipping` | Is shipping tracked to **all** destinations, or only some? |
| `packaging` | How is the belt packed? (e.g. "a fitted box") |

---

## 2c. Variant upcharges — `data/variants.json`

The live-price mechanism on product pages is **built and working** — it is
currently adding zero, because no upcharges have been supplied. Until they are,
the product page prints "Options shown do not change this price yet."

| Group | What's needed |
| --- | --- |
| Plate material | What does each of brass / zinc / 24k gold / CNC add to the base? |
| Size | Adult 2mm vs 4mm vs Kids vs Mini — Kids/Mini may be negative |
| Leather colour | Do any colours cost more than black? |
| Engraving | Flat fee for nameplate engraving, or free? |

Set each `priceModifier`, flip that group's `confirmed` to `true`, and the
note disappears automatically.

## 2d. Size guide — `components/product/SizeGuideModal.tsx`

The measurement diagram and how-to-measure copy are done. The **strap length
column renders "TBC"** — send the actual length for each of Adult, Kids and
Mini.

---

## 3. Product data — `data/products.json`

Per product, still marked `TODO:` in the file:

- Plate base metal — brass or zinc core on the CNC builds
- Finished weight
- Strap length and available sizes
- Sale prices (all three are `salePrice: null` — the source doc had none)

---

## 4. Assets

- **Logo** — the lion crest was shared in chat but no file is in the repo.
  Drop it at `public/brand/logo.svg`, then swap the lockup in
  `components/layout/Logo.tsx`. Header currently uses a typographic lockup.
- **Hero photograph** — see `HERO_IMAGE` in `components/home/Hero.tsx`. Set it and
  the hero switches from the typographic plinth to a photographic one.
- **All other image gaps** — listed in `PLACEHOLDER-IMAGES.md`.

Run `npm run blur` after adding any product image, or it ships without its
blur placeholder.

---

## 5. Content that must not be invented

These are deliberately empty and will stay empty until real content exists:

- **`data/reviews.json`** — no reviews. The homepage reviews section and
  `/reviews` render nothing rather than show fabricated testimonials.
  Fake reviews are unlawful under the FTC Act §5, the UK DMCC Act 2024 and the
  EU UCPD. Read the warning in the file before adding entries.
- **Blog posts** — none. Blog surfaces render nothing.
- **Policy pages** — privacy, refund, shipping and terms hold no legal copy. A
  published refund window is contractually binding, so these need your real terms.
- **Payment icons** — the footer claims no payment methods, because v1 has no
  payment integration. Do not add card logos until checkout accepts cards.

---

## 6. Trademark decision (recorded)

The three supplied belts are **custom-gallery only** — `visibility.shop: false`.
They appear on `/custom` as commissioned work and are excluded from collections,
search, product routes and the sitemap. Promoting any into the shop requires
generic-plate reshoots. See `PLACEHOLDER-IMAGES.md`.
