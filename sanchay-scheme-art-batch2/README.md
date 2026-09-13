# SANCHAY Scheme Art (Batch 2 — Claude-generated)

Original, copyright-free flat-icon illustrations for scheme cards, matching
SANCHAY's existing palette (cream background `#F6F1E7`, navy `#16213E`,
category accent colors). Generated for all **50 scheme_ids** currently in
`sanchay_master_schemes.json`.

## Contents

- `schemes/` — 50 SVGs named by scheme_id (`apy_001.svg`, `ppf_001.svg`, …)
  plus `_fallback.svg` for any scheme_id not found in the map.
- `scheme_images.paths.json` — maps `scheme_id -> "/schemes/<id>.svg"`
- `scheme_images.inline.json` — maps `scheme_id -> data:image/svg+xml;base64,...`
  (self-contained, use this if static asset serving isn't set up)

## Design system

- **Background:** radial cream gradient + faint dot-grid texture (5–11% opacity)
- **Category accent circle:** two soft concentric circles (10%/16% opacity)
  in the category's accent color, positioned top-right of the card
- **Icon:** a single original line-art icon per category (rupee-sun for
  Pension, piggy bank for Savings, umbrella for Insurance, cross for Health,
  graduation cap for Education, wheat sheaf for Agriculture, house for
  Housing, briefcase for Business, gear+person for Employment, shield-check
  for Social Security, feminine silhouette for Women, two children for Child
  Welfare, bank card for Financial Inclusion, accessibility figure for
  Disability, walking-cane figure for Senior Citizen)
- **Per-scheme variation:** small deterministic offset/rotation (seeded from
  `scheme_id`'s hash) so same-category cards aren't pixel-identical
- **Bottom scrim:** navy linear gradient, 0% opacity at 55% height → 62%
  opacity at bottom, so overlaid text ("VERIFIED SOURCE", benefit amount,
  scheme name) stays readable — matches the existing card overlay pattern

## Integration (same pattern as the Batch 1 art drop)

1. Move `schemes/` into the project's static/public directory so files load
   at `/schemes/<scheme_id>.svg`. Adjust the leading path in
   `scheme_images.paths.json` if the actual static route differs (e.g.
   `/static/schemes/`).
2. In the scheme card component, look up the image by `scheme.scheme_id`
   against `scheme_images.paths.json` (or `scheme_images.inline.json` if
   static serving isn't configured), falling back to `_fallback.svg`/
   `_fallback` when an id is missing from the map.
3. Do not change any other card markup, layout, or colors — this package
   only supplies the image source.
4. Merge this map with the Batch 1 (`sanchay-scheme-art/`) 19-scheme map —
   there should be no `scheme_id` collisions since Batch 1 and Batch 2 cover
   different schemes. If a `scheme_id` exists in both, prefer the Batch 1
   (hand-crafted) illustration.

## Coverage note

This batch covers all 50 scheme_ids currently in the Claude-side
`sanchay_master_schemes.json` (Pension, Savings, Insurance, Health,
Education, Agriculture, Housing, Business, Employment, Social Security,
Women, Financial Inclusion, Disability, Senior Citizen categories). If your
live site's dataset has scheme_ids beyond these 50 (e.g. the 183-scheme
version), send the additional scheme_id ↔ category ↔ name list and a next
batch can be generated to match.
