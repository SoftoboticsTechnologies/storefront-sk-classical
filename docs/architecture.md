# Storefront architecture

The storefront is source-distributed: developers own and may change every human-authored file. Its organization exists to give humans and agents useful locality, not to make parts of the storefront untouchable.

## Source ownership

```text
src/
  app/          Next.js route wiring only
  config/       Store-wide values shared by features and site composition
  features/     Vertical commerce capabilities
  platform/     Cross-cutting Next.js, i18n, revalidation, and Vendure mechanics
  site/         Store-specific composition, navigation, and branding
  components/ui Generic design primitives
```

Feature modules colocate their GraphQL operations, actions, views, messages, and route implementations. The `app/` tree delegates to those route implementations so filesystem routing is not also the primary implementation hotspot.

Dependencies point toward shared configuration and platform mechanics: site modules may compose features, but features must not import from `site/`. ESLint and architecture tests enforce both alias and relative-import boundaries.

## Feature interfaces

A feature's top-level files are its external interface. Its `components/` and `routes/` directories are implementation details. Another feature or site module must not import those internal directories directly; ESLint enforces this rule. Code inside a feature may use its own internals.

Prefer a narrow top-level module such as `features/account/customer.ts` over a catch-all barrel. This keeps server/client boundaries explicit and avoids pulling unrelated exports into bundles.

## GraphQL ownership

Human-authored GraphQL operations live with the feature that owns their behavior. The transport and generated schema types live under `platform/vendure`. Downstream custom fields belong in the relevant feature operation; `src/graphql-env.d.ts` remains generated output and should be regenerated against the downstream Shop API schema.

## Translations

Translations live with their feature or site module. Each owner exposes one top-level locale registration, and `site/i18n/messages.ts` composes those registrations while rejecting duplicate namespaces. Adding a feature touches one composition entry; adding a locale stays local to each owner and the routing configuration.

## Route types

Feature route implementations use Next.js-generated `PageProps` and `LayoutProps` with their concrete filesystem route. This keeps route parameters checked against the `app/` tree even though the thin files under `app/` delegate their implementations to features.

## Routes (`src/app/[locale]/`)

`page.tsx` (home), `product/[slug]/[[...variant]]` (optional catch-all segment is a variant SKU — see Rendering strategy below), `collection/[slug]`, `search`, `cart`, `checkout`, `order-confirmation/[code]`, `account` (+ `addresses`, `orders`, `orders/[code]`, `profile`, `verify-email`), `sign-in`, `register`, `forgot-password`, `reset-password`, `verify`, `verify-pending`, `not-found`, plus `app/api/revalidate/route.ts`. Every major route pairs with a `loading.tsx` skeleton — preserve this when adding routes.

## Rendering strategy

Server Components by default; Server Actions (`'use server'`, colocated as `routes/actions.ts`) for all Vendure mutations; Client Components only where interaction requires it (variant selectors, carousels, checkout step state, Stripe Elements). Read-heavy data (channel, collections) uses `'use cache'` with `cacheTag`/`cacheLife`. See `docs/commerce.md` for the Vendure/GraphQL specifics and `docs/ui-system.md` for the design-system state.

**This section is stale for the current build** — `next.config.ts` now sets `output: 'export'` (full static export, no Node/server runtime; see `docs/decisions.md`). There are no Server Actions, no `cookies()`/`headers()` reads, and no middleware anywhere in `src/` — cart/checkout/auth/currency were re-architected to run client-side against Vendure directly. `product/[slug]` and `collection/[slug]` define `generateStaticParams` enumerating every slug in the catalog (backed by `features/products/data.ts#getPopularProductSlugs` and `features/collections/data.ts#getTopCollections`) since static export has no on-demand fallback for a slug that wasn't prerendered — there is no ISR, `cacheComponents`, or `partialPrefetching`. Product price/stock and the collection product grid are baked in from real build-time Vendure data (channel default currency, no filters) for SEO, then superseded by a live client fetch — see `docs/decisions.md` (2026-09-03 entries), `product-price-client.tsx`, `product-info.tsx`, `collection-results.tsx`. `product/[slug]` is actually `product/[slug]/[[...variant]]` (an optional catch-all, the segment being a variant's SKU) — `features/products/data.ts#getProductVariantParams` enumerates one static page per non-default variant so each has its own genuine price baked into its own HTML, since a client-side-only variant selector can never appear in a static page's source (see `docs/decisions.md`). No reactive component may call `next/navigation`'s `useSearchParams()` directly — see `features/search/search-params-sync.tsx` and the same decisions entry. The rest of this document (Server Actions, `'use cache'`/`cacheTag`/`cacheLife`, `app/api/revalidate/route.ts`) describes a pre-static-export architecture and needs a fuller re-audit.
