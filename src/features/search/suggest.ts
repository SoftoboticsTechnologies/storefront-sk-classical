'use client';

import {query} from '@/platform/vendure/client-api';
import {type FragmentOf} from '@/platform/vendure/graphql';
import {SearchProductsQuery} from '@/features/search/graphql';
import {ProductCardFragment} from '@/features/products/graphql';

export type SearchSuggestion = FragmentOf<typeof ProductCardFragment>;

export async function getSearchSuggestions(term: string): Promise<SearchSuggestion[]> {
    const trimmed = term.trim();
    if (!trimmed) return [];

    const {data} = await query(SearchProductsQuery, {
        input: {
            term: trimmed,
            take: 6,
            skip: 0,
            groupByProduct: true,
            sort: {name: 'ASC'},
        },
    });

    return data.search.items;
}
