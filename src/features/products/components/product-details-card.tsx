'use client';

import {useEffect, useRef, useState} from 'react';
import {useTranslations} from 'next-intl';
import {ChevronDown} from 'lucide-react';
import {cn} from '@/lib/utils';
import type {ProductAttribute} from '@/features/products/product-attributes';

/** Collapsed height of the card body before "Read more". */
const COLLAPSED_HEIGHT = 230;

interface ProductDetailsCardProps {
    attributes: ProductAttribute[];
    descriptionHtml: string;
}

/**
 * "Product Information" (label/value rows from real Vendure facets + SKU)
 * and "Product Description" in one card, collapsed to 230px with a fade and a
 * Read more toggle when the content is taller.
 */
export function ProductDetailsCard({attributes, descriptionHtml}: ProductDetailsCardProps) {
    const t = useTranslations('Product');
    const contentRef = useRef<HTMLDivElement>(null);
    const [expanded, setExpanded] = useState(false);
    const [overflows, setOverflows] = useState(false);
    const [fullHeight, setFullHeight] = useState<number>();

    useEffect(() => {
        const el = contentRef.current;
        if (!el) return;
        const measure = () => {
            setFullHeight(el.scrollHeight);
            setOverflows(el.scrollHeight > COLLAPSED_HEIGHT);
        };
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    if (attributes.length === 0 && !descriptionHtml) return null;

    // Starts collapsed (also in the static HTML) so nothing jumps on hydration;
    // short content simply never reaches the cap.
    const collapsed = overflows && !expanded;

    return (
        <section className="rounded-2xl border border-gold/30 bg-card p-5 sm:p-6">
            <div
                className="relative overflow-hidden transition-[max-height] duration-500 ease-in-out"
                style={{maxHeight: expanded ? fullHeight ?? 'none' : COLLAPSED_HEIGHT}}
            >
                <div ref={contentRef} className="space-y-6">
                    {attributes.length > 0 && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold text-foreground">{t('details.information')}</h2>
                            <dl className="divide-y divide-gold/20">
                                {attributes.map(({label, value}) => (
                                    <div key={label} className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4 py-2.5 text-sm">
                                        <dt className="text-muted-foreground">{label}</dt>
                                        <dd className="font-semibold text-foreground">{value}</dd>
                                    </div>
                                ))}
                            </dl>
                        </div>
                    )}

                    {descriptionHtml && (
                        <div className="space-y-3">
                            <h2 className="text-xl font-semibold text-foreground">{t('details.description')}</h2>
                            {/* Vendure rich text; no typography plugin, so style its tags directly. */}
                            <div
                                className="text-sm leading-relaxed text-muted-foreground [&_b]:text-foreground [&_li]:mb-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-3 [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:pl-5 [&_li::marker]:text-gold"
                                dangerouslySetInnerHTML={{__html: descriptionHtml}}
                            />
                        </div>
                    )}
                </div>

                {collapsed && (
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-card to-transparent" aria-hidden="true" />
                )}
            </div>

            {overflows && (
                <button
                    type="button"
                    onClick={() => setExpanded((value) => !value)}
                    aria-expanded={expanded}
                    className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline underline-offset-4"
                >
                    {expanded ? t('details.showLess') : t('details.readMore')}
                    <ChevronDown className={cn('size-4 transition-transform duration-300', expanded && 'rotate-180')} />
                </button>
            )}
        </section>
    );
}
