'use client';

// Static export has no Next.js Data Cache to `updateTag()` against, so cart
// mutations broadcast this browser event instead. Components that render
// ActiveOrder-derived data (cart page, navbar cart icon) listen for it and
// refetch GetActiveOrderQuery to stay in sync. Mirrors the
// AUTH_TOKEN_CHANGED_EVENT pattern in platform/vendure/auth-token.ts.
export const CART_CHANGED_EVENT = 'vendure-cart-changed';

export function dispatchCartChanged() {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent(CART_CHANGED_EVENT));
}
