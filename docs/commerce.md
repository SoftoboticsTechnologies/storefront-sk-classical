# Commerce knowledge base

Vendure integration map for `apps/storefront/src`. Treat everything here as protected (see `CLAUDE.md`). If this file conflicts with source, trust source and correct this file.

## Platform / transport — `src/platform/vendure/`
- `api.ts` — server-only fetch transport (`query`/`mutate`); never called from Client Components directly.
- `auth-token.ts` — cookie-based auth token (get/set/remove).
- `channel.ts` / `channel-graphql.ts` — `GetActiveChannelQuery`, cached (`'use cache'` + `cacheLife('hours')`).
- `graphql.ts` — gql.tada init, custom scalars (DateTime/JSON/Money).
- Config is env-driven: `VENDURE_SHOP_API_URL`, `VENDURE_CHANNEL_TOKEN`, cookie names, with sane fallbacks.
- **Gotcha**: `graphql.config.yml` and the gql.tada `tsconfig.json` schema pointer are the *codegen introspection source*, separate from the runtime API URL. If they drift from the local server (as happened once with a demo-server URL), generated types silently miss new mutations. Verify both point at the intended server when adding a new Vendure mutation.

## Cart — `src/features/cart/`
- `graphql.ts`: `GetActiveOrderQuery`, `AddToCartMutation`, `RemoveFromCartMutation`, `AdjustCartItemMutation`, `ApplyPromotionCodeMutation`, `RemovePromotionCodeMutation`.
- Reads: Server Component page fetch. Writes: Server Actions in `routes/actions.ts`, revalidated via `next/cache` `updateTag('cart')`.
- **Gotcha**: `withCartModificationRetry` in `actions.ts` catches `ORDER_MODIFICATION_ERROR` by transitioning the order back to `AddingItems` and retrying (Vendure locks the order during checkout). Same pattern duplicated in `features/products/add-to-cart.ts`. Preserve this — it's a deliberate workaround, not dead code.
- ActiveOrder is the only cart source of truth. No local/second cart state.

## Checkout — `src/features/checkout/`
- `graphql.ts`: `GetActiveOrderForCheckoutQuery`, `GetEligibleShippingMethodsQuery`, `GetEligiblePaymentMethodsQuery`, `GetAvailableCountriesQuery`, `SetOrderShippingAddressMutation`, `SetOrderBillingAddressMutation`, `SetOrderShippingMethodMutation`, `TransitionOrderToStateMutation`, `AddPaymentToOrderMutation`, `CreateStripePaymentIntentMutation`, `SetCustomerForOrderMutation`.
- Flow: contact → shipping-address → delivery → payment → review, driven by Server Actions in `routes/actions.ts`; `checkout-provider.tsx` holds client-side step state.
- Stripe: `stripe-client.ts` (client `loadStripe` singleton), `routes/steps/stripe-payment-form.tsx` (Client Component, Stripe Elements, `confirmPayment`, client-side redirect to `/order-confirmation/[code]`).
- **Gotcha (critical, do not "simplify")**: Stripe payment settles **asynchronously via webhook** (admin context). `placeOrder`/`addPaymentToOrder` is *not* called for Stripe — only `createStripePaymentIntentAction` creates the intent. `createStripePaymentIntentAction` checks `retrievePaymentIntent` status against terminal statuses (succeeded/canceled) before remounting Elements, to avoid re-using a dead intent.
- **Gotcha**: `transitionToArrangingPayment` treats a no-op `fromState===toState==='ArrangingPayment'` transition error as success, not failure.

## Products — `src/features/products/`
- `graphql.ts`: `ProductCardFragment` (on `SearchResult`), `GetProductDetailQuery` (variants, optionGroups, collections).
- PDP data fetched server-side; `add-to-cart.ts` is a Server Action; variant selection UI state (`product-options.ts`) is client-only, but the selected variant's ID/price/stock/SKU/image always come from server-fetched data — never invented client-side.

## Collections / Search — `src/features/collections/`, `src/features/search/`
- `collections/graphql.ts`: `GetTopCollectionsQuery`, `GetCollectionProductsQuery`; `collections/data.ts` caches with `'use cache'`/`cacheLife('days')`/`cacheTag`.
- `search/graphql.ts`: `SearchProductsQuery`; `search/search-helpers.ts`: `buildSearchInput`.
- **Facet semantics (confirmed correct as of 2026-08-31)**: URL encodes `facets=<facetId>:<facetValueId>`, grouped by facetId into `facetValueFilters: [{or: [...ids]}]` — **OR within a facet group, AND across groups**. Do not regress this to flat AND-only matching.
- **Gotcha**: `GetTopCollectionsQuery` hardcodes `parentId: {eq: "1"}` for the root collection — fragile if seed data changes.

## Pricing / Currency — `src/features/pricing/`, `src/features/currency/`
- `pricing/price.tsx` (Client Component, `Intl.NumberFormat`) — **has a silent `currencyCode = 'USD'` default prop**; audit all call sites pass an explicit `order.currencyCode` / variant currency.
- `currency/currency-server.ts`: `getActiveCurrencyCode` validates the `vendure-currency` cookie against `channel.availableCurrencyCodes`, falling back to `channel.defaultCurrencyCode`. This is what prevents stale USD leaking after a channel is reconfigured to INR-only (fixed 2026-08-29, see `docs/decisions.md`). Safe under `'use cache: private'`, **not** safe under public `'use cache'`.

## Auth / Account — `src/features/authentication/`, `src/features/account/`
- Mutations: `LoginMutation`, `LogoutMutation`, `RegisterCustomerAccountMutation`, `VerifyCustomerAccountMutation`, `RequestPasswordResetMutation`, `ResetPasswordMutation`, plus customer/address/email mutations in `account/graphql.ts`.
- All Server Actions (`'use server'`). Reads via `getActiveCustomer` (React `cache()`-wrapped), token from cookie.

## Orders — `src/features/orders/`
- `routes/order-confirmation.tsx` + `routes/payment-processing-banner.tsx`.
- **Gotcha (documented in code)**: anonymous `orderByCode` access is only granted once `orderPlacedAt` is set (post-webhook). `fetchOrderByCode` swallows the resulting auth error as "still processing" and shows `PaymentProcessingBanner` rather than failing. Tightly coupled to webhook timing — don't "fix" the error handling without understanding this.

## Protected file list (do not change behavior, only presentation)
`src/platform/vendure/**`, all `graphql.ts` files under `src/features/*`, all `routes/actions.ts` Server Actions, `src/features/currency/currency-server.ts`, `src/features/search/search-helpers.ts`, `src/features/checkout/routes/steps/stripe-payment-form.tsx`, `src/features/orders/routes/order-confirmation.tsx`.
