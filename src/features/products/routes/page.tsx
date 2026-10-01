import type { Metadata } from 'next';
import { Link } from '@/platform/i18n/navigation';
import { query } from '@/platform/vendure/api';
import {GetProductDetailQuery} from '@/features/products/graphql';
import { ProductImageCarousel } from '@/features/products/components/product-image-carousel';
import { ProductInfo } from '@/features/products/components/product-info';
import {getDisplayOptionGroups} from '@/features/products/product-options';
import { RelatedProducts } from '@/features/products/components/related-products';
import {ProductTrustMarkers} from '@/features/products/components/product-trust-markers';
import {ProductDetailsCard} from '@/features/products/components/product-details-card';
import {ProductContactCard} from '@/features/products/components/product-contact-card';
import {getProductAttributes} from '@/features/products/product-attributes';
import {
    Breadcrumb,
    BreadcrumbList,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { notFound } from 'next/navigation';
import { routing } from '@/platform/i18n/routing';
import {
    SITE_NAME,
    truncateDescription,
    buildCanonicalUrl,
    buildOgImages,
} from '@/config/metadata';
import {getTranslations} from 'next-intl/server';
import {toOgLocale} from '@/platform/i18n/locale-utils';
import {getRouteLocale} from '@/platform/i18n/server';
import {getPopularProductSlugs, getProductVariantParams} from '@/features/products/data';
import {getActiveCurrencyCode} from '@/features/currency/currency-server';

// Prerenders every product slug in the catalog at build time — static export
// has no on-demand fallback for a slug that wasn't prerendered. Content
// (name/description/images) is baked in for SEO, and so is a real
// build-time price/stock (in the channel's default currency) so crawlers and
// first paint see an actual price. It's superseded client-side once a live
// fetch resolves (see features/products/product-price-client.tsx), in case
// the viewer's active currency differs from the build-time default.
//
// The `variant` optional catch-all also prerenders one dedicated static page
// per non-default variant (`/product/[slug]/[sku]`), each with that
// variant's own real price/stock baked in. Without this, selecting a variant
// only ever updates the DOM client-side — the change is real for a viewer,
// but a fresh page load (or "View Page Source") of that same URL never
// reflects it, since query-string-driven client state was never part of the
// static HTML that was generated. Giving each variant its own prerendered
// URL means selecting one is a real navigation to an already-fully-rendered
// page, so its content is genuinely present on load — see docs/decisions.md.
export async function generateStaticParams({
    params,
}: {
    params: {locale: string};
}) {
    const [slugs, variantParams] = await Promise.all([
        getPopularProductSlugs(params.locale),
        getProductVariantParams(params.locale),
    ]);

    return [
        ...slugs.map((slug) => ({slug, variant: []})),
        ...variantParams.map(({slug, variant}) => ({slug, variant: [variant]})),
    ];
}

async function getProductData(slug: string) {
    const locale = await getRouteLocale();

    return await query(GetProductDetailQuery, {slug}, {languageCode: locale});
}

export async function generateMetadata({
    params,
}: PageProps<'/[locale]/product/[slug]/[[...variant]]'>): Promise<Metadata> {
    const { slug } = await params;
    const locale = await getRouteLocale();
    const result = await getProductData(slug);
    const product = result.data.product;

    const t = await getTranslations({locale, namespace: 'Product'});

    if (!product) {
        return {
            title: t('notFound'),
        };
    }

    const description = truncateDescription(product.description);
    const fallbackDescription = t('shopProductAt', {name: product.name, siteName: SITE_NAME});
    const ogImage = product.assets?.[0]?.preview;
    const ogLocale = toOgLocale(locale);
    // Variant sub-pages (/product/[slug]/[sku]) share the same name/description
    // as the base product — only price/stock differ — so canonical always
    // points at the bare product URL to avoid diluting ranking signals across
    // near-duplicate pages, per-variant content still being genuinely
    // crawlable is what matters for the "price missing from view-source" fix.
    const productPath = `/product/${product.slug}`;

    return {
        title: product.name,
        description: description || fallbackDescription,
        alternates: {
            canonical: buildCanonicalUrl(`/${locale}${productPath}`),
            languages: Object.fromEntries(
                routing.locales.map((l) => [l, buildCanonicalUrl(`/${l}${productPath}`)])
            ),
        },
        openGraph: {
            title: product.name,
            description: description || fallbackDescription,
            type: 'website',
            locale: ogLocale,
            url: buildCanonicalUrl(`/${locale}${productPath}`),
            images: buildOgImages(ogImage, product.name),
        },
        twitter: {
            card: 'summary_large_image',
            title: product.name,
            description: description || fallbackDescription,
            images: ogImage ? [ogImage] : undefined,
        },
    };
}

export default async function ProductDetailPage({
    params,
}: PageProps<'/[locale]/product/[slug]/[[...variant]]'>) {
    const { slug, variant } = await params;
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'Product'});

    const result = await getProductData(slug);
    const buildCurrencyCode = await getActiveCurrencyCode();

    const product = result.data.product;

    if (!product) {
        notFound();
    }

    // The optional `[[...variant]]` segment names a variant by SKU
    // (generateStaticParams above prerenders one such page per non-default
    // variant). An unrecognized SKU 404s rather than silently falling back to
    // the default variant, since that URL was never actually prerendered.
    const requestedSku = variant?.[0];
    const initialVariant = requestedSku
        ? product.variants.find((v) => v.sku === requestedSku)
        : product.variants[0];

    if (!initialVariant) {
        notFound();
    }

    // Get the primary collection (prefer deepest nested / most specific).
    // Grouping-only parents can have an empty slug, which the related-products
    // query rejects ("Either the Collection id or slug must be provided").
    const linkableCollections = product.collections?.filter(c => c.slug) ?? [];
    const primaryCollection = linkableCollections.find(c => c.parent?.id) ?? linkableCollections[0];

    // Hide options that belong to a shared option group but have no variant on
    // this product (Vendure 3.6 shared/global option groups).
    const productForDisplay = {...product, optionGroups: getDisplayOptionGroups(product)};

    // "Product Information" rows: the variant's SKU plus the product's real facet values.
    const attributes = [
        {label: t('details.sku'), value: initialVariant.sku},
        ...getProductAttributes(product.facetValues),
    ];
    const productUrl = buildCanonicalUrl(`/${locale}/product/${product.slug}`);

    return (
        <>
            <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 mt-16">
                {/* Breadcrumb Navigation */}
                <Breadcrumb className="mb-6">
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink render={<Link href="/" />}>{t('home')}</BreadcrumbLink>
                        </BreadcrumbItem>
                        {primaryCollection && (
                            <>
                                <BreadcrumbSeparator />
                                <BreadcrumbItem>
                                    <BreadcrumbLink render={<Link href={`/collection/${primaryCollection.slug}`} prefetch={false} />}>
                                        {primaryCollection.name}
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                            </>
                        )}
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>{product.name}</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">
                    {/* Left Column: gallery, sticky while the details scroll */}
                    <div className="lg:col-span-7 lg:sticky lg:top-24 lg:self-start">
                        <ProductImageCarousel name={product.name} images={product.assets} />
                    </div>

                    {/* Right Column: buy box, trust markers, details, contact */}
                    <div className="font-pdp space-y-6 lg:col-span-5">
                        <ProductInfo product={productForDisplay} buildCurrencyCode={buildCurrencyCode} initialVariantId={initialVariant.id} />
                        <ProductTrustMarkers />
                        <ProductDetailsCard attributes={attributes} descriptionHtml={product.description} />
                        <ProductContactCard name={product.name} url={productUrl} />
                    </div>
                </div>
            </div>

            {primaryCollection && (
                <RelatedProducts
                    collectionSlug={primaryCollection.slug}
                    currentProductId={product.id}
                />
            )}

            {/* Room for the mobile sticky buy bar so it never covers the page end. */}
            <div className="h-20 lg:hidden" aria-hidden="true" />
        </>
    );
}
