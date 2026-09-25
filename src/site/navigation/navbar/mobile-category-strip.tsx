import {getTranslations} from 'next-intl/server';
import {getRouteLocale} from '@/platform/i18n/server';
import {getRootCollections} from '@/features/collections/data';
import {formatCollectionName, getCollectionHref} from '@/features/collections/utils';
import {NavigationLink} from '@/site/navigation/navigation-link';

const chipClass = "shrink-0 rounded-full border border-gold/40 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-foreground/85 transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground";

/**
 * Below `xl` the full menu lives in the hamburger sheet; this fills the pinned
 * row with one-tap, horizontally scrollable links to the root collections.
 */
export async function MobileCategoryStrip() {
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'Navigation'});
    const collections = await getRootCollections(locale);

    return (
        <nav aria-label={t('collections')} className="min-w-0 flex-1">
            <ul className="flex items-center gap-2 overflow-x-auto py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {collections.map((collection) => (
                    <li key={collection.id} className="shrink-0">
                        <NavigationLink href={getCollectionHref(collection)} prefetch={false} className={chipClass}>
                            {formatCollectionName(collection.name)}
                        </NavigationLink>
                    </li>
                ))}
                <li className="shrink-0">
                    <NavigationLink href="/new-arrivals" className={chipClass}>
                        {t('newArrivals')}
                    </NavigationLink>
                </li>
            </ul>
        </nav>
    );
}
