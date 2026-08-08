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

**SUPERSEDED 2026-08-06 — all three are now LIVE in the shop.**

The original 2026-08-05 decision was "custom gallery only". The client reversed it after
confirming the competitor (zeesbelts.com) sells the equivalent AEW CNC belt publicly at
$999.99. All three now carry `visibility.shop: true`: they have product pages, appear in
collections, search, the featured rail and the sitemap.

All 14 catalogue products carry a third-party promotion mark cast into the metal
and visible in the photography. Product **names** are descriptive throughout — no
trademarked terms appear in any title, slug, meta description or heading.

| Product | Files | Visible mark |
| --- | --- | --- |
| Continental Crown Championship Belt | 8 | AEW |
| Stacked Gold Heavyweight Championship Belt | 10 | TNA |
| Stone-Set World Championship Belt | 6 | AEW + JHT |
| Winged Eagle Style Championship Belt | 11 | WWF |
| Big Gold Platinum Heavyweight Championship Belt | 10 | WWE |
| Big Gold Deep-Engraved Heavyweight Belt | 13 | WWE |
| Modern Continental Heavyweight Championship Belt | 10 | WWE |
| Oval Continental Championship Belt | 7 | WWF |
| Cruiserweight Champion Style Belt | 10 | WWE |
| World Television Gold Championship Belt | 7 | WCW |
| Television Champion Silver Championship Belt | 12 | WCW + TBS |
| World Tag Team Silver Championship Belt | 10 | WWF |
| Extreme Silver Chrome Championship Belt | 7 | ECW |
| National Eagle Championship Belt | 19 | AEW |

### Two products additionally show a real person's name — HIGHER RISK

This is a **publicity/personality right**, which is separate from trademark and
is not covered by the decision above. Using a performer's name to sell
merchandise is the exact thing those rights exist to stop.

| Product | Where | Action |
| --- | --- | --- |
| Cruiserweight Champion Style Belt | Nameplate reads a named performer | **Reshoot with a blank nameplate.** The plate is engravable, so this is a photography fix, not a manufacturing one. |
| Modern Continental Heavyweight Championship Belt | One side plate carries a named performer with their slogan | Reshoot with the standard side plate — the listing already says side plates can be standard or custom. |

Both are live in the shop. Neither name appears in any product title or text we
wrote; the exposure is in the photograph only.

The risk has not gone away, it has been accepted. Product **names** remain descriptive
(no trademarked names in titles, URLs or meta descriptions), so the exposure is limited to
what is cast into the metal in the photographs.

To reverse at any time: set `visibility.shop` to `false` in `data/products.json`. One flag
per product removes it from every shop surface — no other code changes.

---

## 2b. A 12th belt is photographed but NOT listed — needs a price

The folder you sent named **"Internal storage"** was not a duplicate. It holds 11
photographs of a belt none of the labelled folders cover:

> **A World Tag Team style belt on blue leather** — gold plates, blue enamel
> globe, continent-map side plates. Genuinely distinct from the silver chrome
> tag team belt, and the only blue-strap belt in the whole set.

It is **not in the shop**, because the folder name carried no price and I will
not invent one. Everything else is ready: photos are in
`source-photos/Internal storage/`.

**Send me a price and it goes live in one pass.** Suggested name: *World Tag
Team Blue Championship Belt*.

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
