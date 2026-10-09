'use client';

import {ProductCard} from "@/features/products/components/product-card";
import type {ReactNode} from "react";
import {Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, useCarousel,} from "@/components/ui/carousel";
import {FragmentOf, readFragment} from "@/platform/vendure/graphql";
import {ProductCardFragment} from '@/features/products/graphql';

interface ProductCarouselClientProps {
    title: string;
    products: Array<FragmentOf<typeof ProductCardFragment>>;
    preloadFirstProduct?: boolean;
    /** Rendered at the right of the heading row, e.g. a "View all" link. */
    action?: ReactNode;
}

/**
 * Prev/next sit in the heading row rather than over the cards, so they never
 * stack on a card's own image arrows (product-card-gallery.tsx). Hidden when
 * every product already fits and there is nothing to scroll.
 */
function CarouselNav() {
    const {canScrollPrev, canScrollNext} = useCarousel();
    if (!canScrollPrev && !canScrollNext) return null;

    return (
        <div className="hidden md:flex items-center gap-2">
            <CarouselPrevious className="static translate-y-0 bg-background shadow-sm"/>
            <CarouselNext className="static translate-y-0 bg-background shadow-sm"/>
        </div>
    );
}

export function ProductCarousel({title, products, preloadFirstProduct, action}: ProductCarouselClientProps) {
    return (
        <section className="py-12 md:py-16">
            <div className="container mx-auto px-4 md:px-6 lg:px-8">
                <Carousel
                    opts={{
                        align: "start",
                        loop: true,
                    }}
                    className="w-full"
                >
                    <div className="mb-8 flex items-end justify-between gap-4">
                        <h2 className="text-3xl md:text-4xl font-bold">{title}</h2>
                        <div className="flex shrink-0 items-center gap-4 pb-1">
                            {action}
                            <CarouselNav/>
                        </div>
                    </div>
                    <CarouselContent className="-ml-3 md:-ml-4">
                        {products.map((product, index) => (
                            <CarouselItem key={readFragment(ProductCardFragment, product).productId}
                                          className="pl-3 md:pl-4 basis-1/2 md:basis-1/3 xl:basis-1/4">
                                <ProductCard product={product} preload={preloadFirstProduct && index === 0}/>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                </Carousel>
            </div>
        </section>
    );
}
