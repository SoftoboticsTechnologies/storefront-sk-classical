'use client';

import {useCallback, useEffect, useRef, useState} from 'react';
import Image from 'next/image';
import {useTranslations} from 'next-intl';
import {ChevronLeft, ChevronRight} from 'lucide-react';
import {query} from '@/platform/vendure/client-api';
import {GetProductAssetsQuery} from '@/features/products/graphql';

/** How long each image shows while the card is hovered. */
const SLIDE_INTERVAL_MS = 1700;

/** Width/height below which a photo counts as portrait and fills the whole arch. */
const PORTRAIT_RATIO = 0.9;

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

// Backdrop fill per image URL, so the frame behind a contained photo matches
// the photo's own background. `null` = couldn't sample (e.g. the asset host
// sends no CORS header) — the frame keeps its default white.
const backdropCache = new Map<string, Promise<string | null>>();

/** Sampling grid; edge bands skip the outermost pixels (JPEG edge lines). */
const SAMPLE = 100;
const EDGE_FROM = 2;
const EDGE_TO = 6;

/** Per-channel median of the opaque pixels at the given coordinates. */
function medianColor(data: Uint8ClampedArray, points: Array<[number, number]>): string | null {
    const channels: number[][] = [[], [], []];
    for (const [x, y] of points) {
        const o = (y * SAMPLE + x) * 4;
        if (data[o + 3] < 128) continue; // transparent PNG edge
        channels[0].push(data[o]);
        channels[1].push(data[o + 1]);
        channels[2].push(data[o + 2]);
    }
    if (channels[0].length === 0) return null;
    const [r, g, b] = channels.map((values) => values.sort((a, z) => a - z)[values.length >> 1]);
    return `rgb(${r} ${g} ${b})`;
}

function loadBackdropColor(url: string): Promise<string | null> {
    let pending = backdropCache.get(url);
    if (!pending) {
        pending = new Promise((resolve) => {
            const img = new window.Image();
            img.crossOrigin = 'anonymous';
            img.decoding = 'async';
            img.onload = () => {
                try {
                    const canvas = document.createElement('canvas');
                    canvas.width = SAMPLE;
                    canvas.height = SAMPLE;
                    const ctx = canvas.getContext('2d', {willReadFrequently: true});
                    if (!ctx) return resolve(null);
                    ctx.drawImage(img, 0, 0, SAMPLE, SAMPLE);
                    const {data} = ctx.getImageData(0, 0, SAMPLE, SAMPLE);

                    const rows = (y0: number, y1: number) => {
                        const pts: Array<[number, number]> = [];
                        for (let y = y0; y < y1; y++) for (let x = EDGE_FROM; x < SAMPLE - EDGE_FROM; x++) pts.push([x, y]);
                        return pts;
                    };
                    const sides = (y0: number, y1: number) => {
                        const pts: Array<[number, number]> = [];
                        for (let y = y0; y < y1; y++) {
                            for (let x = EDGE_FROM; x < EDGE_TO; x++) pts.push([x, y], [SAMPLE - 1 - x, y]);
                        }
                        return pts;
                    };

                    // Photo backdrops are often a soft vertical gradient (studio
                    // light/shadow), so sample top, middle and bottom separately.
                    const top = medianColor(data, rows(EDGE_FROM, EDGE_TO));
                    const middle = medianColor(data, sides(35, 65));
                    const bottom = medianColor(data, rows(SAMPLE - EDGE_TO, SAMPLE - EDGE_FROM));
                    if (!top || !middle || !bottom) return resolve(null);

                    // Stops line up with the photo box in the 4:5 frame (see
                    // product-card.tsx): its top sits at ~28% and bottom at ~97%.
                    resolve(`linear-gradient(to bottom, ${top} 0%, ${top} 28%, ${middle} 62%, ${bottom} 97%)`);
                } catch {
                    resolve(null); // tainted canvas
                }
            };
            img.onerror = () => resolve(null);
            img.src = url;
        });
        backdropCache.set(url, pending);
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
    const currentUrl = images[index] ?? imageUrl;
    const [backdrops, setBackdrops] = useState<Record<string, string | null>>({});
    const [portrait, setPortrait] = useState<Record<string, boolean>>({});

    useEffect(() => {
        let cancelled = false;
        loadBackdropColor(currentUrl).then((fill) => {
            if (!cancelled) setBackdrops((prev) => (currentUrl in prev ? prev : {...prev, [currentUrl]: fill}));
        });
        return () => {
            cancelled = true;
        };
    }, [currentUrl]);

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
            {/* Fill the arch with each photo's own backdrop, cross-fading with the photo. */}
            {images.map((url, i) =>
                backdrops[url] ? (
                    <div
                        key={url}
                        aria-hidden="true"
                        className={`absolute inset-0 transition-opacity duration-500 ${
                            i === index ? 'opacity-100' : 'opacity-0'
                        }`}
                        style={{backgroundImage: backdrops[url]!}}
                    />
                ) : null
            )}
            {images.map((url, i) => (
                // Square/landscape photos sit uncropped in the square photo box (see the
                // arch geometry note in product-card.tsx). Portrait photos (people,
                // sarees) would look tiny there, so they cover the whole arch instead.
                <div
                    key={url}
                    className={
                        portrait[url]
                            ? 'absolute inset-0'
                            : 'absolute inset-x-[7%] bottom-[4%] aspect-square'
                    }
                >
                    <Image
                        src={url}
                        alt={i === 0 ? name : ''}
                        aria-hidden={i === index ? undefined : true}
                        fill
                        preload={i === 0 ? preload : undefined}
                        onLoad={(event) => {
                            const {naturalWidth: w, naturalHeight: h} = event.currentTarget;
                            const isPortrait = h > 0 && w / h < PORTRAIT_RATIO;
                            setPortrait((prev) => (prev[url] === isPortrait ? prev : {...prev, [url]: isPortrait}));
                        }}
                        className={`${portrait[url] ? 'object-cover object-center' :'object-contain object-center'} transition-[opacity,transform] duration-500 group-hover:scale-[1.03] ${
                            i === index ? 'opacity-100' : 'opacity-0'
                        }`}
                        sizes={sizes}
                    />
                </div>
            ))}

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
