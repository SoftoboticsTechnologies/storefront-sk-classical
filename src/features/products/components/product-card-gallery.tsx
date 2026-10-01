'use client';

import {useCallback, useEffect, useRef, useState} from 'react';
import Image from 'next/image';
import {useTranslations} from 'next-intl';
import {ChevronLeft, ChevronRight} from 'lucide-react';
import {query} from '@/platform/vendure/client-api';
import {GetProductAssetsQuery} from '@/features/products/graphql';

/** How long each image shows while the card is hovered. */
const SLIDE_INTERVAL_MS = 1700;

// One request per product per page view, shared by every card showing it.
const assetCache = new Map<string, Promise<string[]>>();

function loadProductImages(slug: string): Promise<string[]> {
    let pending = assetCache.get(slug);
    if (!pending) {
        pending = query(GetProductAssetsQuery, {slug})
            .then((result) => (result.data.product?.assets ?? []).map((asset) => asset.preview))
            .catch(() => {
                assetCache.delete(slug);
                return [];
            });
        assetCache.set(slug, pending);
    }
    return pending;
}

interface ProductCardGalleryProps {
    slug: string;
    name: string;
    imageUrl: string;
    preload?: boolean;
    sizes: string;
}

/**
 * Product-card image with a hover slideshow. Shows the build-time
 * `productAsset` first; on the first hover of the card it fetches the
 * product's other images, then advances every 1.7s while hovered, with small
 * prev/next arrows. Leaving the card returns to the first image.
 *
 * Hover is tracked on the whole card (the enclosing link), not just the image.
 */
export function ProductCardGallery({slug, name, imageUrl, preload, sizes}: ProductCardGalleryProps) {
    const t = useTranslations('Product');
    const rootRef = useRef<HTMLDivElement>(null);
    const [images, setImages] = useState<string[]>([imageUrl]);
    const [index, setIndex] = useState(0);
    const [hovered, setHovered] = useState(false);
    // Bumped on manual navigation so the auto-advance timer restarts.
    const [timerKey, setTimerKey] = useState(0);

    useEffect(() => {
        const card = rootRef.current?.closest('a') ?? rootRef.current;
        if (!card) return;

        let cancelled = false;
        const onEnter = () => {
            setHovered(true);
            loadProductImages(slug).then((urls) => {
                if (cancelled || urls.length === 0) return;
                // Keep the card's own image first so the slideshow starts where it is.
                setImages([imageUrl, ...urls.filter((url) => url !== imageUrl)]);
            });
        };
        const onLeave = () => {
            setHovered(false);
            setIndex(0);
        };

        card.addEventListener('mouseenter', onEnter);
        card.addEventListener('mouseleave', onLeave);
        return () => {
            cancelled = true;
            card.removeEventListener('mouseenter', onEnter);
            card.removeEventListener('mouseleave', onLeave);
        };
    }, [slug, imageUrl]);

    const count = images.length;

    useEffect(() => {
        if (!hovered || count < 2) return;
        const id = window.setInterval(() => setIndex((i) => (i + 1) % count), SLIDE_INTERVAL_MS);
        return () => window.clearInterval(id);
    }, [hovered, count, timerKey]);

    const step = useCallback(
        (event: React.MouseEvent, delta: number) => {
            // The arrows sit inside the card link — don't navigate.
            event.preventDefault();
            event.stopPropagation();
            setIndex((i) => (i + delta + count) % count);
            setTimerKey((k) => k + 1);
        },
        [count]
    );

    return (
        <div ref={rootRef} className="absolute inset-0">
            {/* Square photo box: see the arch geometry note in product-card.tsx. */}
            <div className="absolute inset-x-[7%] bottom-[4%] aspect-square">
                {images.map((url, i) => (
                    <Image
                        key={url}
                        src={url}
                        alt={i === 0 ? name : ''}
                        aria-hidden={i === index ? undefined : true}
                        fill
                        preload={i === 0 ? preload : undefined}
                        className={`object-contain object-center transition-[opacity,transform] duration-500 group-hover:scale-[1.03] ${
                            i === index ? 'opacity-100' : 'opacity-0'
                        }`}
                        sizes={sizes}
                    />
                ))}
            </div>

            {count > 1 && (
                <>
                    <button
                        type="button"
                        aria-label={t('previousImage')}
                        onClick={(event) => step(event, -1)}
                        className="absolute left-1.5 top-[62%] z-10 flex size-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-foreground shadow-sm ring-1 ring-black/5 opacity-0 transition-opacity duration-200 hover:bg-white group-hover:opacity-100 focus-visible:opacity-100"
                    >
                        <ChevronLeft className="size-4" />
                    </button>
                    <button
                        type="button"
                        aria-label={t('nextImage')}
                        onClick={(event) => step(event, 1)}
                        className="absolute right-1.5 top-[62%] z-10 flex size-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-foreground shadow-sm ring-1 ring-black/5 opacity-0 transition-opacity duration-200 hover:bg-white group-hover:opacity-100 focus-visible:opacity-100"
                    >
                        <ChevronRight className="size-4" />
                    </button>
                </>
            )}
        </div>
    );
}
