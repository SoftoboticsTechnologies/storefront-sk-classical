'use client';

import {Heart} from 'lucide-react';
import {useTranslations} from 'next-intl';
import {toast} from 'sonner';
import {cn} from '@/lib/utils';
import {toggleWishlist, useWishlist} from '@/features/wishlist/wishlist-store';

interface WishlistButtonProps {
    slug: string;
    /** `overlay`: small round button on a product card. `outline`: full-height button beside Add to Cart. */
    variant?: 'overlay' | 'outline';
    className?: string;
}

export function WishlistButton({slug, variant = 'overlay', className}: WishlistButtonProps) {
    const t = useTranslations('Wishlist');
    const saved = useWishlist().includes(slug);
    const label = saved ? t('remove') : t('add');

    return (
        <button
            type="button"
            aria-pressed={saved}
            aria-label={label}
            title={label}
            onClick={(event) => {
                // Cards sit next to a full-tile link; keep the click on the button.
                event.preventDefault();
                event.stopPropagation();
                const nowSaved = toggleWishlist(slug);
                toast.success(nowSaved ? t('addedToast') : t('removedToast'));
            }}
            className={cn(
                'inline-flex shrink-0 items-center justify-center text-primary transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold',
                variant === 'overlay'
                    ? 'size-8 sm:size-9 rounded-full bg-background/90 shadow-sm ring-1 ring-gold/40 backdrop-blur hover:scale-105 hover:ring-gold'
                    : 'size-12 rounded-lg border border-gold/60 hover:bg-gold/10',
                className,
            )}
        >
            <Heart className={cn(variant === 'overlay' ? 'size-4 sm:size-[1.125rem]' : 'size-5', saved && 'fill-current')} />
        </button>
    );
}
