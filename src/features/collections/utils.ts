export type CategoryGroup = 'costumes' | 'ghungroo' | 'jewellery' | 'accessories';

/**
 * Local imagery per product family, matched against a collection's slug/name
 * since Vendure collections currently carry no featured asset. Order matters:
 * the first matching group wins. Presentation only.
 */
const CATEGORY_GROUPS: {group: CategoryGroup; matches: string[]; src: string; position?: string}[] = [
    {group: 'costumes', matches: ['costume', 'dress', 'saree'], src: '/images/categories/costumes.webp', position: 'center 20%'},
    {group: 'jewellery', matches: ['jewel', 'ornament', 'earring', 'jhumka'], src: '/images/categories/jewellery.webp'},
    {group: 'accessories', matches: ['accessor', 'flower', 'jada'], src: '/images/categories/accessories.webp', position: 'center 30%'},
    {group: 'ghungroo', matches: ['ghungroo', 'line'], src: '/images/categories/ghungroo.webp'},
];

/** Image used when a page isn't tied to one product family (e.g. all products). */
export const DEFAULT_CATEGORY_IMAGE = {src: '/images/categories/costumes.webp', position: 'center 20%'};

interface ThemedCollection {
    slug: string;
    name: string;
    featuredAsset?: {preview: string} | null;
}

export function getCategoryGroup(collection: {slug: string; name: string}) {
    const haystack = `${collection.slug} ${collection.name}`.toLowerCase();
    return CATEGORY_GROUPS.find((entry) => entry.matches.some((match) => haystack.includes(match)));
}

/** Tile/banner image for a collection; its own Vendure `featuredAsset` always wins. */
export function getCategoryImage(collection: ThemedCollection): {src: string; position?: string} | undefined {
    if (collection.featuredAsset?.preview) {
        return {src: collection.featuredAsset.preview, position: undefined};
    }
    const entry = getCategoryGroup(collection);
    return entry && {src: entry.src, position: entry.position};
}

interface LinkableCollection {
    slug: string;
    name: string;
    children?: {slug: string}[] | null;
}

/** URL-safe slug from an admin-entered name: "DANCE-ACCESSORIES" → "dance-accessories". */
export function slugifyName(name: string): string {
    return name
        .trim()
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, '-')
        .replace(/^-+|-+$/g, '');
}

/**
 * Vendure allows a collection to be saved with an empty slug (a parent used
 * only for grouping). Such a parent still gets its own page at a slug derived
 * from its name, listing the products of all its sub-collections (see
 * `getGroupCollection` in data.ts). Returns undefined when there's no page.
 */
export function getCollectionPathSlug(collection: LinkableCollection): string | undefined {
    if (collection.slug) return collection.slug;
    const hasLinkableChildren = collection.children?.some((child) => child.slug);
    return hasLinkableChildren ? slugifyName(collection.name) || undefined : undefined;
}

/** Link target for a collection; falls back to search when it has no page. */
export function getCollectionHref(collection: LinkableCollection): string {
    const pathSlug = getCollectionPathSlug(collection);
    return pathSlug ? `/collection/${pathSlug}` : '/search';
}

/**
 * Presentation-only cleanup for admin-entered names like "DANCE-ACCESSORIES"
 * or "4-LINE " → "Dance Accessories" / "4-Line". Digit-led tokens keep their
 * hyphen so sizes such as "3-Line" stay readable.
 */
export function formatCollectionName(name: string): string {
    return name
        .trim()
        .split(/\s+/)
        .map((word) => (/^\d/.test(word) ? word : word.replace(/-/g, ' ')))
        .join(' ')
        .toLowerCase()
        .replace(/(^|[\s-])(\p{L})/gu, (_, sep: string, ch: string) => sep + ch.toUpperCase());
}
