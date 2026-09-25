export interface SearchInputParams {
    term?: string;
    collectionSlug?: string;
    take: number;
    skip: number;
    groupByProduct: boolean;
    sort: { name?: 'ASC' | 'DESC'; price?: 'ASC' | 'DESC' };
    facetValueFilters?: Array<{ or: string[] }>;
}

interface BuildSearchInputOptions {
    searchParams: { [key: string]: string | string[] | undefined };
    collectionSlug?: string;
}

export function buildSearchInput({ searchParams, collectionSlug }: BuildSearchInputOptions): SearchInputParams {
    const page = Number(searchParams.page) || 1;
    const take = 12;
    const skip = (page - 1) * take;
    const sort = (searchParams.sort as string) || 'name-asc';
    const searchTerm = searchParams.q as string;

    // Extract facet entries from search params, encoded as "<facetId>:<facetValueId>"
    const facetEntries = searchParams.facets
        ? Array.isArray(searchParams.facets)
            ? searchParams.facets
            : [searchParams.facets]
        : [];

    // Group facet value IDs by their facet, so values within the same facet
    // are OR'd together (e.g. brand: Apple OR Samsung) while different facets
    // are AND'd together (e.g. category: Equipment AND brand: Apple OR Samsung)
    const facetValueIdsByFacet = new Map<string, string[]>();
    for (const entry of facetEntries) {
        const [facetId, facetValueId] = entry.split(':');
        if (!facetId || !facetValueId) continue;
        const existing = facetValueIdsByFacet.get(facetId);
        if (existing) {
            existing.push(facetValueId);
        } else {
            facetValueIdsByFacet.set(facetId, [facetValueId]);
        }
    }

    // Map sort parameter to Vendure SearchResultSortParameter
    const sortMapping: Record<string, { name?: 'ASC' | 'DESC'; price?: 'ASC' | 'DESC' }> = {
        'name-asc': { name: 'ASC' },
        'name-desc': { name: 'DESC' },
        'price-asc': { price: 'ASC' },
        'price-desc': { price: 'DESC' },
    };

    return {
        ...(searchTerm && { term: searchTerm }),
        ...(collectionSlug && { collectionSlug }),
        take,
        skip,
        groupByProduct: true,
        sort: sortMapping[sort] || sortMapping['name-asc'],
        ...(facetValueIdsByFacet.size > 0 && {
            facetValueFilters: Array.from(facetValueIdsByFacet.values()).map(ids => ({ or: ids }))
        })
    };
}

export function getCurrentPage(searchParams: { [key: string]: string | string[] | undefined }): number {
    return Number(searchParams.page) || 1;
}
