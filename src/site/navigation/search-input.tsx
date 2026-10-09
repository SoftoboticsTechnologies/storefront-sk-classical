'use client';

import {useEffect, useState} from 'react';
import {Search} from 'lucide-react';
import {useTranslations} from 'next-intl';
import {SearchOverlay} from '@/site/navigation/navbar/search-overlay';

function isTypingTarget(target: EventTarget | null) {
    if (!(target instanceof HTMLElement)) return false;
    return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
}

export function SearchInput() {
    const t = useTranslations('Navigation');
    const [open, setOpen] = useState(false);

    // Ctrl/⌘+K anywhere, or "/" when not already typing in a field.
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((prev) => !prev);
            } else if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey && !isTypingTarget(e.target)) {
                e.preventDefault();
                setOpen(true);
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, []);

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                aria-label={t('searchProducts')}
                aria-keyshortcuts="Control+K Meta+K /"
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
