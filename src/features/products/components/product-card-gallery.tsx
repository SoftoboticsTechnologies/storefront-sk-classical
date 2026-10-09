'use client';

import {useCallback, useEffect, useRef, useState} from 'react';
import Image from 'next/image';
import {useTranslations} from 'next-intl';
import {ChevronLeft, ChevronRight} from 'lucide-react';
import {query} from '@/platform/vendure/client-api';
import {GetProductAssetsQuery} from '@/features/products/graphql';
import {
    PORTRAIT_RATIO,
    computeFraming,
    detectProductBounds,
    getSquareZoom,
    isFramingExcluded,
    type Framing,
    type ProductBounds,
    type Rgb,
    type SquareZoom,
} from '@/features/products/image-framing';

// Literal classes per zoom level (Tailwind only generates classes it finds in source).
const SQUARE_ZOOM_CLASSES: Record<SquareZoom, string> = {
    1.15: 'scale-[1.15] group-hover:scale-[1.19]',
    1.22: 'scale-[1.22] group-hover:scale-[1.26]',
    1.25: 'scale-[1.25] group-hover:scale-[1.29]',
    1.3: 'scale-[1.3] group-hover:scale-[1.34]',
};

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

// Per image URL: the photo's backdrop colours (so the frame behind a contained
// photo matches its own background) and where the product sits in it (for
// auto-framing, see image-framing.ts). `null` = couldn't sample (e.g. the asset
// host sends no CORS header) — the frame keeps its default white and layout.
interface ImageAnalysis {
    backdrop: {top: Rgb; middle: Rgb; bottom: Rgb};
    bounds: ProductBounds | null;
    aspect: number;
}
const analysisCache = new Map<string, Promise<ImageAnalysis | null>>();

/** Sampling grid; edge bands skip the outermost pixels (JPEG edge lines). */
const SAMPLE = 100;
const EDGE_FROM = 2;
const EDGE_TO = 6;

/** Per-channel median of the opaque pixels at the given coordinates. */
function medianColor(data: Uint8ClampedArray, points: Array<[number, number]>): Rgb | null {
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
    return [r, g, b];
}

const rgb = ([r, g, b]: Rgb) => `rgb(${r} ${g} ${b})`;

/**
 * Backdrop gradient whose stops line up with where the photo sits in the 4:5
 * frame: by default (see product-card.tsx) its top is at ~28% and bottom ~97%;
 * an auto-framed photo passes its own placement.
 */
function backdropGradient({top, middle, bottom}: ImageAnalysis['backdrop'], framing: Framing | null) {
    const start = framing ? Math.max(0, framing.top) : 28;
    const end = framing ? Math.min(100, framing.top + framing.height) : 97;
    const mid = framing ? (start + end) / 2 : 62;
    return `linear-gradient(to bottom, ${rgb(top)} 0%, ${rgb(top)} ${start}%, ${rgb(middle)} ${mid}%, ${rgb(bottom)} ${end}%)`;
}

function loadImageAnalysis(url: string): Promise<ImageAnalysis | null> {
    let pending = analysisCache.get(url);
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

                    const backdrop = {top, middle, bottom};
                    resolve({
                        backdrop,
                        bounds: detectProductBounds(data, SAMPLE, backdrop),
                        aspect: img.naturalHeight > 0 ? img.naturalWidth / img.naturalHeight : 1,
                    });
                } catch {
                    resolve(null); // tainted canvas
                }
            };
            img.onerror = () => resolve(null);
            img.src = url;
        });
        analysisCache.set(url, pending);
    }
    return pending;
}

interface ProductCardGalleryProps {
    /** Vendure product ID — used (with the slug) to honour auto-framing exclusions. */
    productId?: string;
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
export function ProductCardGallery({productId, slug, name, imageUrl, preload, sizes}: ProductCardGalleryProps) {
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
    const [analyses, setAnalyses] = useState<Record<string, ImageAnalysis | null>>({});
    const [portrait, setPortrait] = useState<Record<string, boolean>>({});
    const framingExcluded = isFramingExcluded(productId, slug);
    const squareZoom = SQUARE_ZOOM_CLASSES[getSquareZoom(productId, slug)];

    useEffect(() => {
        let cancelled = false;
        loadImageAnalysis(currentUrl).then((analysis) => {
            if (!cancelled) setAnalyses((prev) => (currentUrl in prev ? prev : {...prev, [currentUrl]: analysis}));
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

    // Auto-framed placement per image; null = default layout (see image-framing.ts).
    const framingFor = (url: string): Framing | null => {
        const analysis = analyses[url];
        if (framingExcluded || !analysis?.bounds) return null;
        return computeFraming(analysis.bounds, analysis.aspect);
    };

    return (
        <div ref={rootRef} className="absolute inset-0">
            {/* Fill the arch with each photo's own backdrop, cross-fading with the photo. */}
            {images.map((url, i) =>
                analyses[url] ? (
                    <div
                        key={url}
                        aria-hidden="true"
                        className={`absolute inset-0 transition-opacity duration-500 ${
                            i === index ? 'opacity-100' : 'opacity-0'
                        }`}
                        style={{backgroundImage: backdropGradient(analyses[url]!.backdrop, framingFor(url))}}
                    />
                ) : null
            )}
            {images.map((url, i) => {
                const framing = framingFor(url);
                return (
                    // Auto-framed photos are placed so the product fills the arch (see
                    // image-framing.ts). Otherwise square/landscape photos sit uncropped in
                    // the square photo box (see the arch geometry note in product-card.tsx),
                    // and portrait photos (people, sarees) cover the whole arch instead.
                    <div
                        key={url}
                        className={
                            framing
                                ? 'absolute'
                                : portrait[url]
                                  ? 'absolute inset-0'
                                  : 'absolute inset-x-[7%] bottom-[4%] aspect-square'
                        }
                        style={
                            framing
                                ? {left: `${framing.left}%`, top: `${framing.top}%`, width: `${framing.width}%`, height: `${framing.height}%`}
                                : undefined
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
                            // Square photos are zoomed in a little so the product fills more of
                            // the card; any overflow is clipped by the arch, over the matching backdrop.
                            className={`${framing ? 'object-contain object-center group-hover:scale-[1.03] transition-[opacity,transform,scale]' : portrait[url] ? 'object-cover object-center group-hover:scale-[1.03] transition-[opacity,transform]' : `object-contain object-center ${squareZoom} transition-[opacity,transform]`} duration-500 ${
                                i === index ? 'opacity-100' : 'opacity-0'
                            }`}
                            sizes={sizes}
                        />
                    </div>
                );
            })}

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
