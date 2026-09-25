'use client';


import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {usePathname, useRouter} from '@/platform/i18n/navigation';
import {useTranslations} from 'next-intl';

interface SortDropdownProps {
    /**
     * Current URL search params, as a string — passed down rather than read
     * via next/navigation's useSearchParams() here, which would de-opt this
     * component (and its whole Suspense boundary) to client-side-only
     * rendering under static export. See search-params-sync.tsx.
     */
    searchParamsString: string;
}

export function SortDropdown({searchParamsString}: SortDropdownProps) {
    const t = useTranslations('Sort');
    const pathname = usePathname();
    const router = useRouter();

    const sortOptions = [
        {value: 'name-asc', label: t('nameAsc')},
        {value: 'name-desc', label: t('nameDesc')},
        {value: 'price-asc', label: t('priceAsc')},
        {value: 'price-desc', label: t('priceDesc')},
    ];

    const currentSort = new URLSearchParams(searchParamsString).get('sort') || 'name-asc';

    const handleSortChange = (value: string | null) => {
        if (!value) return;
        // Read the live URL rather than the searchParamsString prop, which
        // can lag one render behind a filter just applied (see facet-filters.tsx).
        const params = new URLSearchParams(window.location.search);
        params.set('sort', value);
        params.delete('page'); // Reset to page 1 when sort changes
        router.push(`${pathname}?${params.toString()}`);
    };

    return (
        <Select value={currentSort} onValueChange={handleSortChange} items={sortOptions}>
            <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t('placeholder')}/>
            </SelectTrigger>
            <SelectContent>
                {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                        {option.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
