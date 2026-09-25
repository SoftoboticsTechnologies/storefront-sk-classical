import type {Metadata} from 'next';
import {Suspense} from 'react';
import {getTranslations} from 'next-intl/server';
import {getRouteLocale} from '@/platform/i18n/server';
import {SearchResults} from "@/features/search/routes/search-results";
import {SearchTerm, SearchTermSkeleton} from "@/features/search/routes/search-term";
import {SearchResultsSkeleton} from "@/features/search/components/search-results-skeleton";
import {SITE_NAME, noIndexRobots} from '@/config/metadata';

// searchParams can't be read server-side under output: 'export' (no
// per-request server) — the query-specific title/description is set
// client-side instead (see search-term.tsx); this stays a generic,
// build-time fallback. The route is already noindex, so this has no SEO cost.
export async function generateMetadata(): Promise<Metadata> {
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'Search'});

    return {
        title: t('pageTitle'),
        description: t('metaCatalogDescription', {siteName: SITE_NAME}),
        robots: noIndexRobots(),
    };
}

export default function SearchPage() {
    return (
        <div className="container mx-auto px-4 py-8 mt-16">
            <Suspense fallback={<SearchTermSkeleton/>}>
                <SearchTerm/>
            </Suspense>
            <Suspense fallback={<SearchResultsSkeleton />}>
                <SearchResults/>
            </Suspense>
        </div>
    );
}
