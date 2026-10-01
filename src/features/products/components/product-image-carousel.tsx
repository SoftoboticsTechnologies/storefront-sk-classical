'use client';

import {useRef, useState} from 'react';
import Image from 'next/image';
import {useTranslations} from 'next-intl';
import {ChevronLeft, ChevronRight} from 'lucide-react';
import {cn} from '@/lib/utils';

interface ProductImageCarouselProps {
    name: string;
    images: Array<{
        id: string;
        preview: string;
        source: string;
    }>;
}

/** Horizontal swipe distance (px) that counts as a slide change on touch. */
const SWIPE_THRESHOLD = 40;

/**
 * Product gallery: a vertical thumbnail rail beside the main image on
 * desktop, a horizontal rail plus dots under it on mobile. Photos are always
 * `object-contain`ed on white so the whole product shows, never cropped.
 */
export function ProductImageCarousel({name, images}: ProductImageCarouselProps) {
    const t = useTranslations('Product');
    const [currentIndex, setCurrentIndex] = useState(0);
    const touchStartX = useRef<number | null>(null);

    if (!images || images.length === 0) {
        return (
            <div className="aspect-square rounded-2xl bg-secondary ring-1 ring-gold/30 flex items-center justify-center">
                <span className="text-muted-foreground">{t('noImage')}</span>
            </div>
        );
    }

    const count = images.length;
    const go = (delta: number) => setCurrentIndex((i) => (i + delta + count) % count);
    const current = images[currentIndex];

    return (
        <div className="relative flex flex-col lg:block lg:pl-24">
            {/* Thumbnail rail: vertical on desktop (scrolls if it outgrows the main image), horizontal on mobile. */}
            {count > 1 && (
                <div className="order-2 mt-3 flex gap-2 overflow-x-auto pb-1 lg:absolute lg:inset-y-0 lg:left-0 lg:mt-0 lg:w-20 lg:flex-col lg:overflow-y-auto lg:overflow-x-visible lg:pb-0 [scrollbar-width:thin]">
                    {images.map((image, index) => (
                        <button
                            key={image.id}
                            type="button"
                            onClick={() => setCurrentIndex(index)}
                            aria-label={`${name} ${index + 1}`}
                            aria-current={index === currentIndex}
                            className={cn(
                                'relative size-16 lg:size-20 shrink-0 overflow-hidden rounded-lg bg-white p-1 transition-all duration-200 active:scale-105',
                                index === currentIndex
                                    ? 'ring-2 ring-primary'
                                    : 'ring-1 ring-gold/30 opacity-70 hover:opacity-100 hover:ring-gold'
                            )}
                        >
                            <span className="relative block size-full">
                                <Image src={image.preview} alt="" fill className="object-contain" sizes="80px" />
                            </span>
                        </button>
                    ))}
                </div>
            )}

            {/* Main image */}
            <div
                className="group relative aspect-square overflow-hidden rounded-2xl bg-white ring-1 ring-gold/30 order-1"
                onTouchStart={(event) => {
                    touchStartX.current = event.touches[0]?.clientX ?? null;
                }}
                onTouchEnd={(event) => {
                    const start = touchStartX.current;
                    const end = event.changedTouches[0]?.clientX;
                    touchStartX.current = null;
                    if (start == null || end == null || count < 2) return;
                    const delta = end - start;
                    if (Math.abs(delta) >= SWIPE_THRESHOLD) go(delta < 0 ? 1 : -1);
                }}
            >
                <Image
                    key={current.id}
                    src={current.source}
                    alt={currentIndex === 0 ? name : `${name} ${currentIndex + 1}`}
                    fill
                    className="animate-fade-in object-contain p-4 sm:p-6"
                    sizes="(max-width: 1024px) 100vw, 55vw"
                    priority={currentIndex === 0}
                />

                {count > 1 && (
                    <>
                        <button
                            type="button"
                            aria-label={t('previousImage')}
                            onClick={() => go(-1)}
                            className="absolute left-3 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-background/90 text-foreground shadow-md ring-1 ring-gold/40 transition-all hover:bg-background hover:ring-gold lg:opacity-0 lg:group-hover:opacity-100 focus-visible:opacity-100"
                        >
                            <ChevronLeft className="size-5" />
                        </button>
                        <button
                            type="button"
                            aria-label={t('nextImage')}
                            onClick={() => go(1)}
                            className="absolute right-3 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-background/90 text-foreground shadow-md ring-1 ring-gold/40 transition-all hover:bg-background hover:ring-gold lg:opacity-0 lg:group-hover:opacity-100 focus-visible:opacity-100"
                        >
                            <ChevronRight className="size-5" />
                        </button>

                        {/* Dots (mobile) / counter (desktop) */}
                        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 lg:hidden" aria-hidden="true">
                            {images.map((image, index) => (
                                <span
                                    key={image.id}
                                    className={cn(
                                        'h-1.5 rounded-full transition-all duration-300',
                                        index === currentIndex ? 'w-5 bg-primary' : 'w-1.5 bg-primary/30'
                                    )}
                                />
                            ))}
                        </div>
                        <div className="absolute bottom-3 right-3 hidden rounded-full bg-background/90 px-2.5 py-1 text-xs font-medium ring-1 ring-gold/30 lg:block">
                            {currentIndex + 1} / {count}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
