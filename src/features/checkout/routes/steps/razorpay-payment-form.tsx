'use client';

import {useEffect, useRef, useState} from 'react';
import {Loader2} from 'lucide-react';
import {useTranslations} from 'next-intl';
import {useRouter} from '@/platform/i18n/navigation';
import {Button} from '@/components/ui/button';
import {openRazorpayCheckout} from '../../razorpay-client';
import {createRazorpayOrderAction, placeRazorpayOrder} from '../actions';

interface RazorpayOrderState {
    orderId: string;
    amount: number;
    currency: string;
    keyId: string;
    orderCode: string;
}

export default function RazorpayPaymentForm() {
    const t = useTranslations('Checkout');
    const router = useRouter();
    const [order, setOrder] = useState<RazorpayOrderState | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const startedRef = useRef(false);

    useEffect(() => {
        if (startedRef.current) return;
        startedRef.current = true;

        let cancelled = false;

        createRazorpayOrderAction()
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
            const response = await openRazorpayCheckout(order);
            const orderCode = await placeRazorpayOrder({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
            });
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
