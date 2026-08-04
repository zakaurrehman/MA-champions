# PLACEHOLDER & AT-RISK IMAGES

Anything listed here **must be resolved before launch**. Nothing on this list ships silently.

Status as of Step 0 (2026-08-05).

---

## 1. Competitor-sourced placeholders

**Currently in use: NONE.**

No competitor image URLs have been used anywhere in this project. All 24 product images
currently in `public/products/` came from your own `images with prices.docx`.

If a competitor URL is ever used as a temporary stand-in, it gets a row here in this format:

| Product | Placeholder URL | Status |
| --- | --- | --- |
| _(none yet)_ | — | — |

---

## 2. Your own images — trademark risk (ACTION NEEDED)

These are **your photos**, not placeholders — but the physical belts carry live third-party
promotion logos that are visible in every shot. Renaming the product does not remove the mark
from the photograph.

**DECIDED 2026-08-05 — option 3: custom gallery only, never the shop.**

All three carry `visibility.shop: false` and `visibility.customGallery: true` in
`data/products.json`. They appear on `/custom` as examples of work we've built. They are
**not** purchasable catalogue items, do not appear in collections or search, and get no
product page. `lib/products.ts` must filter on `visibility.shop` for every shop-facing query.

| Product | Files | Visible mark | Status |
| --- | --- | --- | --- |
| Continental Crown Championship Belt | `continental-crown-championship-belt-*` (8 files) | AEW wordmark on centre + all side plates | Custom gallery only |
| Stacked Gold Heavyweight Championship Belt | `stacked-gold-heavyweight-championship-belt-*` (10 files) | TNA wordmark on centre + side plates | Custom gallery only |
| Stone-Set World Championship Belt | `stone-set-world-championship-belt-*` (6 files) | AEW wordmark + JHT roundel on centre + side plates | Custom gallery only |

To promote any of these into the shop later, you need generic-plate reshoots — then flip
`visibility.shop` to `true` and swap the image paths.

---

## 3. Image gaps — no asset exists yet

These are needed for the pages in the brief and **have no image at all** in your .docx.
None of them are filled with a placeholder yet.

| Where | What's needed | Count |
| --- | --- | --- |
| Homepage hero | One belt lit against black, landscape, high-res | 1 |
| Shop by material tier cards | Brass / Boxing / Zinc / 24K Gold / HD & CNC / Fully Custom | 6 |
| Shop by league grid | NFL / NBA / NHL / MLB / Wrestling / Boxing / MMA / Fantasy | 8 |
| Custom work showcase | Real custom belts you've built | 3–4 |
| Reviews section | Customer photos (optional) | — |
| Blog teasers | Post cover images | 3 |
| Product pages | Size-guide measurement diagram | 1 |
| Belt Builder (`/build`) | Layered silhouette / leather / plate-finish assets | ~20 |
| SEO | OG share image, favicon set | 2 |

Your logo (`M.A Champions Belts` lion crest) was supplied in chat but is **not yet in the repo** —
send the original file and it goes in `public/brand/`.

---

## Photography note

All 24 supplied photos are shot outdoors on red plastic matting, in daylight, with visible
background clutter (brick wall, grass, bottles, a hand in one frame). They are sharp and
well-focused — the etching detail reads clearly, which is what the product page zoom needs —
but the setting fights the "display case under a spotlight" direction in the brief.

Recommend reshooting on black or charcoal seamless with a single raking light. Until then the
site will use them with a dark vignette treatment to reduce the background.
