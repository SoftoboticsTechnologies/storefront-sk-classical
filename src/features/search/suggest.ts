'use client';

import {query} from '@/platform/vendure/client-api';
import {type FragmentOf} from '@/platform/vendure/graphql';
import {getActiveCurrencyCode} from '@/features/currency/currency-client';
import {SearchProductsQuery} from '@/features/search/graphql';
import {ProductCardFragment} from '@/features/products/graphql';

export type SearchSuggestion = FragmentOf<typeof ProductCardFragment>;

export interface SearchSuggestionResult {
    items: SearchSuggestion[];
    totalItems: number;
}

/**
 * Live product suggestions for the search overlay. Resolves the viewer's
 * active currency and passes the UI locale, same as the full results page
 * (search-results.tsx), so suggestion prices/names match what the results
 * page will show.
 */
export async function getSearchSuggestions(term: string, locale: string): Promise<SearchSuggestionResult> {
    const trimmed = term.trim();
    if (!trimmed) return {items: [], totalItems: 0};

    const currencyCode = await getActiveCurrencyCode();
    const {data} = await query(SearchProductsQuery, {
        input: {
            term: trimmed,
            take: 6,
            skip: 0,
            groupByProduct: true,
        },
    }, {languageCode: locale, currencyCode});

    return {items: data.search.items, totalItems: data.search.totalItems};
}
