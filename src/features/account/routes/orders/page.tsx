import type {Metadata} from 'next';
import {Suspense} from 'react';
import {getRouteLocale} from '@/platform/i18n/server';
import {getTranslations} from 'next-intl/server';
import OrdersClient from './orders-client';

export async function generateMetadata(): Promise<Metadata> {
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'Account'});
    return {
        title: t('ordersPageTitle'),
    };
}

export default async function OrdersPage() {
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'Common'});

    return (
        <Suspense fallback={<div className="p-8 text-center">{t('loading')}</div>}>
            <OrdersClient />
        </Suspense>
    );
}
