import {getTranslations} from 'next-intl/server';
import {getRouteLocale} from '@/platform/i18n/server';
import {getRootCollections} from '@/features/collections/data';
import {formatCollectionName, getCollectionHref} from '@/features/collections/utils';
import {MobileCategoryStripList} from '@/site/navigation/navbar/mobile-category-strip-list';

/**
 * Below `xl` the full menu lives in the hamburger sheet; this fills the pinned
 * row with one-tap, horizontally scrollable links to the root collections.
 */
export async function MobileCategoryStrip() {
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'Navigation'});
    const collections = await getRootCollections(locale);

    const items = [
        ...collections.map((collection) => ({
            key: collection.id,
            href: getCollectionHref(collection),
            label: formatCollectionName(collection.name),
        })),
        {key: 'new-arrivals', href: '/new-arrivals', label: t('newArrivals')},
    ];

    return <MobileCategoryStripList items={items} label={t('collections')} />;
}
