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

// Next's useSearchParams() only exposes a ReadonlyURLSearchParams; convert it
// into the { [key: string]: string | string[] | undefined } shape buildSearchInput
// expects (multiple entries — e.g. repeated `facets=` — become an array).
function toSearchParamsRecord(searchParams: URLSearchParams): {[key: string]: string | string[] | undefined} {
    const record: {[key: string]: string | string[] | undefined} = {};
    for (const key of new Set(searchParams.keys())) {
        const values = searchParams.getAll(key);
        record[key] = values.length > 1 ? values : values[0];
    }
    return record;
}

function fetchSearchResults(searchParamsString: string, locale: string): Promise<SearchProductsResult> {
    const record = toSearchParamsRecord(new URLSearchParams(searchParamsString));

    return getActiveCurrencyCode().then((currencyCode) =>
        query(SearchProductsQuery, {
            input: buildSearchInput({searchParams: record}),
        }, {languageCode: locale, currencyCode})
    );
}

export function SearchResults() {
    const locale = useLocale();
    // This route is already noindex'd (searchParams can't be read server-side
    // under output: 'export'), so there's no SEO cost here — but FacetFilters/
    // ProductGrid now require searchParamsString rather than calling
    // useSearchParams() themselves, so this component follows the same
    // SearchParamsSync pattern as collection-results.tsx to stay compatible.
    const [searchParamsString, setSearchParamsString] = useState('');
    const [resultPromise, setResultPromise] = useState<Promise<SearchProductsResult> | null>(null);
    const [hasSyncedParams, setHasSyncedParams] = useState(false);

    useEffect(() => {
        if (!hasSyncedParams) return;
        setResultPromise(fetchSearchResults(searchParamsString, locale));
    }, [searchParamsString, locale, hasSyncedParams]);

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
    )
}
