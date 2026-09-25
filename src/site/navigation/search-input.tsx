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
                aria-label={t('searchProducts')}
                className="group flex h-10 md:h-11 w-full max-w-xl items-center gap-3 rounded-full bg-background pl-4 md:pl-5 pr-1 text-left text-sm text-muted-foreground shadow-[inset_0_1px_2px_rgb(0_0_0/0.08)] ring-1 ring-gold/50 transition hover:ring-2 hover:ring-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
                <span className="flex-1 truncate">{t('searchProducts')}</span>
                <span className="flex size-8 md:size-9 shrink-0 items-center justify-center rounded-full bg-gold text-gold-foreground transition-transform group-hover:scale-105">
                    <Search className="size-4" strokeWidth={2.25} />
                </span>
            </button>
            <SearchOverlay open={open} onOpenChange={setOpen} />
        </>
    );
}
