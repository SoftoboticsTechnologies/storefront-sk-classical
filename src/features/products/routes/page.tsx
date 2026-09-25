import type { Metadata } from 'next';
import { Link } from '@/platform/i18n/navigation';
import { query } from '@/platform/vendure/api';
import {GetProductDetailQuery} from '@/features/products/graphql';
import { ProductImageCarousel } from '@/features/products/components/product-image-carousel';
import { ProductInfo } from '@/features/products/components/product-info';
import {getDisplayOptionGroups} from '@/features/products/product-options';
import { RelatedProducts } from '@/features/products/components/related-products';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import {
    Breadcrumb,
    BreadcrumbList,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { notFound } from 'next/navigation';
import { Truck, RotateCcw, ShieldCheck, Clock } from 'lucide-react';
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

    // Get the primary collection (prefer deepest nested / most specific)
    const primaryCollection = product.collections?.find(c => c.parent?.id) ?? product.collections?.[0];

    // Hide options that belong to a shared option group but have no variant on
    // this product (Vendure 3.6 shared/global option groups).
    const productForDisplay = {...product, optionGroups: getDisplayOptionGroups(product)};

    return (
        <>
            <div className="container mx-auto px-4 py-8 mt-16">
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

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                    {/* Left Column: Image Carousel */}
                    <div className="lg:sticky lg:top-20 lg:self-start">
                        <ProductImageCarousel images={product.assets} />
                    </div>

                    {/* Right Column: Product Info */}
                    <div>
                        <ProductInfo product={productForDisplay} buildCurrencyCode={buildCurrencyCode} initialVariantId={initialVariant.id} />
                    </div>
                </div>
            </div>

            {/* Shipping & Trust Badges */}
            <section className="py-8 mt-8 border-y border-border/50">
                <div className="container mx-auto px-4">
                    <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8">
                        <div className="inline-flex items-center gap-2 rounded-full bg-muted/60 px-4 py-2 text-sm font-medium text-muted-foreground">
                            <Truck className="h-4 w-4 text-primary" />
                            {t('trustBadges.fastShipping')}
                        </div>
                        <div className="inline-flex items-center gap-2 rounded-full bg-muted/60 px-4 py-2 text-sm font-medium text-muted-foreground">
                            <RotateCcw className="h-4 w-4 text-primary" />
                            {t('trustBadges.freeReturns')}
                        </div>
                        <div className="inline-flex items-center gap-2 rounded-full bg-muted/60 px-4 py-2 text-sm font-medium text-muted-foreground">
                            <ShieldCheck className="h-4 w-4 text-primary" />
                            {t('trustBadges.secureCheckout')}
                        </div>
                        <div className="inline-flex items-center gap-2 rounded-full bg-muted/60 px-4 py-2 text-sm font-medium text-muted-foreground">
                            <Clock className="h-4 w-4 text-primary" />
                            {t('trustBadges.guarantee')}
                        </div>
                    </div>
                </div>
            </section>

            {/* Store FAQ Section */}
            <section className="py-16 bg-muted/30">
                <div className="container mx-auto px-4 max-w-2xl">
                    <h2 className="text-2xl font-bold text-center mb-8">{t('faq.title')}</h2>
                    <Accordion className="w-full">
                        <AccordionItem value="shipping">
                            <AccordionTrigger>{t('faq.shipping.question')}</AccordionTrigger>
                            <AccordionContent>
                                {t('faq.shipping.answer')}
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="returns">
                            <AccordionTrigger>{t('faq.returns.question')}</AccordionTrigger>
                            <AccordionContent>
                                {t('faq.returns.answer')}
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="tracking">
                            <AccordionTrigger>{t('faq.tracking.question')}</AccordionTrigger>
                            <AccordionContent>
                                {t('faq.tracking.answer')}
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="international">
                            <AccordionTrigger>{t('faq.international.question')}</AccordionTrigger>
                            <AccordionContent>
                                {t('faq.international.answer')}
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </div>
            </section>

            {primaryCollection && (
                <RelatedProducts
                    collectionSlug={primaryCollection.slug}
                    currentProductId={product.id}
                />
            )}
        </>
    );
}
