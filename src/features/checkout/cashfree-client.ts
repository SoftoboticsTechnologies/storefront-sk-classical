interface CashfreeCheckoutResult {
    error?: { message: string };
    paymentDetails?: { paymentMessage: string };
}

interface CashfreeCheckoutOptions {
    paymentSessionId: string;
    redirectTarget: '_modal';
}

interface CashfreeInstance {
    checkout: (options: CashfreeCheckoutOptions) => Promise<CashfreeCheckoutResult>;
}

declare global {
    interface Window {
        Cashfree: (options: { mode: 'sandbox' | 'production' }) => CashfreeInstance;
    }
}

interface CashfreeOrder {
    orderId: string;
    paymentSessionId: string;
    environment: string;
}

const SDK_LOAD_ERROR =
    'Payment gateway failed to load. Please disable ad blockers or browser extensions for this site and try again.';

export async function openCashfreeCheckout(cashfreeOrder: CashfreeOrder): Promise<void> {
    if (typeof window.Cashfree !== 'function') {
        throw new Error(SDK_LOAD_ERROR);
    }

    const cashfree = window.Cashfree({
        mode: cashfreeOrder.environment.toLowerCase() as 'sandbox' | 'production',
    });

    const result = await cashfree.checkout({
        paymentSessionId: cashfreeOrder.paymentSessionId,
        redirectTarget: '_modal',
    });

    if (result.error) {
        throw new Error(result.error.message);
    }
}
