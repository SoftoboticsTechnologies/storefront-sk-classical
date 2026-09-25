import type {Metadata} from 'next';
import {getRouteLocale} from '@/platform/i18n/server';
import {getTranslations} from 'next-intl/server';
import { AddressesContent } from './addresses-content';

export async function generateMetadata(): Promise<Metadata> {
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'Account'});
    return {
        title: t('addressesPageTitle'),
    };
}

export default function AddressesPage() {
    return <AddressesContent />;
}
