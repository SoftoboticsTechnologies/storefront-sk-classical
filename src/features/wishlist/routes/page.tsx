import type {Metadata} from 'next';
import {getRouteLocale} from '@/platform/i18n/server';
import {getTranslations} from 'next-intl/server';
import {noIndexRobots} from '@/config/metadata';
import {WishlistItems} from '@/features/wishlist/routes/wishlist-items';

export async function generateMetadata(): Promise<Metadata> {
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'Wishlist'});
    return {
        title: t('title'),
        robots: noIndexRobots(),
    };
}

export default async function WishlistPage() {
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'Wishlist'});

    return (
        <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 mt-16">
            <div className="mb-8">
                <h1 className="font-serif text-3xl font-bold">{t('title')}</h1>
                <p className="mt-1 text-sm text-muted-foreground">{t('note')}</p>
            </div>

            <WishlistItems/>
        </div>
    );
}
