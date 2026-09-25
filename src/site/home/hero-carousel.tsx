"use client";

import {useCallback, useEffect, useState} from "react";
import Image from "next/image";
import {ChevronLeft, ChevronRight} from "lucide-react";
import {Link} from '@/platform/i18n/navigation';
import {Carousel, CarouselContent, CarouselItem, type CarouselApi} from "@/components/ui/carousel";
import {cn} from "@/lib/utils";

const AUTOPLAY_MS = 4500;

export interface HeroSlide {
    src: string;
    alt: string;
    href: string;
    /** Accessible label for this slide's pagination dot, e.g. "Go to slide 2". */
    dotLabel: string;
}

interface HeroCarouselProps {
    slides: HeroSlide[];
    labels: {region: string; previous: string; next: string};
}

export function HeroCarousel({slides, labels}: HeroCarouselProps) {
    const [api, setApi] = useState<CarouselApi>();
    const [selected, setSelected] = useState(0);
    const [paused, setPaused] = useState(false);

    useEffect(() => {
        if (!api) return;
        const onSelect = () => setSelected(api.selectedScrollSnap());
        onSelect();
        api.on("select", onSelect);
        return () => {
            api.off("select", onSelect);
        };
    }, [api]);

    // One timer per slide: keying on `selected` restarts the countdown after any
    // change (auto or manual), so every slide gets the full interval.
    useEffect(() => {
        if (!api || paused || slides.length < 2) return;
        // Reduced-motion users still advance, but jump instead of sliding.
        const jump = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const id = window.setTimeout(() => api.scrollNext(jump), AUTOPLAY_MS);
        return () => window.clearTimeout(id);
    }, [api, paused, selected, slides.length]);

    const scrollTo = useCallback((index: number) => api?.scrollTo(index), [api]);

    return (
        <section
            aria-roledescription="carousel"
            aria-label={labels.region}
            className="relative bg-foreground"
            // Keeps rotating under the mouse; only keyboard focus pauses it.
            onFocusCapture={() => setPaused(true)}
            onBlurCapture={() => setPaused(false)}
        >
            <Carousel setApi={setApi} opts={{loop: true}}>
                <CarouselContent className="ml-0">
                    {slides.map((slide, index) => (
                        <CarouselItem key={slide.src} className="pl-0">
                            <Link
                                href={slide.href}
                                // See product-card.tsx: default prefetch hits a Next.js 16
                                // static-export bug (vercel/next.js#85374).
                                prefetch={false}
                                className="relative block aspect-16/9 max-h-[calc(100svh-8rem)] w-full"
                            >
                                <Image
                                    src={slide.src}
                                    alt={slide.alt}
                                    fill
                                    priority={index === 0}
                                    sizes="100vw"
                                    className="object-cover"
                                />
                            </Link>
                        </CarouselItem>
                    ))}
                </CarouselContent>
            </Carousel>

            {slides.length > 1 && (
                <>
                    <button
                        type="button"
                        onClick={() => api?.scrollPrev()}
                        aria-label={labels.previous}
                        className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 hidden sm:flex size-11 items-center justify-center rounded-full border border-gold/60 bg-black/25 text-white backdrop-blur-sm transition hover:bg-black/45"
                    >
                        <ChevronLeft className="size-5" />
                    </button>
                    <button
                        type="button"
                        onClick={() => api?.scrollNext()}
                        aria-label={labels.next}
                        className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 hidden sm:flex size-11 items-center justify-center rounded-full border border-gold/60 bg-black/25 text-white backdrop-blur-sm transition hover:bg-black/45"
                    >
                        <ChevronRight className="size-5" />
                    </button>
                    <div className="absolute bottom-3 md:bottom-5 left-1/2 -translate-x-1/2 flex gap-2">
                        {slides.map((slide, index) => (
                            <button
                                key={slide.src}
                                type="button"
                                onClick={() => scrollTo(index)}
                                aria-label={slide.dotLabel}
                                aria-current={index === selected}
                                className={cn(
                                    "h-1.5 rounded-full transition-all",
                                    index === selected ? "w-8 bg-gold" : "w-3 bg-white/60 hover:bg-white",
                                )}
                            />
                        ))}
                    </div>
                </>
            )}
        </section>
    );
}
