import {FragmentOf, readFragment} from '@/platform/vendure/graphql';
import {ProductCardFragment} from '@/features/products/graphql';
import {ProductCardPrice} from '@/features/products/product-price-client';
import {ProductCardGallery} from '@/features/products/components/product-card-gallery';
import { Link } from '@/platform/i18n/navigation';
import {useTranslations} from 'next-intl';
import type {ReactNode} from 'react';
import {ArrowRight, Diamond} from 'lucide-react';
import {WishlistButton} from '@/features/wishlist/wishlist-button';

interface ProductCardProps {
    product: FragmentOf<typeof ProductCardFragment>;
    preload?: boolean;
}

export function ProductCard({product: productProp, preload}: ProductCardProps) {
    const product = readFragment(ProductCardFragment, productProp);
    const priceWithTax = product.priceWithTax;
    const initialPrice = priceWithTax
        ? priceWithTax.__typename === 'PriceRange'
            ? {min: priceWithTax.min, max: priceWithTax.max, currencyCode: product.currencyCode}
            : {min: priceWithTax.value, max: priceWithTax.value, currencyCode: product.currencyCode}
        : undefined;

    return (
        <ProductCardView
            slug={product.slug}
            name={product.productName}
            imageUrl={product.productAsset?.preview}
            initialPrice={initialPrice}
            preload={preload}
        />
    );
}

interface ProductCardViewProps {
    slug: string;
    name: string;
    imageUrl?: string;
    initialPrice?: {min: number; max: number; currencyCode: string};
    preload?: boolean;
    /**
     * Replaces the "View details" cue with an action (e.g. the wishlist's Add to
     * Cart). Rendered as a sibling of the tile link, overlaid at the card bottom.
     */
    footer?: ReactNode;
}

/** Card markup shared by search-result cards and other product lists (e.g. New Arrivals). */
export function ProductCardView({slug, name, imageUrl, initialPrice, preload, footer}: ProductCardViewProps) {
    const t = useTranslations('Product');

    return (
        // Wrapper so the wishlist button is a sibling of the tile link, not nested in it.
        <div className="group/card relative h-full">
            <Link
                href={`/product/${slug}`}
                // Next.js 16's default Link prefetch (client segment cache) requests
                // RSC payload paths that don't match what static export writes to
                // disk for this route family — a confirmed upstream bug affecting
                // the optional catch-all `[[...variant]]` product route
                // (vercel/next.js#85374, #92341). It's cosmetic (404 network noise,
                // App Router falls back to a full navigation), but disabling
                // prefetch here avoids it outright. Revisit once Next ships a fix.
                prefetch={false}
                className={`group relative flex h-full flex-col rounded-2xl border border-gold/25 bg-card p-1.5 sm:p-2 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-gold/60 hover:shadow-[0_22px_40px_-24px_rgb(74_15_22/0.55)] ${footer ? 'pb-14 sm:pb-16' : ''}`}
            >
                {/* Temple-arch frame (semicircular top) with an inset gold hairline. The photo
                    is never cropped: it's contained in a square box 86% of the frame width,
                    sitting 4% above the bottom. In a 4:5 frame (width 1) that box's top corners
                    are √(0.43² + 0.15²) ≈ 0.455 from the arch centre vs the 0.5 radius, so any
                    photo shape stays inside the curve and the hairline. Keep these numbers (and
                    the small hover scale) in sync if the frame changes. */}
                <div className="relative aspect-4/5 overflow-hidden rounded-t-[999px] rounded-b-xl bg-white ring-1 ring-gold/30">
                    {imageUrl ? (
                        <ProductCardGallery
                            slug={slug}
                            name={name}
                            imageUrl={imageUrl}
                            preload={preload}
                            sizes="(max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs sm:text-sm text-muted-foreground">
                            {t('noImage')}
                        </div>
                    )}
                    <span
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-1.5 sm:inset-2 rounded-t-[999px] rounded-b-lg border border-gold/45 transition-colors duration-300 group-hover:border-gold"
                    />
                </div>
                <div className="flex flex-1 flex-col items-center px-1.5 pt-3 pb-2 sm:px-3 sm:pt-4 sm:pb-3 text-center">
                    <h3 className="font-serif text-base sm:text-lg font-semibold leading-snug line-clamp-2 transition-colors group-hover:text-primary">
                        {name}
                    </h3>
                    <div className="ornament-divider w-full max-w-28 my-2" aria-hidden="true">
                        <Diamond className="size-2 fill-current" />
                    </div>
                    <p className="text-base sm:text-lg font-semibold tracking-tight text-primary">
                        <ProductCardPrice slug={slug} initial={initialPrice} />
                    </p>
                    {!footer && (
                        <span className="mt-auto pt-2 inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground transition-colors group-hover:text-primary">
                            {t('viewDetails')}
                            <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                        </span>
                    )}
                </div>
            </Link>
            {/* Top-right corner sits outside the arch curve, so it never covers the photo. */}
            <WishlistButton slug={slug} className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10 transition-transform duration-300 group-hover/card:-translate-y-1" />
            {footer && (
                <div className="absolute inset-x-2.5 bottom-2.5 sm:inset-x-4 sm:bottom-4 z-10 transition-transform duration-300 group-hover/card:-translate-y-1">
                    {footer}
                </div>
            )}
        </div>
    );
}
