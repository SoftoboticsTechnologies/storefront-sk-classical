import type {Metadata} from 'next';
import {Suspense} from 'react';
import {getTranslations} from 'next-intl/server';
import {getRouteLocale} from '@/platform/i18n/server';
import {OrderConfirmation} from './order-confirmation';
import {noIndexRobots} from '@/config/metadata';

export async function generateMetadata(): Promise<Metadata> {
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'OrderConfirmation'});
    return {
        title: t('pageTitle'),
        robots: noIndexRobots(),
    };
}

export default async function OrderConfirmationPage() {
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'Common'});

    return (
        <Suspense fallback={<div className="container mx-auto px-4 py-16 text-center">{t('loading')}</div>}>
            <OrderConfirmation />
        </Suspense>
    );
}
