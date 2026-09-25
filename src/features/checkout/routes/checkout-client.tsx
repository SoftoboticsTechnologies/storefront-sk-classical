'use client';

import {useEffect, useState} from 'react';
import {useParams} from 'next/navigation';
import {useTranslations} from 'next-intl';
import {useRouter} from '@/platform/i18n/navigation';
import {query} from '@/platform/vendure/client-api';
import {getActiveCurrencyCode} from '@/features/currency/currency-client';
import {useActiveCustomer} from '@/features/account/customer';
import {GetActiveOrderForCheckoutQuery, GetEligiblePaymentMethodsQuery, GetEligibleShippingMethodsQuery} from '@/features/checkout/graphql';
import {GetCustomerAddressesQuery} from '@/features/account/graphql';
import CheckoutFlow from './checkout-flow';
import {CheckoutProvider} from './checkout-provider';
import {CheckoutOrder} from './types';
import CheckoutLoading from './loading';

interface Country {
    id: string;
    code: string;
    name: string;
}

interface CheckoutClientProps {
    countries: Country[];
}

interface CustomerAddress {
    id: string;
    fullName?: string | null;
    company?: string | null;
    streetLine1: string;
    streetLine2?: string | null;
    city?: string | null;
    province?: string | null;
    postalCode?: string | null;
    country: {id: string; code: string; name: string};
    phoneNumber?: string | null;
    defaultShippingAddress?: boolean | null;
    defaultBillingAddress?: boolean | null;
}

interface LoadedCheckoutData {
    order: CheckoutOrder;
    addresses: CustomerAddress[];
    shippingMethods: Array<{id: string; name: string; code: string; description?: string | null; priceWithTax: number}>;
    paymentMethods: Array<{id: string; name: string; code: string; description?: string | null; isEligible: boolean; eligibilityMessage?: string | null}>;
    isGuest: boolean;
}

export default function CheckoutClient({countries}: CheckoutClientProps) {
    const {locale} = useParams<{locale: string}>();
    const router = useRouter();
    const t = useTranslations('Checkout');
    const {customer, isLoading: isCustomerLoading} = useActiveCustomer();
    const [data, setData] = useState<LoadedCheckoutData | null>(null);
    const [redirecting, setRedirecting] = useState(false);

    useEffect(() => {
        if (isCustomerLoading) return;

        let cancelled = false;
        const isGuest = !customer;

        (async () => {
            const currencyCode = await getActiveCurrencyCode();

            const [orderRes, addressesRes, shippingMethodsRes, paymentMethodsRes] = await Promise.all([
                query(GetActiveOrderForCheckoutQuery, {}, {useAuthToken: true, languageCode: locale, currencyCode}),
                isGuest
                    ? Promise.resolve({data: {activeCustomer: null}})
                    : query(GetCustomerAddressesQuery, {}, {useAuthToken: true}),
                query(GetEligibleShippingMethodsQuery, {}, {useAuthToken: true, currencyCode}),
                query(GetEligiblePaymentMethodsQuery, {}, {useAuthToken: true, currencyCode}),
            ]);

            if (cancelled) return;

            const activeOrder = orderRes.data.activeOrder;

            if (!activeOrder || activeOrder.lines.length === 0) {
                setRedirecting(true);
                router.push('/cart');
                return;
            }

            if (activeOrder.state !== 'AddingItems' && activeOrder.state !== 'ArrangingPayment') {
                setRedirecting(true);
                router.push(`/order-confirmation?code=${activeOrder.code}`);
                return;
            }

            setData({
                order: activeOrder,
                addresses: addressesRes.data.activeCustomer?.addresses || [],
                shippingMethods: shippingMethodsRes.data.eligibleShippingMethods || [],
                paymentMethods: (paymentMethodsRes.data.eligiblePaymentMethods || []).filter((m) => m.isEligible),
                isGuest,
            });
        })();

        return () => {
            cancelled = true;
        };
    }, [locale, customer, isCustomerLoading, router]);

    if (redirecting || !data) {
        return <CheckoutLoading/>;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">{t('pageTitle')}</h1>
            <CheckoutProvider
                order={data.order}
                addresses={data.addresses}
                countries={countries}
                shippingMethods={data.shippingMethods}
                paymentMethods={data.paymentMethods}
                isGuest={data.isGuest}
            >
                <CheckoutFlow/>
            </CheckoutProvider>
        </div>
    );
}
