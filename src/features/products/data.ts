import {query} from '@/platform/vendure/api';
import {SearchProductsQuery} from '@/features/search/graphql';
import {readFragment} from '@/platform/vendure/graphql';
import {ProductCardFragment, GetProductDetailQuery} from './graphql';

// Page size used while enumerating the full catalog at build time.
const PRODUCT_SLUG_PAGE_SIZE = 100;

/**
 * Slugs for every product in the catalog, used to prerender product detail
 * pages at build time. Static export has no on-demand fallback for a slug
 * that wasn't prerendered, so this must enumerate the full catalog (paginated)
 * rather than a "popular" subset. Not used for any pricing/stock display.
 */
export async function getPopularProductSlugs(locale: string): Promise<string[]> {
    const slugs: string[] = [];
    let skip = 0;
    let fetched = 0;

    for (;;) {
        const result = await query(SearchProductsQuery, {
            input: {
                take: PRODUCT_SLUG_PAGE_SIZE,
                skip,
                groupByProduct: true,
                sort: {name: 'ASC'},
            },
        }, {languageCode: locale});

        const items = result.data.search.items;
        fetched += items.length;
        // A product missing a translation for this locale can come back with
        // an empty slug — filter it out rather than prerendering a bogus
        // `/product//` route (or, for getProductVariantParams below, querying
        // the detail API with an empty slug, which it rejects outright).
        slugs.push(...items.map((item) => readFragment(ProductCardFragment, item).slug).filter(Boolean));

        if (items.length < PRODUCT_SLUG_PAGE_SIZE || fetched >= result.data.search.totalItems) {
            break;
        }
        skip += PRODUCT_SLUG_PAGE_SIZE;
    }

    return slugs;
}

/**
 * `{slug, variant}` pairs for every non-default variant of every product in
 * the catalog, used by generateStaticParams to prerender one static page per
 * variant (in addition to the slug's own default-variant page) — each with
 * that variant's real price/stock baked into the HTML. `variant` is the
 * variant's SKU, sufficient to identify it regardless of how many option
 * groups the product has. The first variant (`product.variants[0]`, matching
 * the default selection in product-info.tsx) is deliberately excluded here:
 * it's served at the slug's own bare URL rather than a `/[sku]` sub-path.
 */
export async function getProductVariantParams(locale: string): Promise<Array<{slug: string; variant: string}>> {
    const slugs = await getPopularProductSlugs(locale);
    const params: Array<{slug: string; variant: string}> = [];

    await Promise.all(slugs.map(async (slug) => {
        const result = await query(GetProductDetailQuery, {slug}, {languageCode: locale});
        const variants = result.data.product?.variants ?? [];
        variants.slice(1).forEach((variant) => {
            params.push({slug, variant: variant.sku});
        });
    }));

    return params;
}
