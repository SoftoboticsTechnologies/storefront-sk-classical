'use client';

import { use, useMemo, useState } from 'react';
import { usePathname, useRouter } from '@/platform/i18n/navigation';
import { ResultOf } from '@/platform/vendure/graphql';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { SlidersHorizontal, ChevronDown } from 'lucide-react';
import {SearchProductsQuery} from '@/features/search/graphql';
import {useTranslations} from 'next-intl';

interface FacetFiltersProps {
    productDataPromise: Promise<{
        data: ResultOf<typeof SearchProductsQuery>;
        token?: string;
    }>;
    /**
     * Current URL search params, as a string — passed down rather than read
     * via next/navigation's useSearchParams() here, which would de-opt this
     * component (and its whole Suspense boundary) to client-side-only
     * rendering under static export. See search-params-sync.tsx.
     */
    searchParamsString: string;
}

function FilterContent({
    facetGroups,
    selectedFacetValues,
    toggleFacetValue,
    clearFilters,
    hasActiveFilters,
}: {
    facetGroups: Record<string, { id: string; name: string; values: Array<{ id: string; name: string; count: number }> }>;
    selectedFacetValues: string[];
    toggleFacetValue: (facetId: string, facetValueId: string) => void;
    clearFilters: () => void;
    hasActiveFilters: boolean;
}) {
    const t = useTranslations('Filters');
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="font-semibold text-lg">{t('title')}</h2>
                {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                        {t('clearAll')}
                    </Button>
                )}
            </div>

            {Object.entries(facetGroups).map(([facetName, facet]) => (
                <Collapsible key={facet.id} defaultOpen>
                    <div className="space-y-2">
                        <CollapsibleTrigger className="flex w-full items-center justify-between py-2 text-sm font-medium hover:text-foreground transition-colors">
                            {facetName}
                            <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform [[data-panel-open]_&]:rotate-180" />
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                            <div className="space-y-2 pb-2">
                                {facet.values.map((value) => {
                                    const isChecked = selectedFacetValues.includes(value.id);
                                    return (
                                        <div key={value.id} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`filter-${value.id}`}
                                                checked={isChecked}
                                                onCheckedChange={() => toggleFacetValue(facet.id, value.id)}
                                            />
                                            <Label
                                                htmlFor={`filter-${value.id}`}
                                                className="text-sm font-normal cursor-pointer flex items-center gap-2"
                                            >
                                                {value.name}
                                                <span className="text-xs text-muted-foreground">
                                                    ({value.count})
                                                </span>
                                            </Label>
                                        </div>
                                    );
                                })}
                            </div>
                        </CollapsibleContent>
                    </div>
                </Collapsible>
            ))}
        </div>
    );
}

export function FacetFilters({ productDataPromise, searchParamsString }: FacetFiltersProps) {
    const t = useTranslations('Filters');
    const result = use(productDataPromise);
    const searchResult = result.data.search;
    const pathname = usePathname();
    const searchParams = useMemo(() => new URLSearchParams(searchParamsString), [searchParamsString]);
    const router = useRouter();
    const [sheetOpen, setSheetOpen] = useState(false);

    // Group facet values by facet
    interface FacetGroup {
        id: string;
        name: string;
        values: Array<{ id: string; name: string; count: number }>;
    }

    const facetGroups = searchResult.facetValues.reduce((acc: Record<string, FacetGroup>, item) => {
        const facetName = item.facetValue.facet.name;
        if (!acc[facetName]) {
            acc[facetName] = {
                id: item.facetValue.facet.id,
                name: facetName,
                values: []
            };
        }
        acc[facetName].values.push({
            id: item.facetValue.id,
            name: item.facetValue.name,
            count: item.count
        });
        return acc;
    }, {});

    // URL stores entries as "<facetId>:<facetValueId>" so facetValueFilters can
    // OR values within the same facet and AND across different facets
    const facetEntries = searchParams.getAll('facets');
    const selectedFacetValues = facetEntries.map(entry => entry.split(':')[1]).filter(Boolean);

    const toggleFacetValue = (facetId: string, facetValueId: string) => {
        // Read the live URL rather than the (possibly one-render-stale)
        // searchParamsString prop, so a filter clicked right after a
        // previous one lands on top of it instead of racing/reverting it.
        const params = new URLSearchParams(window.location.search);
        const entry = `${facetId}:${facetValueId}`;
        const current = params.getAll('facets');

        params.delete('facets');
        if (current.includes(entry)) {
            current.filter(e => e !== entry).forEach(e => params.append('facets', e));
        } else {
            current.forEach(e => params.append('facets', e));
            params.append('facets', entry);
        }

        // Reset to page 1 when filters change
        params.delete('page');

        router.push(`${pathname}?${params.toString()}`);
        setSheetOpen(false);
    };

    const clearFilters = () => {
        const params = new URLSearchParams(window.location.search);
        params.delete('facets');
        params.delete('page');
        router.push(`${pathname}?${params.toString()}`);
        setSheetOpen(false);
    };

    const hasActiveFilters = selectedFacetValues.length > 0;

    if (Object.keys(facetGroups).length === 0) {
        return null;
    }

    const filterContentProps = {
        facetGroups,
        selectedFacetValues,
        toggleFacetValue,
        clearFilters,
        hasActiveFilters,
    };

    return (
        <>
            {/* Mobile: Sheet trigger */}
            <div className="lg:hidden">
                <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                    <SheetTrigger
                        render={
                            <Button variant="outline" className="w-full">
                                <SlidersHorizontal className="mr-2 h-4 w-4" />
                                {t('filtersButton')}
                                {hasActiveFilters && (
                                    <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                                        {selectedFacetValues.length}
                                    </span>
                                )}
                            </Button>
                        }
                    />
                    <SheetContent side="left" className="overflow-y-auto p-6">
                        <SheetHeader>
                            <SheetTitle>{t('title')}</SheetTitle>
                        </SheetHeader>
                        <div className="mt-4">
                            <FilterContent {...filterContentProps} />
                        </div>
                    </SheetContent>
                </Sheet>
            </div>

            {/* Desktop: Inline filters */}
            <div className="hidden lg:block">
                <FilterContent {...filterContentProps} />
            </div>
        </>
    );
}
