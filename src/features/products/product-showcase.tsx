import {getRouteLocale} from "@/platform/i18n/server";
import {getActiveCurrencyCode} from '@/features/currency/currency-server';
import {query} from "@/platform/vendure/api";
import {SearchProductsQuery} from '@/features/search/graphql';
import {Link} from '@/platform/i18n/navigation';
import {ArrowRight} from "lucide-react";
import {getTranslations} from 'next-intl/server';
import {readFragment} from '@/platform/vendure/graphql';
import {ProductCardFragment} from '@/features/products/graphql';
import {ProductCard} from '@/features/products/components/product-card';
import {cn} from '@/lib/utils';

/**
 * Build-time product list for homepage grids: every product, or one
 * collection's products when `collectionSlug` is given. A failed query (e.g.
 * the collection doesn't exist yet) yields an empty list so the section
 * simply hides instead of breaking the static build.
 */
async function getShowcaseProducts(take: number, collectionSlug?: string) {
    const locale = await getRouteLocale();
    const currencyCode = await getActiveCurrencyCode();

    try {
        const result = await query(SearchProductsQuery, {
            input: {take, skip: 0, groupByProduct: true, ...(collectionSlug ? {collectionSlug} : {})},
        }, {languageCode: locale, currencyCode});
        return result.data.search.items;
    } catch (error) {
        console.error(`[product-showcase] Failed to load products${collectionSlug ? ` for collection "${collectionSlug}"` : ''}:`, error);
        return [];
    }
}

interface ProductShowcaseProps {
    /** Section heading, rendered by the caller (keeps site styling out of the feature). */
    heading?: React.ReactNode;
    /**
     * Intro panel shown beside a 2-up product grid (stacked above it on
     * phones, sticky while the grid scrolls from `md`). It owns the section's
     * call to action, so the "View all" button is omitted.
     */
    aside?: React.ReactNode;
    /**
     * Full-bleed decoration rendered at the very top / bottom of the section.
     * The vertical padding then moves inside them, so pass a `className`
     * without `py-*`.
     */
    leading?: React.ReactNode;
    trailing?: React.ReactNode;
    collectionSlug?: string;
    take?: number;
    /** "View all" target; defaults to the collection page, or /search for all products. */
    viewAllHref?: string;
    className?: string;
}

/** Product grid section for the homepage. Renders nothing when there are no products. */
export async function ProductShowcase({heading, aside, leading, trailing, collectionSlug, take = 8, viewAllHref, className}: ProductShowcaseProps) {
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'Product'});
    const products = await getShowcaseProducts(take, collectionSlug);

    if (products.length === 0) {
        return null;
    }

    const href = viewAllHref ?? (collectionSlug ? `/collection/${collectionSlug}` : '/search');

    const cards = products.map((product) => (
        <ProductCard key={readFragment(ProductCardFragment, product).productId} product={product}/>
    ));

    return (
        <section className={className ?? "py-16 md:py-20"}>
            {leading}
            <div className={cn("container mx-auto px-4", (leading || trailing) && "py-14 md:py-20")}>
                {heading}
                {aside ? (
                    <div className="grid gap-6 md:grid-cols-2 lg:gap-10 items-start">
                        <div className="md:sticky md:top-24">{aside}</div>
                        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
                            {cards}
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                            {cards}
                        </div>
                        <div className="mt-10 flex justify-center">
                            <Link
                                href={href}
                                className="group inline-flex items-center gap-1.5 rounded-full border border-gold/60 px-6 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-gold/10"
                            >
                                {t('viewAllProducts')}
                                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5"/>
                            </Link>
                        </div>
                    </>
                )}
            </div>
            {trailing}
        </section>
    );
}
