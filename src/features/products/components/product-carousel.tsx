'use client';

import {ProductCard} from "@/features/products/components/product-card";
import type {ReactNode} from "react";
import {Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious,} from "@/components/ui/carousel";
import {FragmentOf, readFragment} from "@/platform/vendure/graphql";
import {ProductCardFragment} from '@/features/products/graphql';

interface ProductCarouselClientProps {
    title: string;
    products: Array<FragmentOf<typeof ProductCardFragment>>;
    preloadFirstProduct?: boolean;
    /** Rendered at the right of the heading row, e.g. a "View all" link. */
    action?: ReactNode;
}

export function ProductCarousel({title, products, preloadFirstProduct, action}: ProductCarouselClientProps) {
    return (
        <section className="py-12 md:py-16">
            <div className="container mx-auto px-4">
                <div className="mb-8 flex items-end justify-between gap-4">
                    <h2 className="text-3xl md:text-4xl font-bold">{title}</h2>
                    {action && <div className="shrink-0 pb-1">{action}</div>}
                </div>
                <Carousel
                    opts={{
                        align: "start",
                        loop: true,
                    }}
                    className="w-full"
                >
                    <CarouselContent className="-ml-3 md:-ml-4">
                        {products.map((product, index) => (
                            <CarouselItem key={readFragment(ProductCardFragment, product).productId}
                                          className="pl-3 md:pl-4 basis-1/2 md:basis-1/3 xl:basis-1/4">
                                <ProductCard product={product} preload={preloadFirstProduct && index === 0}/>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                    {/* Inside the edges: the shadcn default (-left/-right-12) sits past the
                        viewport whenever the carousel spans the full container, causing
                        horizontal page scroll. */}
                    <CarouselPrevious className="hidden md:flex left-2 bg-background/90 shadow-md"/>
                    <CarouselNext className="hidden md:flex right-2 bg-background/90 shadow-md"/>
                </Carousel>
            </div>
        </section>
    );
}
