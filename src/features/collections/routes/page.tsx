import type { Metadata } from 'next';
import { Link } from '@/platform/i18n/navigation';
import { query } from '@/platform/vendure/api';
import {GetCollectionProductsQuery} from '@/features/collections/graphql';
import {SearchProductsQuery} from '@/features/search/graphql';
import {buildSearchInput} from '@/features/search/search-helpers';
import {getActiveCurrencyCode} from '@/features/currency/currency-server';
import {CollectionResults} from '@/features/collections/routes/collection-results';
import {
    Breadcrumb,
    BreadcrumbList,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { routing } from '@/platform/i18n/routing';
import {
    SITE_NAME,
    truncateDescription,
    buildCanonicalUrl,
    buildOgImages,
} from '@/config/metadata';
import {toOgLocale} from '@/platform/i18n/locale-utils';
import {getRouteLocale} from '@/platform/i18n/server';
import {getTranslations} from 'next-intl/server';
import {getTopCollections} from '@/features/collections/data';

// Prerenders every known collection (root + children) at build time — static
// export has no on-demand fallback for a slug that wasn't prerendered.
export async function generateStaticParams({
    params,
}: {
    params: {locale: string};
}) {
    const collections = await getTopCollections(params.locale);
    const slugs = collections.flatMap((collection) => [
        collection.slug,
        ...(collection.children?.map((child) => child.slug) ?? []),
    ]);
    return slugs.map((slug) => ({slug}));
}

async function getCollectionMetadata(slug: string) {
    const locale = await getRouteLocale();

    return query(GetCollectionProductsQuery, {
        slug,
        input: { take: 0, collectionSlug: slug, groupByProduct: true },
    }, {languageCode: locale});
}

// Default (unfiltered, page 1) product listing for the collection, fetched
// at build time so the statically-exported HTML has real, indexable product
// content for SEO instead of only the client-fetched-after-mount grid (see
// collection-results.tsx). Superseded client-side once the live fetch
// resolves, or immediately when the URL carries filter/sort/page params this
// build-time listing doesn't reflect.
async function getDefaultCollectionProducts(slug: string) {
    const locale = await getRouteLocale();
    const currencyCode = await getActiveCurrencyCode();

    return query(SearchProductsQuery, {
        input: buildSearchInput({searchParams: {}, collectionSlug: slug}),
    }, {languageCode: locale, currencyCode});
}

export async function generateMetadata({
    params,
}: PageProps<'/[locale]/collection/[slug]'>): Promise<Metadata> {
    const { slug } = await params;
    const locale = await getRouteLocale();
    const result = await getCollectionMetadata(slug);
    const collection = result.data.collection;

    const t = await getTranslations({locale, namespace: 'Collection'});

    if (!collection) {
        return {
            title: t('collectionNotFound'),
        };
    }

    const description =
        truncateDescription(collection.description) ||
        t('browseCollectionAt', {name: collection.name, siteName: SITE_NAME});
    const ogLocale = toOgLocale(locale);
    const collectionPath = `/collection/${collection.slug}`;

    return {
        title: collection.name,
        description,
        alternates: {
            canonical: buildCanonicalUrl(`/${locale}${collectionPath}`),
            languages: Object.fromEntries(
                routing.locales.map((l) => [l, buildCanonicalUrl(`/${l}${collectionPath}`)])
            ),
        },
        openGraph: {
            title: collection.name,
            description,
            type: 'website',
            locale: ogLocale,
            url: buildCanonicalUrl(`/${locale}${collectionPath}`),
            images: buildOgImages(collection.featuredAsset?.preview, collection.name),
        },
        twitter: {
            card: 'summary_large_image',
            title: collection.name,
            description,
            images: collection.featuredAsset?.preview
                ? [collection.featuredAsset.preview]
                : undefined,
        },
    };
}

export default async function CollectionPage({params}: PageProps<'/[locale]/collection/[slug]'>) {
    const { slug } = await params;
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'Collection'});

    // Name/breadcrumb are baked in at build time for SEO; product listing,
    // filters, sort, and pagination are resolved live client-side (currency-
    // and query-string-dependent) — see collection-results.tsx.
    const collectionResult = await getCollectionMetadata(slug);
    const collectionName = collectionResult.data.collection?.name ?? slug;
    const initialProducts = await getDefaultCollectionProducts(slug);

    return (
        <div className="container mx-auto px-4 py-8 mt-16">
            {/* Breadcrumbs */}
            <Breadcrumb className="mb-6">
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink render={<Link href="/" />}>{t('home')}</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>{collectionName}</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            {/* Collection Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">{collectionName}</h1>
            </div>

            <CollectionResults collectionSlug={slug} initialProducts={initialProducts.data} />
        </div>
    );
}
