'use client';

import {useEffect, useState} from 'react';
import {useParams} from 'next/navigation';
import {useTranslations} from 'next-intl';
import {Heart} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Link} from '@/platform/i18n/navigation';
import {query} from '@/platform/vendure/client-api';
import {getActiveCurrencyCode} from '@/features/currency/currency-client';
import {GetProductDetailQuery} from '@/features/products/graphql';
import {ProductCardView} from '@/features/products/product-card';
import {pruneWishlist, useWishlist} from '@/features/wishlist/wishlist-store';
import {WishlistCartButton} from '@/features/wishlist/wishlist-cart-button';

interface WishlistProduct {
    id: string;
    slug: string;
    name: string;
    imageUrl?: string;
    price?: {min: number; max: number; currencyCode: string};
    variants: Array<{id: string; stockLevel: string}>;
}

function GridSkeleton({count}: {count: number}) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {Array.from({length: Math.max(count, 1)}).map((_, i) => (
                <div key={i} className="bg-card rounded-2xl border border-gold/25 p-1.5 sm:p-2">
                    <div className="aspect-4/5 rounded-t-[999px] rounded-b-xl bg-muted animate-pulse" />
                    <div className="flex flex-col items-center p-3 sm:p-4 space-y-2">
                        <div className="h-5 bg-muted animate-pulse rounded w-3/4" />
                        <div className="h-6 bg-muted animate-pulse rounded w-1/2" />
                    </div>
                </div>
            ))}
        </div>
    );
}

/**
 * Saved products, fetched live from Vendure by slug in the viewer's currency.
 * Slugs Vendure no longer resolves are dropped from storage.
 */
export function WishlistItems() {
    const t = useTranslations('Wishlist');
    const {locale} = useParams<{locale: string}>();
    const slugs = useWishlist();
    const [products, setProducts] = useState<Record<string, WishlistProduct | null>>({});

    useEffect(() => {
        const toFetch = slugs.filter((slug) => !(slug in products));
        if (toFetch.length === 0) return;
        let cancelled = false;

        (async () => {
            const currencyCode = await getActiveCurrencyCode();
            const results = await Promise.all(toFetch.map(async (slug) => {
                try {
                    const {data} = await query(GetProductDetailQuery, {slug}, {languageCode: locale, currencyCode});
                    const product = data.product;
                    if (!product) return [slug, null] as const;
                    const prices = product.variants.map((variant) => variant.priceWithTax);
                    return [slug, {
                        id: product.id,
                        slug,
                        name: product.name,
                        imageUrl: product.assets[0]?.preview,
                        price: prices.length > 0
                            ? {min: Math.min(...prices), max: Math.max(...prices), currencyCode}
                            : undefined,
                        variants: product.variants.map((variant) => ({id: variant.id, stockLevel: variant.stockLevel})),
                    }] as const;
                } catch {
                    // Network error: leave it unresolved (not pruned) so it retries next visit.
                    return [slug, undefined] as const;
                }
            }));
            if (cancelled) return;
            setProducts((prev) => {
                const next = {...prev};
                for (const [slug, product] of results) {
                    if (product !== undefined) next[slug] = product;
                }
                return next;
            });
            pruneWishlist(results.filter(([, product]) => product === null).map(([slug]) => slug));
        })();

        return () => {
            cancelled = true;
        };
        // `products` only gates which slugs still need fetching.
    }, [slugs, locale]);

    if (slugs.length === 0) {
        return (
            <div className="py-16 text-center">
                <Heart className="mx-auto mb-4 size-10 text-gold" strokeWidth={1.5} />
                <h2 className="font-serif text-2xl font-semibold mb-2">{t('empty')}</h2>
                <p className="text-muted-foreground mb-8">{t('emptyMessage')}</p>
                <Button render={<Link href="/search" />} nativeButton={false}>{t('continueShopping')}</Button>
            </div>
        );
    }

    const loaded = slugs.map((slug) => products[slug]).filter((product): product is WishlistProduct => !!product);
    const pending = slugs.filter((slug) => !(slug in products)).length;

    if (loaded.length === 0) {
        return <GridSkeleton count={pending} />;
    }

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {loaded.map((product) => (
                <ProductCardView
                    key={product.slug}
                    productId={product.id}
                    slug={product.slug}
                    name={product.name}
                    imageUrl={product.imageUrl}
                    initialPrice={product.price}
                    footer={<WishlistCartButton slug={product.slug} name={product.name} variants={product.variants} />}
                />
            ))}
        </div>
    );
}
