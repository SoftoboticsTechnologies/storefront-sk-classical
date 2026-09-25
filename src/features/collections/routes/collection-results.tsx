'use client';

import {Suspense, useEffect, useState} from 'react';
import {useLocale} from 'next-intl';
import {query} from '@/platform/vendure/client-api';
import {getActiveCurrencyCode} from '@/features/currency/currency-client';
import {ResultOf} from '@/platform/vendure/graphql';
import {FacetFilters} from '@/features/search/facet-filters';
import {ProductGridSkeleton} from '@/features/products/product-grid-skeleton';
import {ProductGrid} from '@/features/products/product-grid';
import {SearchParamsSync} from '@/features/search/search-params-sync';
import {buildSearchInput, getCurrentPage} from '@/features/search/search-helpers';
import {SearchProductsQuery} from '@/features/search/graphql';

type SearchProductsResult = {
    data: ResultOf<typeof SearchProductsQuery>;
    token?: string;
};

// Mirrors features/search/routes/search-results.tsx's URLSearchParams ->
// buildSearchInput bridging — kept identical since facet OR/AND semantics
// (search-helpers.ts) must not diverge between search and collection pages.
function toSearchParamsRecord(searchParams: URLSearchParams): {[key: string]: string | string[] | undefined} {
    const record: {[key: string]: string | string[] | undefined} = {};
    for (const key of new Set(searchParams.keys())) {
        const values = searchParams.getAll(key);
        record[key] = values.length > 1 ? values : values[0];
    }
    return record;
}

function fetchCollectionProducts(collectionSlug: string, searchParamsString: string, locale: string): Promise<SearchProductsResult> {
    const record = toSearchParamsRecord(new URLSearchParams(searchParamsString));

    return getActiveCurrencyCode().then((currencyCode) =>
        query(SearchProductsQuery, {
            input: buildSearchInput({searchParams: record, collectionSlug}),
        }, {languageCode: locale, currencyCode})
    );
}

interface CollectionResultsProps {
    collectionSlug: string;
    /**
     * Default (unfiltered, page 1) listing already fetched server-side at
     * build time — used as the initial result so the statically-exported
     * HTML has real product content for SEO/crawlers instead of nothing
     * until the client-side fetch resolves. Superseded by the live fetch,
     * which also covers any filter/sort/page the URL specifies.
     */
    initialProducts?: ResultOf<typeof SearchProductsQuery>;
}

export function CollectionResults({collectionSlug, initialProducts}: CollectionResultsProps) {
    const locale = useLocale();
    // Defaults to '' (no filters/sort/page) so the first render — including
    // the statically-exported HTML — matches the build-time `initialProducts`
    // default listing. SearchParamsSync reports the real value post-hydration
    // without this component calling useSearchParams() itself (see
    // search-params-sync.tsx for why that matters under static export).
    const [searchParamsString, setSearchParamsString] = useState('');
    const [resultPromise, setResultPromise] = useState<Promise<SearchProductsResult> | null>(
        () => (initialProducts ? Promise.resolve({data: initialProducts}) : null)
    );
    const [hasSyncedParams, setHasSyncedParams] = useState(false);

    useEffect(() => {
        if (!hasSyncedParams) return;
        setResultPromise(fetchCollectionProducts(collectionSlug, searchParamsString, locale));
    }, [collectionSlug, searchParamsString, locale, hasSyncedParams]);

    const page = getCurrentPage(toSearchParamsRecord(new URLSearchParams(searchParamsString)));

    return (
        <>
            <SearchParamsSync
                onChange={(value) => {
                    setSearchParamsString(value);
                    setHasSyncedParams(true);
                }}
            />
            {!resultPromise ? (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    <aside className="lg:col-span-1">
                        <div className="h-64 animate-pulse bg-muted rounded-lg" />
                    </aside>
                    <div className="lg:col-span-3">
                        <ProductGridSkeleton />
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Filters Sidebar */}
                    <aside className="lg:col-span-1">
                        <Suspense fallback={<div className="h-64 animate-pulse bg-muted rounded-lg"/>}>
                            <FacetFilters productDataPromise={resultPromise} searchParamsString={searchParamsString}/>
                        </Suspense>
                    </aside>

                    {/* Product Grid */}
                    <div className="lg:col-span-3">
                        <Suspense fallback={<ProductGridSkeleton/>}>
                            <ProductGrid productDataPromise={resultPromise} currentPage={page} take={12} searchParamsString={searchParamsString}/>
                        </Suspense>
                    </div>
                </div>
            )}
        </>
    );
}
