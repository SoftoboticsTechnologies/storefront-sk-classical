'use client';

import {useEffect, useRef, useState} from 'react';
import {Elements, PaymentElement, useElements, useStripe} from '@stripe/react-stripe-js';
import {Loader2} from 'lucide-react';
import {useLocale, useTranslations} from 'next-intl';
import {useRouter} from '@/platform/i18n/navigation';
import {Button} from '@/components/ui/button';
import {getStripe} from '../../stripe-client';
import {createStripePaymentIntentAction} from '../actions';

const TERMINAL_PAYMENT_INTENT_STATUSES = new Set(['succeeded', 'canceled']);

interface StripeCheckoutFormProps {
    orderCode: string;
}

function StripeCheckoutForm({orderCode}: StripeCheckoutFormProps) {
    const t = useTranslations('Checkout');
    const locale = useLocale();
    const stripe = useStripe();
    const elements = useElements();
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [elementReady, setElementReady] = useState(false);

    const handleSubmit = async () => {
        if (!stripe || !elements || !elementReady) return;

        setSubmitting(true);
        setError(null);

        const {error: confirmError} = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: `${window.location.origin}/${locale}/order-confirmation?code=${orderCode}`,
            },
        });

        if (confirmError) {
            setError(confirmError.message ?? t('paymentFailed'));
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-4">
            <PaymentElement
                onReady={() => setElementReady(true)}
                onLoadError={(event) => setError(event.error.message ?? t('paymentFailed'))}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button
                onClick={handleSubmit}
                disabled={!stripe || !elementReady || submitting}
                size="lg"
                className="w-full"
            >
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('placeOrder')}
            </Button>
        </div>
    );
}

export default function StripePaymentForm() {
    const t = useTranslations('Checkout');
    const locale = useLocale();
    const router = useRouter();
    const [state, setState] = useState<{clientSecret: string; orderCode: string} | null>(null);
    const [error, setError] = useState<string | null>(null);

    const startedRef = useRef(false);

    useEffect(() => {
        if (startedRef.current) return;
        startedRef.current = true;

        let cancelled = false;

        createStripePaymentIntentAction()
            .then(async (result) => {
                if (cancelled) return;

                // The plugin reuses the same PaymentIntent for a given order (idempotency
                // key = order code + amount). If a prior attempt already settled it — e.g.
                // the webhook was previously misconfigured and never advanced the order —
                // Stripe.js refuses to mount Elements against a terminal PaymentIntent.
                // Detect that up front and bounce to order-confirmation instead of crashing.
                const stripe = await getStripe();
                const {paymentIntent} = (await stripe?.retrievePaymentIntent(result.clientSecret)) ?? {};
                if (cancelled) return;

                if (paymentIntent && TERMINAL_PAYMENT_INTENT_STATUSES.has(paymentIntent.status)) {
                    router.replace(`/order-confirmation?code=${result.orderCode}`);
                    return;
                }

                setState(result);
            })
            .catch((err: unknown) => {
                if (!cancelled) {
                    setError(err instanceof Error ? err.message : t('paymentFailed'));
                }
            });

        return () => {
            cancelled = true;
        };
    }, [t, router, locale]);

    if (error) {
        return <p className="text-sm text-destructive">{error}</p>;
    }

    if (!state) {
        return (
            <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <Elements stripe={getStripe()} options={{clientSecret: state.clientSecret}}>
            <StripeCheckoutForm orderCode={state.orderCode} />
        </Elements>
    );
}
