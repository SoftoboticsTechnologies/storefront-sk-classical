interface RazorpaySuccessResponse {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
}

interface RazorpayFailureResponse {
    error: {
        code: string;
        description: string;
        source?: string;
        step?: string;
        reason?: string;
    };
}

interface RazorpayCheckoutOptions {
    key: string;
    amount: number;
    currency: string;
    order_id: string;
    handler: (response: RazorpaySuccessResponse) => void;
    modal?: {
        ondismiss?: () => void;
    };
}

interface RazorpayCheckoutInstance {
    open: () => void;
    on: (event: 'payment.failed', handler: (response: RazorpayFailureResponse) => void) => void;
}

declare global {
    interface Window {
        Razorpay: new (options: RazorpayCheckoutOptions) => RazorpayCheckoutInstance;
    }
}

interface RazorpayOrder {
    orderId: string;
    amount: number;
    currency: string;
    keyId: string;
}

export function openRazorpayCheckout(razorpayOrder: RazorpayOrder): Promise<RazorpaySuccessResponse> {
    return new Promise((resolve, reject) => {
        const rzp = new window.Razorpay({
            key: razorpayOrder.keyId,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            order_id: razorpayOrder.orderId,
            handler: (response) => resolve(response),
            modal: {
                ondismiss: () => reject(new Error('Checkout dismissed')),
            },
        });

        rzp.on('payment.failed', (response) => reject(new Error(response.error.description)));
        rzp.open();
    });
}
