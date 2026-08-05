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

## 2e. Belt Builder economics — `lib/builder.ts`

The running total **does** move: base price per plate material comes from the
real tier floors ($119.99 brass → $429.99 CNC). What is still zero:

| Modifier | Question |
| --- | --- |
| `BUILD_MODIFIERS.plateCount` | What do 3 and 5 plates add over a single centre plate? |
| `BUILD_MODIFIERS.size` | Adult 4mm vs 2mm; are Kids/Mini cheaper? |
| `BUILD_MODIFIERS.engraving` | Flat fee, or free? |
| `BUILD_MODIFIERS.artwork` | Is there a setup/origination fee for custom artwork? |

Set them, flip `BUILD_MODIFIERS.confirmed` to `true`, and the "Indicative only"
note disappears by itself.

## 2f. Quote delivery — `lib/quote.ts`

**Uploaded artwork does not travel with the quote.** A `mailto:` link cannot
carry an attachment, so the builder tells the customer to attach the file
themselves. This is a real limitation, not a placeholder.

The fix is a small API route (`app/api/quote/route.ts`) that accepts the spec
plus the file and sends it server-side via Resend, SendGrid or Nodemailer.
`submitQuote()` is already shaped for it — the builder will not need changes.
Until then, quotes still arrive; only the file needs a manual attach.

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

## 4b. FAQ answers awaiting real figures — `data/faqs.json`

Four answers are written to be true *without* a figure, and are flagged
`needsConfirmation: true`. They are published and they are honest, but they are
weaker than they need to be. Rewrite them with real numbers once you have them:

| FAQ | What it currently says | What it should say |
| --- | --- | --- |
| `lead-time` | "confirmed in writing on your quote" | "Typically X–Y working days" |
| `rush` | "tell us the date and we'll confirm" | Your actual rush capability |
| `payment` | "arranged directly, no card payments on site" | Accurate once checkout exists |
| `returns` | "see refund policy" | Your actual returns window |

**These answers are also emitted as FAQPage structured data to Google.** Do not
put anything in this file you cannot honour.

## 4c. Policy pages — still deliberately empty

`/policies/privacy`, `/refund`, `/shipping` and `/terms` render an honest
"being prepared" page rather than placeholder legal text. This is intentional:
a published refund window is contractually binding the moment it goes live, and
boilerplate copied from another site is both unenforceable and a liability.

These need your real terms (or a solicitor's) before launch. Everything else on
the site links to them correctly already.

---

## 4d. Newsletter signups are NOT being stored

Both the homepage newsletter form and the exit-intent modal show a success
message but **no email address is saved anywhere**. There is no mailing-list
provider connected and no database.

This is currently harmless (nothing is lost that was ever promised storage),
but it becomes a real problem the moment you drive traffic: people will think
they have subscribed. Either connect a provider (Mailchimp, Klaviyo, Resend
Audiences, Buttondown) or remove both forms before launch.

Files: `components/home/Newsletter.tsx`, `components/ui/ExitIntentModal.tsx`.

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
