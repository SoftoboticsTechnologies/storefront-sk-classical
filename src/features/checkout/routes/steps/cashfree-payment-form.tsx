'use client';

import {useEffect, useState} from 'react';
import {Loader2} from 'lucide-react';
import {useTranslations} from 'next-intl';
import {useRouter} from '@/platform/i18n/navigation';
import {Button} from '@/components/ui/button';
import {openCashfreeCheckout} from '../../cashfree-client';
import {createCashfreeOrderAction, placeCashfreeOrder} from '../actions';

interface CashfreeOrderState {
    orderId: string;
    paymentSessionId: string;
    environment: string;
    orderCode: string;
}

export default function CashfreePaymentForm() {
    const t = useTranslations('Checkout');
    const router = useRouter();
    const [order, setOrder] = useState<CashfreeOrderState | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        createCashfreeOrderAction()
            .then((result) => {
                if (!cancelled) setOrder(result);
            })
            .catch((err: unknown) => {
                if (!cancelled) {
                    setError(err instanceof Error ? err.message : t('paymentFailed'));
                }
            });

        return () => {
            cancelled = true;
        };
    }, [t]);

    const handlePay = async () => {
        if (!order) return;

        setSubmitting(true);
        setError(null);

        try {
            await openCashfreeCheckout(order);
            const orderCode = await placeCashfreeOrder(order.orderId);
            router.push(`/order-confirmation?code=${orderCode}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : t('paymentFailed'));
            setSubmitting(false);
        }
    };

    if (error) {
        return <p className="text-sm text-destructive">{error}</p>;
    }

    if (!order) {
        return (
            <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <Button onClick={handlePay} disabled={submitting} size="lg" className="w-full">
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('placeOrder')}
        </Button>
    );
}
