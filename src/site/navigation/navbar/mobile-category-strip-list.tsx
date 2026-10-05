'use client';

import {useCallback, useEffect, useRef, useState} from 'react';
import {Link, usePathname} from '@/platform/i18n/navigation';
import {cn} from '@/lib/utils';

export interface CategoryStripItem {
    key: string;
    href: string;
    label: string;
}

interface MobileCategoryStripListProps {
    items: CategoryStripItem[];
    label: string;
}

export function isCategoryActive(pathname: string, href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Horizontally scrollable chip row. Edges fade only on the side that still has
 * hidden chips, and the active chip is scrolled into view on navigation.
 */
export function MobileCategoryStripList({items, label}: MobileCategoryStripListProps) {
    const pathname = usePathname();
    const listRef = useRef<HTMLUListElement>(null);
    const [edges, setEdges] = useState({start: false, end: false});

    const updateEdges = useCallback(() => {
        const el = listRef.current;
        if (!el) return;
        setEdges({
            start: el.scrollLeft > 4,
            end: el.scrollLeft + el.clientWidth < el.scrollWidth - 4,
        });
    }, []);

    useEffect(() => {
        const el = listRef.current;
        if (!el) return;
        updateEdges();
        const observer = new ResizeObserver(updateEdges);
        observer.observe(el);
        return () => observer.disconnect();
    }, [updateEdges]);

    useEffect(() => {
        const active = listRef.current?.querySelector<HTMLElement>('[aria-current="page"]');
        active?.scrollIntoView({block: 'nearest', inline: 'center', behavior: 'smooth'});
    }, [pathname]);

    const maskStart = edges.start ? 'transparent 0, black 20px' : 'black 0';
    const maskEnd = edges.end ? 'black calc(100% - 28px), transparent 100%' : 'black 100%';

    return (
        <nav aria-label={label} className="min-w-0 flex-1">
            <ul
                ref={listRef}
                onScroll={updateEdges}
                style={{
                    maskImage: `linear-gradient(to right, ${maskStart}, ${maskEnd})`,
                    WebkitMaskImage: `linear-gradient(to right, ${maskStart}, ${maskEnd})`,
                }}
                className="flex snap-x snap-proximity items-center gap-1.5 overflow-x-auto overscroll-x-contain scroll-px-1 px-1 py-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
                {items.map((item) => {
                    const active = isCategoryActive(pathname, item.href);
                    return (
                        <li key={item.key} className="shrink-0 snap-start">
                            <Link
                                href={item.href}
                                aria-current={active ? 'page' : undefined}
                                className={cn(
                                    'inline-flex h-8 items-center whitespace-nowrap rounded-full border px-3 text-[11px] font-semibold uppercase tracking-[0.08em] transition-colors active:scale-[0.97]',
                                    active
                                        ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                                        : 'border-gold/40 bg-background/60 text-foreground/85 hover:border-primary hover:text-primary',
                                )}
                            >
                                {item.label}
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
