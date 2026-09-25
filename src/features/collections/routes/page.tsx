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
import {getGroupCollection, getTopCollections} from '@/features/collections/data';
import {formatCollectionName, getCollectionHref, getCollectionPathSlug, getCategoryGroup, getCategoryImage, DEFAULT_CATEGORY_IMAGE} from '@/features/collections/utils';
import {PageBanner} from '@/components/ui/page-banner';

// Prerenders every known collection (root + children) at build time — static
// export has no on-demand fallback for a slug that wasn't prerendered.
export async function generateStaticParams({
    params,
}: {
    params: {locale: string};
}) {
    const collections = await getTopCollections(params.locale);
    const slugs = collections.flatMap((collection) => [
        // Real slug, or the name-derived one for a grouping-only parent.
        getCollectionPathSlug(collection),
        ...(collection.children?.map((child) => child.slug) ?? []),
    ]);
    // Skip empty slugs (grouping-only parents without linkable children) and
    // duplicates, since children also appear as top-level items.
    return [...new Set(slugs.filter(Boolean))].map((slug) => ({slug}));
}

async function getCollectionMetadata(slug: string) {
    const locale = await getRouteLocale();

    return query(GetCollectionProductsQuery, {
        slug,
        input: { take: 0, collectionSlug: slug, groupByProduct: true },
    }, {languageCode: locale});
}

/**
 * The collection behind a route slug. A grouping-only parent (empty Vendure
 * slug) has no `collection(slug)` result, so it is read from the collection
 * list instead and its page lists every child collection's products.
 */
async function resolveCollection(slug: string) {
    const locale = await getRouteLocale();
    const groupCollection = await getGroupCollection(locale, slug);

    if (groupCollection) {
        const childSlugs = (groupCollection.children ?? []).map((child) => child.slug).filter(Boolean);
        return {collection: groupCollection, childSlugs};
    }

    const result = await getCollectionMetadata(slug);
    return {collection: result.data.collection, childSlugs: undefined};
}

// Default (unfiltered, page 1) product listing for the collection, fetched
// at build time so the statically-exported HTML has real, indexable product
// content for SEO instead of only the client-fetched-after-mount grid (see
// collection-results.tsx). Superseded client-side once the live fetch
// resolves, or immediately when the URL carries filter/sort/page params this
// build-time listing doesn't reflect.
async function getDefaultCollectionProducts(slug: string, collectionSlugs?: string[]) {
    const locale = await getRouteLocale();
    const currencyCode = await getActiveCurrencyCode();

    return query(SearchProductsQuery, {
        input: buildSearchInput({searchParams: {}, collectionSlug: slug, collectionSlugs}),
    }, {languageCode: locale, currencyCode});
}

export async function generateMetadata({
    params,
}: PageProps<'/[locale]/collection/[slug]'>): Promise<Metadata> {
    const { slug } = await params;
    const locale = await getRouteLocale();
    const {collection} = await resolveCollection(slug);

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
    const collectionPath = `/collection/${slug}`;

    return {
        title: formatCollectionName(collection.name),
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
    const {collection, childSlugs} = await resolveCollection(slug);
    const collectionName = formatCollectionName(collection?.name ?? slug);
    const themeSource = {slug, name: collection?.name ?? slug, featuredAsset: collection?.featuredAsset};
    const group = getCategoryGroup(themeSource)?.group;
    // Vendure description first; otherwise family-specific copy, then a generic line.
    const bannerDescription = truncateDescription(collection?.description, 180)
        || (group ? t(`banner.${group}`) : t('banner.default', {name: collectionName, siteName: SITE_NAME}));
    const initialProducts = await getDefaultCollectionProducts(slug, childSlugs);

    // Category family for the sub-category strip: this collection if it has
    // children, otherwise the parent it belongs to (so siblings stay one tap away).
    const allCollections = await getTopCollections(locale);
    const self = allCollections.find((c) => getCollectionPathSlug(c) === slug);
    const family = self?.children?.some((child) => child.slug)
        ? self
        : allCollections.find((c) => c.children?.some((child) => child.slug === slug));
    const parent = family && family !== self ? family : undefined;
    const subcategories = (family?.children ?? []).filter((child) => child.slug);
    const familySlug = family && getCollectionPathSlug(family);

    return (
        <div className="container mx-auto px-4 py-8 mt-16">
            {/* Breadcrumbs */}
            <Breadcrumb className="mb-6">
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink render={<Link href="/" />}>{t('home')}</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    {parent && (
                        <>
                            <BreadcrumbItem>
                                {getCollectionPathSlug(parent) ? (
                                    <BreadcrumbLink render={<Link href={getCollectionHref(parent)} prefetch={false} />}>
                                        {formatCollectionName(parent.name)}
                                    </BreadcrumbLink>
                                ) : (
                                    <span>{formatCollectionName(parent.name)}</span>
                                )}
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                        </>
                    )}
                    <BreadcrumbItem>
                        <BreadcrumbPage>{collectionName}</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <PageBanner
                className="mb-8"
                eyebrow={t('banner.eyebrow')}
                title={collectionName}
                description={bannerDescription}
                image={getCategoryImage(themeSource) ?? DEFAULT_CATEGORY_IMAGE}
                ctaLabel={t('banner.cta')}
            />

            {family && subcategories.length > 0 && (
                <nav aria-label={t('subcategories')} className="mb-8 -mx-4 overflow-x-auto px-4">
                    <ul className="flex w-max gap-2 md:w-auto md:flex-wrap">
                        {[
                            ...(familySlug ? [{slug: familySlug, label: t('allIn', {name: formatCollectionName(family.name)})}] : []),
                            ...subcategories.map((child) => ({slug: child.slug, label: formatCollectionName(child.name)})),
                        ].map((item) => {
                            const active = item.slug === slug;
                            return (
                                <li key={item.slug}>
                                    <Link
                                        href={`/collection/${item.slug}`}
                                        prefetch={false}
                                        aria-current={active ? 'page' : undefined}
                                        className={`inline-flex whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                                            active
                                                ? 'border-primary bg-primary text-primary-foreground'
                                                : 'border-gold/50 hover:border-primary hover:text-primary'
                                        }`}
                                    >
                                        {item.label}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>
            )}

            <div id="products" className="scroll-mt-24">
                <CollectionResults collectionSlug={slug} collectionSlugs={childSlugs} initialProducts={initialProducts.data} />
            </div>
        </div>
    );
}
