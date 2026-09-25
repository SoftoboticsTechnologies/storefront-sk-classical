import type {Metadata} from "next";
import {Suspense} from "react";
import {getRouteLocale} from "@/platform/i18n/server";
import {HeroSection} from "@/site/home/hero-section";
import {CategoryDiscovery} from "@/site/home/category-discovery";
import {BrandStory} from "@/site/home/brand-story";
import {ShopByCategory} from "@/site/home/shop-by-category";
import {BenefitsSection} from "@/site/home/benefits-section";
import {CtaBanner} from "@/site/home/cta-banner";
import {FeaturedProducts, TrendingProducts} from '@/features/products/featured-products';
import {ProductShowcase} from '@/features/products/product-showcase';
import {SectionHeading} from "@/site/home/section-heading";
import {DEALS_COLLECTION_SLUG} from "@/site/brand";
import {getRootCollections} from '@/features/collections/data';
import {SITE_NAME, SITE_URL, buildCanonicalUrl} from "@/config/metadata";
import {getTranslations} from 'next-intl/server';
import {toOgLocale} from '@/platform/i18n/locale-utils';

export async function generateMetadata(): Promise<Metadata> {
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'Home'});
    const ogLocale = toOgLocale(locale);

    return {
        title: {
            absolute: `${SITE_NAME} - ${t('pageTitle')}`,
        },
        description: t('description'),
        alternates: {
            canonical: buildCanonicalUrl("/"),
        },
        openGraph: {
            title: `${SITE_NAME} - ${t('pageTitle')}`,
            description: t('ogDescription'),
            type: "website",
            locale: ogLocale,
            url: SITE_URL,
        },
    };
}

export default async function Home() {
    const locale = await getRouteLocale();
    // Product rails need a real slug; grouping-only parents may have an empty
    // one, so fall back to their first child collection.
    const productSlugs = (await getRootCollections(locale))
        .map((collection) => collection.slug || collection.children?.find((child) => child.slug)?.slug)
        .filter((slug): slug is string => Boolean(slug));
    const [primary, secondary] = productSlugs;
    const t = await getTranslations({locale, namespace: 'Home'});

    return (
        <div className="min-h-screen mt-16">
            <HeroSection/>

            <BenefitsSection/>

            <CategoryDiscovery/>

            <Suspense>
                <ProductShowcase
                    collectionSlug={DEALS_COLLECTION_SLUG}
                    heading={<SectionHeading eyebrow={t('deals.eyebrow')} title={t('deals.title')}/>}
                />
            </Suspense>

            {primary && (
                <Suspense>
                    <FeaturedProducts collectionSlug={primary}/>
                </Suspense>
            )}

            <BrandStory/>

            {secondary && (
                <Suspense>
                    <TrendingProducts collectionSlug={secondary}/>
                </Suspense>
            )}

            <ShopByCategory/>

            <CtaBanner/>
        </div>
    );
}
