import type {Metadata} from 'next';
import {getRouteLocale} from '@/platform/i18n/server';
import {getTranslations} from 'next-intl/server';
import {noIndexRobots} from '@/config/metadata';
import {getAvailableCountriesCached} from '@/features/checkout/countries';
import CheckoutClient from './checkout-client';

export async function generateMetadata(): Promise<Metadata> {
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'Checkout'});
    return {
        title: t('pageTitle'),
        robots: noIndexRobots(),
    };
}

export default async function CheckoutPage() {
    const locale = await getRouteLocale();
    const countries = await getAvailableCountriesCached(locale);

    return <CheckoutClient countries={countries} />;
}
