import {getRouteLocale} from '@/platform/i18n/server';
import {getRootCollections} from '@/features/collections/data';
import {MobileNav} from '@/site/navigation/navbar/mobile-nav';

export async function MobileNavWrapper() {
    const locale = await getRouteLocale();

    const collections = await getRootCollections(locale);

    return <MobileNav collections={collections} />;
}
