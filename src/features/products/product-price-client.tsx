'use client';

import {useEffect, useState} from 'react';
import {useTranslations} from 'next-intl';
import {query} from '@/platform/vendure/client-api';
import {getActiveCurrencyCode} from '@/features/currency/currency-client';
import {GetProductDetailQuery} from '@/features/products/graphql';
import {Price} from '@/features/pricing/price';

export interface LiveVariantPricing {
    id: string;
    priceWithTax: number;
    stockLevel: string;
}

interface LiveProductPricing {
    currencyCode: string;
    variants: LiveVariantPricing[];
}

/**
 * Fetches live price/stock for a product by slug directly from Vendure on
 * mount, using the active client-side currency, so pricing stays correct if
 * the viewer's currency differs from the one baked in at build time.
 *
 * `initialData` — the real priceWithTax/stockLevel already fetched
 * server-side at build (from the same Vendure API, just at build time) — is
 * returned immediately so the statically-exported HTML (and first paint)
 * always contains a real price for crawlers/SEO instead of only a
 * client-fetched-after-mount value. It's superseded by the live fetch once
 * that resolves (e.g. the viewer's currency differs from the build-time
 * default).
 *
 * When `buildCurrencyCode` is given and the viewer's resolved currency
 * matches it, the build-time data is already correct and the
 * `GetProductDetailQuery` re-fetch is skipped entirely — only the (cached,
 * shared) active-currency check runs. This is the common case (most viewers
 * browse in the channel's default currency), so it cuts a PDP's live
 * price-fetch traffic to zero for it (see docs/decisions.md, 2026-09-03).
 */
export function useLiveProductPricing(
    slug: string,
    initialData: LiveProductPricing | null = null,
    buildCurrencyCode?: string
): {data: LiveProductPricing | null; loading: boolean} {
    const [data, setData] = useState<LiveProductPricing | null>(initialData);
    const [loading, setLoading] = useState(!initialData);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                const currencyCode = await getActiveCurrencyCode();
                if (cancelled) return;

                if (buildCurrencyCode && currencyCode === buildCurrencyCode && initialData) {
                    // Build-time price is already in the viewer's currency —
                    // nothing to re-fetch.
                    return;
                }

                const result = await query(GetProductDetailQuery, {slug}, {currencyCode});
                if (cancelled) return;

                const variants = result.data.product?.variants ?? [];
                setData({
                    currencyCode,
                    variants: variants.map((variant) => ({
                        id: variant.id,
                        priceWithTax: variant.priceWithTax,
                        stockLevel: variant.stockLevel,
                    })),
                });
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        })();

        return () => {
            cancelled = true;
        };
        // initialData/buildCurrencyCode are stable per mount for a given slug.
    }, [slug]);

    return {data, loading};
}

function PriceSkeleton({className}: {className?: string}) {
    return <span className={className ?? 'inline-block h-6 w-20 rounded bg-muted animate-pulse align-middle'} />;
}

interface ProductCardPriceProps {
    slug: string;
    /**
     * Real priceWithTax/currencyCode already fetched server-side at build
     * (from `ProductCardFragment` on the search result), used as the price
     * shown in the statically-exported HTML and first paint. Superseded by
     * a live fetch once it resolves, in case the viewer's currency differs.
     */
    initial?: {min: number; max: number; currencyCode: string};
}

/**
 * Price for a product card. Renders the build-time price immediately (real
 * server-fetched data, so it's present in the static HTML for SEO/crawlers)
 * and swaps to a live-fetched price once resolved, to stay correct for the
 * viewer's active currency.
 */
export function ProductCardPrice({slug, initial}: ProductCardPriceProps) {
    const t = useTranslations('Product');
    const initialData: LiveProductPricing | null = initial
        ? {
              currencyCode: initial.currencyCode,
              variants: [
                  {id: 'initial-min', priceWithTax: initial.min, stockLevel: 'IN_STOCK'},
                  {id: 'initial-max', priceWithTax: initial.max, stockLevel: 'IN_STOCK'},
              ],
          }
        : null;
    const {data, loading} = useLiveProductPricing(slug, initialData, initial?.currencyCode);

    if (loading || !data || data.variants.length === 0) {
        return <PriceSkeleton />;
    }

    const prices = data.variants.map((variant) => variant.priceWithTax);
    const min = Math.min(...prices);
    const max = Math.max(...prices);

    if (min !== max) {
        return (
            <>
                <span className="text-xs font-normal text-muted-foreground mr-1">{t('from')}</span>
                <Price value={min} currencyCode={data.currencyCode} />
            </>
        );
    }

    return <Price value={min} currencyCode={data.currencyCode} />;
}

export {PriceSkeleton};
