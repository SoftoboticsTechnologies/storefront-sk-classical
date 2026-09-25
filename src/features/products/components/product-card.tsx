import Image from 'next/image';
import {FragmentOf, readFragment} from '@/platform/vendure/graphql';
import {ProductCardFragment} from '@/features/products/graphql';
import {ProductCardPrice} from '@/features/products/product-price-client';
import { Link } from '@/platform/i18n/navigation';
import {useTranslations} from 'next-intl';

interface ProductCardProps {
    product: FragmentOf<typeof ProductCardFragment>;
    preload?: boolean;
}

export function ProductCard({product: productProp, preload}: ProductCardProps) {
    const t = useTranslations('Product');
    const product = readFragment(ProductCardFragment, productProp);
    const priceWithTax = product.priceWithTax;
    const initialPrice = priceWithTax
        ? priceWithTax.__typename === 'PriceRange'
            ? {min: priceWithTax.min, max: priceWithTax.max, currencyCode: product.currencyCode}
            : {min: priceWithTax.value, max: priceWithTax.value, currencyCode: product.currencyCode}
        : undefined;

    return (
        <Link
            href={`/product/${product.slug}`}
            // Next.js 16's default Link prefetch (client segment cache) requests
            // RSC payload paths that don't match what static export writes to
            // disk for this route family — a confirmed upstream bug affecting
            // the optional catch-all `[[...variant]]` product route
            // (vercel/next.js#85374, #92341). It's cosmetic (404 network noise,
            // App Router falls back to a full navigation), but disabling
            // prefetch here avoids it outright. Revisit once Next ships a fix.
            prefetch={false}
            className="group block bg-card rounded-xl overflow-hidden border border-border hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
        >
            <div className="aspect-square relative bg-muted overflow-hidden">
                {product.productAsset ? (
                    <Image
                        src={product.productAsset.preview}
                        alt={product.productName}
                        fill
                        preload={preload}
                        className="object-cover group-hover:scale-105 group-hover:opacity-90 transition-all duration-500"
                        sizes="(max-width: 640px) calc(100vw - 2rem), (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        {t('noImage')}
                    </div>
                )}
            </div>
            <div className="p-4 space-y-2">
                <h3 className="font-medium leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                    {product.productName}
                </h3>
                <p className="text-lg font-bold tracking-tight">
                    <ProductCardPrice slug={product.slug} initial={initialPrice} />
                </p>
            </div>
        </Link>
    );
}
