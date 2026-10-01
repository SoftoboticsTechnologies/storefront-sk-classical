'use client';

import {Heart} from 'lucide-react';
import {useTranslations} from 'next-intl';
import {Button} from '@/components/ui/button';
import {Link} from '@/platform/i18n/navigation';
import {useWishlist} from '@/features/wishlist/wishlist-store';

/** Header heart linking to /wishlist; the badge always shows the saved count (0 included). */
export function NavbarWishlist() {
    const t = useTranslations('Navigation');
    const count = useWishlist().length;

    return (
        <Button render={<Link href="/wishlist" />} nativeButton={false} variant="ghost" size="icon" className="relative">
            <Heart className="h-5 w-5"/>
            <span className="absolute -top-1 -right-1 bg-gold text-gold-foreground text-xs font-bold rounded-full h-5 min-w-5 px-1 flex items-center justify-center">
                {count}
            </span>
            <span className="sr-only">{t('wishlist')}</span>
        </Button>
    );
}
