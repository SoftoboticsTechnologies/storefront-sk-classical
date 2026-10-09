'use client';

import {SearchX} from 'lucide-react';
import {useTranslations} from 'next-intl';
import {Link} from '@/platform/i18n/navigation';
import {Button} from '@/components/ui/button';
import {Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle} from '@/components/ui/empty';

interface SearchEmptyStateProps {
    searchParamsString: string;
}

/** Zero-results state for /search: explains why and offers a way out (drop filters, or browse everything). */
export function SearchEmptyState({searchParamsString}: SearchEmptyStateProps) {
    const t = useTranslations('Search');
    const params = new URLSearchParams(searchParamsString);
    const term = params.get('q')?.trim() ?? '';
    const hasFilters = params.has('facets');

    // Same term, filters dropped (sort kept, page reset).
    const withoutFilters = new URLSearchParams();
    if (term) withoutFilters.set('q', term);
    const sort = params.get('sort');
    if (sort) withoutFilters.set('sort', sort);
    const withoutFiltersQuery = withoutFilters.toString();

    return (
        <Empty className="border border-dashed py-12">
            <EmptyHeader>
                <EmptyMedia variant="icon">
                    <SearchX />
                </EmptyMedia>
                <EmptyTitle>
                    {term ? t('noResultsTitle', {query: term}) : hasFilters ? t('noResultsFilteredTitle') : t('noProducts')}
                </EmptyTitle>
                <EmptyDescription>
                    {hasFilters ? t('noResultsFilteredDescription') : t('noResultsDescription')}
                </EmptyDescription>
            </EmptyHeader>
            <EmptyContent className="flex-row flex-wrap justify-center">
                {hasFilters && (
                    <Button nativeButton={false} render={<Link href={`/search${withoutFiltersQuery ? `?${withoutFiltersQuery}` : ''}`} />}>
                        {t('clearFilters')}
                    </Button>
                )}
                {term && (
                    <Button nativeButton={false} render={<Link href="/search" />} variant={hasFilters ? 'outline' : 'default'}>
                        {t('browseAll')}
                    </Button>
                )}
            </EmptyContent>
        </Empty>
    );
}
