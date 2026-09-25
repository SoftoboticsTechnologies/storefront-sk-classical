import type {Metadata} from "next";
import {Suspense} from "react";
import {getRouteLocale} from "@/platform/i18n/server";
import {HeroSection} from "@/site/home/hero-section";
import {CategoryDiscovery} from "@/site/home/category-discovery";
import {EditorialBanner} from "@/site/home/editorial-banner";
import {ShopByCategory} from "@/site/home/shop-by-category";
import {BenefitsSection} from "@/site/home/benefits-section";
import {CtaBanner} from "@/site/home/cta-banner";
import {FeaturedProducts, TrendingProducts} from '@/features/products/featured-products';
import {getTopCollections} from '@/features/collections/data';
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
    const collections = await getTopCollections(locale);
    const primary = collections[0];
    const secondary = collections.length > 1 ? collections[1] : undefined;

    return (
        <div className="min-h-screen">
            <HeroSection/>

            <CategoryDiscovery/>

            {primary && (
                <Suspense>
                    <FeaturedProducts collectionSlug={primary.slug}/>
                </Suspense>
            )}

            {secondary && (
                <>
                    <EditorialBanner collectionSlug={secondary.slug}/>
                    <Suspense>
                        <TrendingProducts collectionSlug={secondary.slug}/>
                    </Suspense>
                </>
            )}

            <ShopByCategory/>

            <BenefitsSection/>

            <CtaBanner/>
        </div>
    );
}
