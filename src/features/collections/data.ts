import {query} from '@/platform/vendure/api';
import {ResultOf} from '@/platform/vendure/graphql';
import {GetTopCollectionsQuery} from './graphql';
import {getCollectionPathSlug} from './utils';

// Page size used while enumerating the full catalog at build time.
const COLLECTION_PAGE_SIZE = 100;

type TopCollection = ResultOf<typeof GetTopCollectionsQuery>['collections']['items'][number];

/**
 * Every top-level (and child) collection in the catalog, used to prerender
 * collection pages at build time. Static export has no on-demand fallback for
 * a slug that wasn't prerendered, so this must enumerate the full catalog
 * (paginated) rather than relying on a single unpaginated request.
 */
export async function getTopCollections(locale: string): Promise<TopCollection[]> {
    const items: TopCollection[] = [];
    let skip = 0;

    for (;;) {
        const result = await query(GetTopCollectionsQuery, {
            take: COLLECTION_PAGE_SIZE,
            skip,
        }, {languageCode: locale});

        const page = result.data.collections.items;
        items.push(...page);

        if (page.length < COLLECTION_PAGE_SIZE || items.length >= result.data.collections.totalItems) {
            break;
        }
        skip += COLLECTION_PAGE_SIZE;
    }

    return items;
}

/**
 * Resolves a `/collection/[slug]` param to a grouping-only parent (empty
 * Vendure slug) whose page slug is derived from its name. Real slugs always
 * win, so this returns undefined whenever a collection owns `slug`.
 */
export async function getGroupCollection(locale: string, slug: string): Promise<TopCollection | undefined> {
    const collections = await getTopCollections(locale);
    if (collections.some((collection) => collection.slug === slug)) {
        return undefined;
    }
    return collections.find((collection) => !collection.slug && getCollectionPathSlug(collection) === slug);
}

/**
 * Root collections only. `getTopCollections` returns every collection flat
 * (children appear both nested and as their own items), so drop anything that
 * is listed as another collection's child.
 */
export async function getRootCollections(locale: string): Promise<TopCollection[]> {
    const collections = await getTopCollections(locale);
    const childIds = new Set(
        collections.flatMap((collection) => collection.children?.map((child) => child.id) ?? []),
    );
    return collections.filter((collection) => !childIds.has(collection.id));
}
