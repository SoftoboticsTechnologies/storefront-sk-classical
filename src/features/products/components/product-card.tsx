import Image from 'next/image';
import {FragmentOf, readFragment} from '@/platform/vendure/graphql';
import {ProductCardFragment} from '@/features/products/graphql';
import {ProductCardPrice} from '@/features/products/product-price-client';
import { Link } from '@/platform/i18n/navigation';
import {useTranslations} from 'next-intl';
import {ArrowRight, Diamond} from 'lucide-react';

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
}

/** Card markup shared by search-result cards and other product lists (e.g. New Arrivals). */
export function ProductCardView({slug, name, imageUrl, initialPrice, preload}: ProductCardViewProps) {
    const t = useTranslations('Product');

    return (
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
            className="group relative flex h-full flex-col rounded-2xl border border-gold/25 bg-card p-1.5 sm:p-2 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-gold/60 hover:shadow-[0_22px_40px_-24px_rgb(74_15_22/0.55)]"
        >
            {/* Temple-arch image frame with an inset gold hairline. */}
            <div className="relative aspect-4/5 overflow-hidden rounded-t-[999px] rounded-b-xl bg-secondary ring-1 ring-gold/30">
                {imageUrl ? (
                    <Image
                        src={imageUrl}
                        alt={name}
                        fill
                        preload={preload}
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
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
                <span className="mt-auto pt-2 inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground transition-colors group-hover:text-primary">
                    {t('viewDetails')}
                    <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                </span>
            </div>
        </Link>
    );
}
