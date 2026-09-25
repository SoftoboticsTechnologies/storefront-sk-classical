# UI system

Current state of the design system in `apps/storefront` (audited 2026-08-31), plus target direction for the premium-ecommerce modernization. Update this file whenever a reusable UI convention is established — don't let pages invent divergent styles.

## Stack
- Tailwind v4 (CSS-based config, no `tailwind.config.js`). Tokens declared in `src/app/[locale]/globals.css` via `@theme inline` + `:root`/`.dark` (oklch color space).
- shadcn (`components.json`: style `base-vega`, baseColor `slate`, icons `lucide`), primitives in `src/components/ui/*`.

## Current tokens (as of audit — neutral, no brand color yet)
- Radius: `--radius: 0.625rem`, derived sm/md/lg/xl via calc offsets.
- Colors: full shadcn slate/blue-gray palette (background, foreground, primary, secondary, muted, accent, destructive, border, input, ring, card, popover, sidebar-*, chart-1..5) — light + dark, but **no distinct brand hue**.
- Fonts: `--font-sans` / `--font-mono` = Geist Sans/Mono only.
- Breakpoints: Tailwind v4 defaults, no overrides.
- Animation: one custom `fade-up` keyframe/utility. No other motion tokens.

## Brand theme (SK Classics, 2026-09-25)
Replaces the neutral slate palette in `globals.css` (same token names, so every shadcn primitive picks it up):
- Light: ivory `--background`, temple-maroon `--primary`, cream `--secondary`/`--muted`, pale-gold `--accent`. Dark: warm near-black ground with antique gold as `--primary`.
- New tokens: `--gold` / `--gold-foreground` → Tailwind `bg-gold`, `text-gold`, `border-gold/30`, etc. Use gold for ornament, borders and eyebrows, not body text on light backgrounds (contrast).
- Fonts: `--font-serif` = Cormorant Garamond (`next/font`, var `--font-cormorant`). `h1`/`h2` get it globally from the base layer; use `font-serif` explicitly on smaller display headings (`h3` card titles). Body/UI text stays Geist Sans.
- Idioms: uppercase `tracking-[0.2em]` eyebrows and nav labels; `.ornament-divider` (gold hairlines around a `Diamond` icon) under section titles via `site/home/section-heading.tsx`.
- Brand config lives in `src/site/brand.ts` (logo paths, contact details, category tile images) and `src/site/brand-logo.tsx` (theme-aware logo). Web-sized logos are `public/logo/sk-logo-{black,white}.webp` — the original PNGs are ~500 KB and images are served unoptimized.

## Target direction
Introduce a brand accent color (light + dark oklch pair) into the existing `@theme` block rather than a parallel token system. Keep radius/spacing scale as-is unless a specific component needs it — don't invent a second scale.

## Existing UI primitives (`src/components/ui/`)
Broad shadcn set already scaffolded: accordion, alert(-dialog), aspect-ratio, avatar, badge, breadcrumb, button(-group), calendar, card, carousel, chart, checkbox, collapsible, combobox, command, context-menu, country-select, dialog, direction, drawer, dropdown-menu, empty, field, form, hover-card, input(-group/-otp), item, kbd, label, menubar, native-select, navigation-menu, pagination, password-input, popover, progress, radio-group, resizable, scroll-area, select, separator, sheet, sidebar, skeleton, slider, sonner (toast), spinner, switch, table, tabs, textarea, toggle(-group), tooltip.

Custom additions: `page-banner.tsx` — maroon listing-page hero (eyebrow, serif title, description, "Browse products" anchor CTA to `#products`, themed photo fading in from the right; photo becomes a scrimmed background on mobile). Used by collection, search and new-arrivals pages. Collection imagery/copy comes from `features/collections/utils.ts` (`getCategoryGroup`/`getCategoryImage`, keyword-matched against slug/name; a Vendure `featuredAsset`/`description` always wins).

Reuse before adding new: `command.tsx` (unused — good candidate for a search overlay), `drawer.tsx`/`sheet.tsx` (mini-cart, mobile nav, filter drawer), `carousel.tsx` (PLP featured/related — PDP gallery currently bypasses this, see gap below).

Unused/likely-prunable for this storefront: `calendar`, `chart`, `sidebar`, `menubar`, `resizable`, `context-menu`, `kbd`, `table` — leave in place unless a task specifically needs cleanup; not a redesign blocker.

## Current navigation (`src/site/navigation/`)
**2026-09-25 menu:** `navbar-collections.tsx` renders HOME → SHOP (mega panel: one column per root collection with its children, plus All Products) → one dropdown per root collection → MORE (New Arrivals → `/new-arrivals`, All Products). `/new-arrivals` (`features/products/routes/new-arrivals/`) lists the 24 newest products via `GetNewArrivalsQuery` (product list sorted by `createdAt DESC`, since search has no date sort) using `ProductCardView`, the plain-props card body extracted from `product-card.tsx`. The desktop menu shows from `xl` (1280px); below that the mobile sheet is used. The search trigger is icon-only until `2xl`.

`navbar.tsx` + `navbar/{navbar-collections,mobile-nav,mobile-nav-wrapper,navbar-cart,cart-icon,navbar-user,login-button,currency-picker(-wrapper),language-picker,theme-switcher,navigation-link,navbar-link,search-input,search-overlay}.tsx`.

Mega-menu (shipped 2026-08-31): `GetTopCollectionsQuery` (`features/collections/graphql.ts`) fetches one level of `children`+`featuredAsset` per top-level collection. `navbar-collections.tsx` renders a `NavigationMenuTrigger`/`Content` dropdown (child links + thumbnail) for collections with children, falling back to the original plain link for leaf collections. `mobile-nav.tsx` mirrors this with an `Accordion` per collection with children (`ui/accordion.tsx`).

Search overlay (shipped 2026-08-31): `search-overlay.tsx` is a shared client component (`ui/command.tsx` inside `ui/dialog.tsx`) used by both desktop (`search-input.tsx`, now a trigger button) and mobile (`mobile-nav.tsx` search trigger — closes the sheet, then opens the overlay). Suggestions come from `features/search/suggest.ts`'s `getSearchSuggestions` server action, which reuses the existing `SearchProductsQuery` (`take: 6, groupByProduct: true`) — no new GraphQL operation. Debounced ~200ms via `useDeferredValue` + a `setTimeout`/`useTransition` pair. Enter with no suggestions falls through to `/search?q=`; selecting a suggestion navigates to `/product/[slug]`.

## Current homepage (`src/site/home/`)
**Superseded 2026-09-25 by the SK Classics redesign:** `AnnouncementBar` is the scrolling top brand bar (`max-w-6xl`, narrower than `container`: logo left, ivory pill search with a gold button in the centre, currency/account/cart right), rendered site-wide above the header in `locale-layout.tsx`. Only the menu row is pinned, with the menu centred, the mobile trigger on the left and icon-only search on the right: `navbar.tsx` is `sticky top-0 -mb-16` (the negative margin cancels its flow height, so pages keep their existing `mt-16` offset). Homepage: → `hero-section.tsx`/`hero-carousel.tsx` (autoplay banner carousel over `ui/carousel` using brand artwork in `public/images/banners`; each slide links to the first live collection matching its keywords, falling back to `/search`) → `benefits-section.tsx` (4-up promise strip) → `category-discovery.tsx` (root-collection image tiles) → `FeaturedProducts` → `brand-story.tsx` → `TrendingProducts` → `shop-by-category.tsx` (root collections with child chips) → `cta-banner.tsx`. `editorial-banner.tsx` was removed. Collection lists use `getRootCollections` (`features/collections/data.ts`), plus `getCollectionHref`/`formatCollectionName` from `features/collections/utils.ts`: `GetTopCollectionsQuery` returns every collection flat, and grouping-only parents can have an empty slug. The paragraph below describes the previous version.


Redesigned 2026-08-31 (products-as-hero, editorial/merchandising structure). `page.tsx` fetches `getTopCollections(locale)` once and derives a `primary`/`secondary` top-level collection pair, then composes: `AnnouncementBar` (site-wide, mounted in `locale-layout.tsx` above `Navbar`) → `hero-section.tsx` (visual two-column showcase using `primary`'s `featuredAsset`/`name`, no fabricated copy) → `category-discovery.tsx` (compact circular-thumbnail quick-nav strip, all top-level collections) → `features/products/featured-products.tsx`'s `FeaturedProducts({collectionSlug: primary})` → `editorial-banner.tsx` (full-bleed banner for `secondary`, `description` with i18n fallback) → `TrendingProducts({collectionSlug: secondary})` (same file, sibling export) → `shop-by-category.tsx` (larger grid incl. child-collection links) → `benefits-section.tsx` (restyle of prior inline "Why Shop With Us", same 3 real feature keys) → `cta-banner.tsx` (promotional CTA band → `/register`, no email form — no subscription backend exists). `EditorialBanner`/`TrendingProducts` render conditionally on `secondary` existing (avoids duplicating `primary`'s section when the shop only has one top-level collection). `GetTopCollectionsQuery` top-level items now also carry `featuredAsset`/`description` (children already had `featuredAsset`) — additive, non-breaking for `navbar-collections.tsx`/`mobile-nav.tsx`/`footer.tsx`. No fabricated "New"/date-sorted claim: "Trending Now" is sourced from a second real collection, not a fake recency sort (Vendure's `SearchResultSortParameter` has no date field).

## Current PDP/PLP presentation (`src/features/products/`)
`components/product-card.tsx` (PLP card), `product-carousel.tsx`, `product-image-carousel.tsx` (PDP gallery — bespoke prev/next, not using `ui/carousel`, no zoom), `product-info.tsx` (variant `RadioGroup` + add-to-cart + toast), `related-products.tsx`, `pagination.tsx`, `product-grid.tsx` (+ `product-grid-skeleton.tsx`), `featured-products.tsx`.

## Cart presentation (`src/features/cart/`)
`routes/{cart,cart-items,order-summary,promotion-code}.tsx`, `components/cart-skeleton.tsx`. No dedicated cart-drawer component in this feature dir — `navbar-cart.tsx`/`cart-icon.tsx` are the trigger; a slide-over mini-cart (using `ui/sheet`) is a gap, not yet built.

## Route structure (`src/app/[locale]/`)
`page.tsx` (home), `product/[slug]`, `collection/[slug]`, `search`, `cart`, `checkout`, `order-confirmation/[code]`, `account`(`/addresses`,`/orders`,`/orders/[code]`,`/profile`,`/verify-email`), `sign-in`, `register`, `forgot-password`, `reset-password`, `verify`, `verify-pending`, `not-found`. Every major route has a paired `loading.tsx` — preserve this pattern for any new route/section.

## Known gaps vs. premium-ecommerce target
1. No brand accent color — everything is neutral slate.
2. ~~No mega-menu / category dropdown in header.~~ Shipped 2026-08-31 — see "Current navigation" above.
3. ~~No search overlay (command palette primitive sits unused).~~ Shipped 2026-08-31 — see "Current navigation" above.
4. ~~Homepage is hero + one carousel — no promo/editorial/trust/newsletter blocks.~~ Shipped 2026-08-31 — see "Current homepage" above.
5. PDP gallery is bespoke, no zoom/lightbox; doesn't reuse `ui/carousel`.
6. No visible product badges (sale/new), no quick-add, no wishlist affordance.
7. No dedicated cart-drawer/mini-cart component.
8. Footer is one monolithic file, not decomposed.

These gaps are the actionable backlog for the redesign — implement incrementally per `CLAUDE.md` workflow, updating this file when a new reusable pattern (e.g. mega-menu, search overlay, cart drawer) lands.
