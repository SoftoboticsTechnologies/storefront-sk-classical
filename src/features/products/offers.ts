'use client';

import type {TadaDocumentNode} from 'gql.tada';
import {parse} from 'graphql';
import {query} from '@/platform/vendure/client-api';

/**
 * A storefront-visible Vendure promotion, from the custom `publicPromotions`
 * Shop API query (Vendure plugin documented in docs/vendure-public-promotions.md).
 * Every amount here is real promotion configuration read from Vendure.
 */
export interface PublicPromotion {
    id: string;
    name: string;
    description: string;
    /** Set when the promotion needs a coupon code at checkout. */
    couponCode: string | null;
    /** Order-level percentage discount (`order_percentage_discount`), if that's the promotion's action. */
    percentDiscount: number | null;
    /** Minimum order amount (minor units) from a `minimum_order_amount` condition, if any. */
    minimumOrderAmount: number | null;
    endsAt: string | null;
}

// `publicPromotions` isn't part of the stock Shop API, so it's absent from the
// gql.tada schema snapshot (src/graphql-env.d.ts) and can't go through
// `graphql()`. Parsed by hand and typed explicitly instead; once the plugin is
// deployed and the schema re-introspected, this can move to graphql.ts.
const PublicPromotionsQuery = parse(`
    query PublicPromotions {
        publicPromotions {
            id
            name
            description
            couponCode
            percentDiscount
            minimumOrderAmount
            endsAt
        }
    }
`) as unknown as TadaDocumentNode<{publicPromotions: PublicPromotion[]}, Record<string, never>>;

// One request per language per page view, shared by every caller.
const cache = new Map<string, Promise<PublicPromotion[]>>();

/**
 * Storefront offers from Vendure. Resolves to `[]` when the Vendure server
 * doesn't have the `publicPromotions` query yet (or the request fails), so
 * offer UI simply stays hidden; nothing is ever invented client-side.
 */
export function loadPublicPromotions(languageCode: string): Promise<PublicPromotion[]> {
    let pending = cache.get(languageCode);
    if (!pending) {
        pending = query(PublicPromotionsQuery, {}, {languageCode})
            .then((result) => result.data.publicPromotions ?? [])
            .catch(() => []);
        cache.set(languageCode, pending);
    }
    return pending;
}

/**
 * Lowest price this item reaches with a single promotion, for "Get this as low
 * as". Only promotions whose discount is a plain order percentage and whose
 * minimum order (if any) this one item already meets are counted, so the price
 * shown is one a one-item order genuinely gets. `null` when no offer lowers it.
 */
export function getLowestOfferPrice(price: number, promotions: PublicPromotion[]): number | null {
    let lowest: number | null = null;
    for (const promotion of promotions) {
        const percent = promotion.percentDiscount;
        if (percent == null || percent <= 0 || percent > 100) continue;
        if (promotion.minimumOrderAmount != null && price < promotion.minimumOrderAmount) continue;
        const offerPrice = Math.round(price * (1 - percent / 100));
        if (lowest == null || offerPrice < lowest) lowest = offerPrice;
    }
    return lowest != null && lowest < price ? lowest : null;
}
