'use client';

import {useCallback, useEffect, useState} from 'react';
import {useParams} from 'next/navigation';
import {CartItems} from '@/features/cart/routes/cart-items';
import {OrderSummary} from '@/features/cart/routes/order-summary';
import {PromotionCode} from '@/features/cart/routes/promotion-code';
import {getActiveCurrencyCode} from '@/features/currency/currency-client';
import {query} from '@/platform/vendure/client-api';
import {GetActiveOrderQuery} from '@/features/cart/graphql';
import {CART_CHANGED_EVENT} from '@/features/cart/cart-events';
import {AUTH_TOKEN_CHANGED_EVENT} from '@/platform/vendure/auth-token';
import {CartSkeleton} from '@/features/cart/components/cart-skeleton';
import type {ResultOf} from '@/platform/vendure/graphql';

type ActiveOrder = NonNullable<ResultOf<typeof GetActiveOrderQuery>['activeOrder']>;

export function Cart() {
    const {locale} = useParams<{locale: string}>();
    const [activeOrder, setActiveOrder] = useState<ActiveOrder | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const refresh = useCallback(async () => {
        const currencyCode = await getActiveCurrencyCode();
        const {data} = await query(GetActiveOrderQuery, {}, {
            useAuthToken: true,
            languageCode: locale,
            currencyCode,
        });
        setActiveOrder(data.activeOrder ?? null);
        setIsLoading(false);
    }, [locale]);

    useEffect(() => {
        refresh();
        window.addEventListener(CART_CHANGED_EVENT, refresh);
        window.addEventListener(AUTH_TOKEN_CHANGED_EVENT, refresh);
        return () => {
            window.removeEventListener(CART_CHANGED_EVENT, refresh);
            window.removeEventListener(AUTH_TOKEN_CHANGED_EVENT, refresh);
        };
    }, [refresh]);

    if (isLoading) {
        return <CartSkeleton/>;
    }

    if (!activeOrder || activeOrder.lines.length === 0) {
        return <CartItems activeOrder={null}/>;
    }

    return (
        <div className="grid lg:grid-cols-3 gap-8">
            <CartItems activeOrder={activeOrder}/>

            <div className="lg:col-span-1">
                <OrderSummary activeOrder={activeOrder}/>
                <PromotionCode activeOrder={activeOrder}/>
            </div>
        </div>
    )
}
