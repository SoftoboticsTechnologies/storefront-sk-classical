'use client';

import {useState} from 'react';
import {Search} from 'lucide-react';
import {useTranslations} from 'next-intl';
import {SearchOverlay} from '@/site/navigation/navbar/search-overlay';

export function SearchInput() {
    const t = useTranslations('Navigation');
    const [open, setOpen] = useState(false);

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="relative flex w-64 items-center rounded-md border border-input bg-transparent px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent"
            >
                <Search className="mr-2 h-4 w-4 shrink-0" />
                <span className="truncate">{t('searchProducts')}</span>
            </button>
            <SearchOverlay open={open} onOpenChange={setOpen} />
        </>
    );
}
