import type {Metadata} from 'next';
import {getTranslations} from 'next-intl/server';
import {Link} from '@/platform/i18n/navigation';
import {query} from '@/platform/vendure/api';
import {getRouteLocale} from '@/platform/i18n/server';
import {getActiveCurrencyCode} from '@/features/currency/currency-server';
import {GetNewArrivalsQuery} from '@/features/products/graphql';
import {ProductCardView} from '@/features/products/components/product-card';
import {Button} from '@/components/ui/button';
import {PageBanner} from '@/components/ui/page-banner';
import {DEFAULT_CATEGORY_IMAGE} from '@/features/collections/utils';
import {SITE_NAME, buildCanonicalUrl} from '@/config/metadata';

const NEW_ARRIVALS_COUNT = 24;

export async function generateMetadata(): Promise<Metadata> {
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'Product'});

    return {
        title: t('newArrivals.title'),
        description: t('newArrivals.metaDescription', {siteName: SITE_NAME}),
        alternates: {canonical: buildCanonicalUrl(`/${locale}/new-arrivals`)},
    };
}

/**
 * Newest products by Vendure `createdAt`, baked in at build time like other
 * catalog pages; each card's price is refreshed live client-side
 * (`ProductCardPrice`).
 */
export default async function NewArrivalsPage() {
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'Product'});
    const currencyCode = await getActiveCurrencyCode();
    const result = await query(GetNewArrivalsQuery, {take: NEW_ARRIVALS_COUNT}, {languageCode: locale, currencyCode});
    // A product with no variants isn't in the search index, so it gets no
    // prerendered product page (see features/products/data.ts) — skip it to
    // avoid a card that links to a 404.
    const products = result.data.products.items.filter((product) => product.variants.length > 0);

    return (
        <div className="container mx-auto px-4 py-8 mt-16">
            <PageBanner
                className="mb-8"
                eyebrow={t('newArrivals.eyebrow')}
                title={t('newArrivals.title')}
                description={t('newArrivals.description')}
                image={DEFAULT_CATEGORY_IMAGE}
                ctaLabel={products.length > 0 ? t('newArrivals.cta') : undefined}
            />

            {products.length === 0 ? (
                <div className="text-center py-16 space-y-6">
                    <p className="text-muted-foreground">{t('newArrivals.empty')}</p>
                    <Button render={<Link href="/search" />} nativeButton={false}>
                        {t('viewAllProducts')}
                    </Button>
                </div>
            ) : (
                <div id="products" className="scroll-mt-24 grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                    {products.map((product, index) => {
                        const prices = product.variants.map((variant) => variant.priceWithTax);
                        const initialPrice = prices.length
                            ? {min: Math.min(...prices), max: Math.max(...prices), currencyCode: product.variants[0].currencyCode}
                            : undefined;
                        return (
                            <ProductCardView
                                key={product.id}
                                slug={product.slug}
                                name={product.name}
                                imageUrl={product.featuredAsset?.preview}
                                initialPrice={initialPrice}
                                preload={index < 4}
                            />
                        );
                    })}
                </div>
            )}
        </div>
    );
}
