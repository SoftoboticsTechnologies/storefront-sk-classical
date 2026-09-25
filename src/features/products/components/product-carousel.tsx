'use client';

import {ProductCard} from "@/features/products/components/product-card";
import {Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious,} from "@/components/ui/carousel";
import {FragmentOf, readFragment} from "@/platform/vendure/graphql";
import {ProductCardFragment} from '@/features/products/graphql';

interface ProductCarouselClientProps {
    title: string;
    products: Array<FragmentOf<typeof ProductCardFragment>>;
    preloadFirstProduct?: boolean;
}

export function ProductCarousel({title, products, preloadFirstProduct}: ProductCarouselClientProps) {
    return (
        <section className="py-12 md:py-16">
            <div className="container mx-auto px-4">
                <h2 className="text-3xl md:text-4xl font-bold mb-8">{title}</h2>
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
