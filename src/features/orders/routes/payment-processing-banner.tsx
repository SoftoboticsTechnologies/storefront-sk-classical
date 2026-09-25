'use client';

import {useEffect, useRef} from 'react';
import type {ResultOf} from 'gql.tada';
import {Loader2} from 'lucide-react';
import {useTranslations} from 'next-intl';
import {query} from '@/platform/vendure/client-api';
import {GetOrderByCodeQuery} from '@/features/orders/graphql';

type OrderByCode = ResultOf<typeof GetOrderByCodeQuery>['orderByCode'];

interface PaymentProcessingBannerProps {
    code: string;
    onOrderUpdate: (order: OrderByCode) => void;
}

// Vendure only grants anonymous access to `orderByCode` once the order has
// been placed (`orderPlacedAt` set), which happens when the Stripe webhook
// settles payment — not immediately after the client-side redirect. Until
// then this query is denied with an auth error; treat that as "still
// processing" rather than a hard failure.
async function fetchOrderByCode(code: string): Promise<OrderByCode | null> {
    try {
        const {data} = await query(GetOrderByCodeQuery, {code}, {useAuthToken: true});
        return data.orderByCode;
    } catch {
        return null;
    }
}

export function PaymentProcessingBanner({code, onOrderUpdate}: PaymentProcessingBannerProps) {
    const t = useTranslations('OrderConfirmation');
    const onOrderUpdateRef = useRef(onOrderUpdate);
    onOrderUpdateRef.current = onOrderUpdate;

    useEffect(() => {
        let cancelled = false;

        const poll = async () => {
            const order = await fetchOrderByCode(code);
            if (cancelled) return;
            if (order) {
                onOrderUpdateRef.current(order);
                if (order.state !== 'ArrangingPayment') {
                    clearInterval(interval);
                }
            }
        };

        const interval = setInterval(poll, 2000);
        return () => {
            cancelled = true;
            clearInterval(interval);
        };
    }, [code]);

    return (
        <div className="flex items-center justify-center gap-2 rounded-lg border bg-muted/50 p-4 mb-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t('processingPayment')}
        </div>
    );
}
