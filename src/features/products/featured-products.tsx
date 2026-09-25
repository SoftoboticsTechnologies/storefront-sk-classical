import {ProductCarousel} from "@/features/products/components/product-carousel";
import {getRouteLocale} from "@/platform/i18n/server";
import {getActiveCurrencyCode} from '@/features/currency/currency-server';
import {query} from "@/platform/vendure/api";
import {GetCollectionProductsQuery} from '@/features/collections/graphql';
import { Link } from '@/platform/i18n/navigation';
import {ArrowRight} from "lucide-react";
import {getTranslations} from 'next-intl/server';
import {preconnect} from 'react-dom';
import {readFragment} from '@/platform/vendure/graphql';
import {ProductCardFragment} from '@/features/products/graphql';

function getAssetOrigin(preview?: string) {
    if (!preview) return undefined;

    try {
        return new URL(preview).origin;
    } catch {
        return undefined;
    }
}

async function getCollectionProducts(collectionSlug: string, currencyCode: string) {
    const locale = await getRouteLocale();

    const result = await query(GetCollectionProductsQuery, {
        slug: collectionSlug,
        input: {
            collectionSlug,
            take: 12,
            skip: 0,
            groupByProduct: true
        }
    }, {languageCode: locale, currencyCode});

    return result.data.search.items;
}

interface CollectionCarouselSectionProps {
    collectionSlug: string;
    title: string;
    preloadFirstProduct?: boolean;
}

async function CollectionCarouselSection({collectionSlug, title, preloadFirstProduct}: CollectionCarouselSectionProps) {
    const locale = await getRouteLocale();
    const currencyCode = await getActiveCurrencyCode();
    const t = await getTranslations({locale, namespace: 'Product'});
    const products = await getCollectionProducts(collectionSlug, currencyCode);
    const firstProduct = products[0]
        ? readFragment(ProductCardFragment, products[0])
        : undefined;
    const assetOrigin = getAssetOrigin(firstProduct?.productAsset?.preview);

    if (preloadFirstProduct && assetOrigin) {
        preconnect(assetOrigin);
    }

    if (products.length === 0) {
        return null;
    }

    return (
        <div>
            <ProductCarousel
                title={title}
                products={products}
                preloadFirstProduct={preloadFirstProduct}
            />
            <div className="container mx-auto px-4 -mt-6 mb-8">
                <div className="flex justify-center">
                    <Link
                        href="/search"
                        className="group inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline underline-offset-4 transition-colors"
                    >
                        {t('viewAllProducts')}
                        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                </div>
            </div>
        </div>
    )
}

interface CollectionProductsProps {
    collectionSlug: string;
}

export async function FeaturedProducts({collectionSlug}: CollectionProductsProps) {
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'Product'});

    return (
        <CollectionCarouselSection
            collectionSlug={collectionSlug}
            title={t('featuredProducts')}
            preloadFirstProduct
        />
    );
}

export async function TrendingProducts({collectionSlug}: CollectionProductsProps) {
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'Product'});

    return (
        <CollectionCarouselSection
            collectionSlug={collectionSlug}
            title={t('trendingProducts')}
        />
    );
}
