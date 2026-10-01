'use client';

import {useState, useTransition} from 'react';
import {CheckCircle2, ShoppingBag} from 'lucide-react';
import {useTranslations} from 'next-intl';
import {toast} from 'sonner';
import {Button} from '@/components/ui/button';
import {Link} from '@/platform/i18n/navigation';
import {addToCart} from '@/features/products/add-to-cart';

interface WishlistCartButtonProps {
    slug: string;
    name: string;
    variants: Array<{id: string; stockLevel: string}>;
}

/**
 * Wishlist card action. A single-variant product goes straight into the
 * ActiveOrder (same `addToCart` as the product page); a product with options
 * links to its page, since a variant has to be chosen there first.
 */
export function WishlistCartButton({slug, name, variants}: WishlistCartButtonProps) {
    const t = useTranslations('Wishlist');
    const [isPending, startTransition] = useTransition();
    const [isAdded, setIsAdded] = useState(false);
    const className = 'w-full h-9 sm:h-10 rounded-full text-xs sm:text-sm font-semibold';

    if (variants.length !== 1) {
        return (
            <Button render={<Link href={`/product/${slug}`} prefetch={false} />} nativeButton={false} variant="outline" className={className}>
                {t('selectOptions')}
            </Button>
        );
    }

    const variant = variants[0];
    const isInStock = variant.stockLevel !== 'OUT_OF_STOCK';

    const handleAdd = () => {
        startTransition(async () => {
            const result = await addToCart(variant.id, 1);
            if (result.success) {
                setIsAdded(true);
                setTimeout(() => setIsAdded(false), 2000);
                toast.success(t('addedToCartMessage'), {
                    description: t('addedToCartDescription', {name}),
                });
            } else {
                toast.error(t('errorTitle'), {description: result.error || t('errorAddToCart')});
            }
        });
    };

    return (
        <Button type="button" className={className} disabled={!isInStock || isPending} onClick={handleAdd}>
            {isAdded ? <CheckCircle2 className="size-4" /> : <ShoppingBag className="size-4" />}
            {!isInStock
                ? t('outOfStock')
                : isPending
                    ? t('adding')
                    : isAdded
                        ? t('addedToCart')
                        : t('addToCart')}
        </Button>
    );
}
