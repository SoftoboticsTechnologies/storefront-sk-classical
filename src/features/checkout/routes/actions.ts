import {mutate, query} from '@/platform/vendure/client-api';
import {SetOrderShippingAddressMutation, SetOrderBillingAddressMutation, SetOrderShippingMethodMutation, AddPaymentToOrderMutation, TransitionOrderToStateMutation, SetCustomerForOrderMutation, CreateStripePaymentIntentMutation, CreateRazorpayOrderMutation, CreateCashfreeOrderMutation, GetActiveOrderForCheckoutQuery} from '@/features/checkout/graphql';
import {CreateCustomerAddressMutation} from '@/features/account/graphql';
import {dispatchCartChanged} from '@/features/cart/cart-events';

interface AddressInput {
    fullName: string;
    streetLine1: string;
    streetLine2?: string;
    city: string;
    province: string;
    postalCode: string;
    countryCode: string;
    phoneNumber: string;
    company?: string;
}

export async function setShippingAddress(
    shippingAddress: AddressInput,
    useSameForBilling: boolean
) {
    const shippingResult = await mutate(
        SetOrderShippingAddressMutation,
        {input: shippingAddress},
        {useAuthToken: true}
    );

    if (shippingResult.data.setOrderShippingAddress.__typename !== 'Order') {
        throw new Error('Failed to set shipping address');
    }

    if (useSameForBilling) {
        await mutate(
            SetOrderBillingAddressMutation,
            {input: shippingAddress},
            {useAuthToken: true}
        );
    }
}

export async function setShippingMethod(shippingMethodId: string) {
    const result = await mutate(
        SetOrderShippingMethodMutation,
        {shippingMethodId: [shippingMethodId]},
        {useAuthToken: true}
    );

    if (result.data.setOrderShippingMethod.__typename !== 'Order') {
        const errorResult = result.data.setOrderShippingMethod;
        throw new Error(
            `Failed to set shipping method: ${errorResult.errorCode} - ${errorResult.message}`
        );
    }
}

export async function createCustomerAddress(address: AddressInput) {
    const result = await mutate(
        CreateCustomerAddressMutation,
        {input: address},
        {useAuthToken: true}
    );

    if (!result.data.createCustomerAddress) {
        throw new Error('Failed to create customer address');
    }

    return result.data.createCustomerAddress;
}

export async function transitionToArrangingPayment() {
    // Guard against double-invocation (e.g. a payment form's effect firing twice)
    // racing this same transition — skip it if the order is already past AddingItems.
    const activeOrderResult = await query(GetActiveOrderForCheckoutQuery, {}, {useAuthToken: true});
    const activeOrder = activeOrderResult.data.activeOrder;
    if (activeOrder && activeOrder.state !== 'AddingItems') {
        return activeOrder.code;
    }

    const result = await mutate(
        TransitionOrderToStateMutation,
        {state: 'ArrangingPayment'},
        {useAuthToken: true}
    );

    if (result.data.transitionOrderToState?.__typename === 'OrderStateTransitionError') {
        const errorResult = result.data.transitionOrderToState;

        // Order is already in the target state (e.g. a prior payment attempt
        // was abandoned) — treat as a no-op success instead of failing.
        if (errorResult.fromState === 'ArrangingPayment' && errorResult.toState === 'ArrangingPayment') {
            const activeOrderResult = await query(GetActiveOrderForCheckoutQuery, {}, {useAuthToken: true});
            return activeOrderResult.data.activeOrder?.code;
        }

        throw new Error(
            `Failed to transition order state: ${errorResult.errorCode} - ${errorResult.message}`
        );
    }

    return result.data.transitionOrderToState?.__typename === 'Order'
        ? result.data.transitionOrderToState.code
        : undefined;
}

/**
 * Stripe settles the payment asynchronously via webhook (admin context),
 * so unlike other methods we never call addPaymentToOrder here — we only
 * create the PaymentIntent for the client to confirm with Stripe.js.
 */
export async function createStripePaymentIntentAction(): Promise<{
    clientSecret: string;
    orderCode: string;
}> {
    const orderCode = await transitionToArrangingPayment();

    if (!orderCode) {
        throw new Error('Failed to transition order to ArrangingPayment state');
    }

    const result = await mutate(CreateStripePaymentIntentMutation, {}, {useAuthToken: true});

    const clientSecret = result.data.createStripePaymentIntent;
    if (!clientSecret) {
        throw new Error('Failed to create Stripe payment intent');
    }

    return {clientSecret, orderCode};
}

/**
 * Unlike Stripe, Razorpay settlement happens synchronously: the storefront calls
 * addPaymentToOrder with the signed checkout response once Checkout.js resolves
 * (see placeRazorpayOrder). The webhook is only a reconciliation backstop.
 */
export async function createRazorpayOrderAction(): Promise<{
    orderId: string;
    amount: number;
    currency: string;
    keyId: string;
    orderCode: string;
}> {
    const orderCode = await transitionToArrangingPayment();

    if (!orderCode) {
        throw new Error('Failed to transition order to ArrangingPayment state');
    }

    const result = await mutate(CreateRazorpayOrderMutation, {}, {useAuthToken: true});

    // Cast needed until the `createRazorpayOrder` mutation is deployed on the live
    // Vendure schema — the generated types don't yet reflect its shape, though the
    // GraphQL selection above already requests the correct fields.
    const razorpayOrder = result.data.createRazorpayOrder as {
        orderId: string;
        amount: number;
        currency: string;
        keyId: string;
    } | null;

    if (!razorpayOrder) {
        throw new Error('Failed to create Razorpay order');
    }

    return {...razorpayOrder, orderCode};
}

interface RazorpayPaymentMetadata extends Record<string, unknown> {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
}

export async function placeRazorpayOrder(metadata: RazorpayPaymentMetadata): Promise<string> {
    const result = await mutate(
        AddPaymentToOrderMutation,
        {
            input: {
                method: 'razorpay',
                metadata,
            },
        },
        {useAuthToken: true}
    );

    if (result.data.addPaymentToOrder.__typename !== 'Order') {
        const errorResult = result.data.addPaymentToOrder;
        throw new Error(
            `Failed to place order: ${errorResult.errorCode} - ${errorResult.message}`
        );
    }

    const orderCode = result.data.addPaymentToOrder.code;

    dispatchCartChanged();

    return orderCode;
}

/**
 * Like Razorpay, Cashfree settlement is verified synchronously: the storefront calls
 * addPaymentToOrder with the cfOrderId once the Cashfree Checkout modal resolves (see
 * placeCashfreeOrder). The plugin independently re-checks the payment status server-side
 * before settling; the webhook is only a reconciliation backstop.
 */
export async function createCashfreeOrderAction(): Promise<{
    orderId: string;
    paymentSessionId: string;
    environment: string;
    orderCode: string;
}> {
    const orderCode = await transitionToArrangingPayment();

    if (!orderCode) {
        throw new Error('Failed to transition order to ArrangingPayment state');
    }

    const result = await mutate(CreateCashfreeOrderMutation, {}, {useAuthToken: true});

    const cashfreeOrder = result.data.createCashfreeOrder as {
        orderId: string;
        paymentSessionId: string;
        environment: string;
    } | null;

    if (!cashfreeOrder) {
        throw new Error('Failed to create Cashfree order');
    }

    return {...cashfreeOrder, orderCode};
}

export async function placeCashfreeOrder(cfOrderId: string): Promise<string> {
    const result = await mutate(
        AddPaymentToOrderMutation,
        {
            input: {
                method: 'cashfree',
                metadata: {cfOrderId},
            },
        },
        {useAuthToken: true}
    );

    if (result.data.addPaymentToOrder.__typename !== 'Order') {
        const errorResult = result.data.addPaymentToOrder;
        throw new Error(
            `Failed to place order: ${errorResult.errorCode} - ${errorResult.message}`
        );
    }

    const orderCode = result.data.addPaymentToOrder.code;

    dispatchCartChanged();

    return orderCode;
}

export async function placeOrder(paymentMethodCode: string): Promise<string> {
    // First, transition the order to ArrangingPayment state
    await transitionToArrangingPayment();

    // Prepare metadata based on payment method
    const metadata: Record<string, unknown> = {};

    // For standard payment, include the required fields
    if (paymentMethodCode === 'standard-payment') {
        metadata.shouldDecline = false;
        metadata.shouldError = false;
        metadata.shouldErrorOnSettle = false;
    }

    // Add payment to the order
    const result = await mutate(
        AddPaymentToOrderMutation,
        {
            input: {
                method: paymentMethodCode,
                metadata,
            },
        },
        {useAuthToken: true}
    );

    if (result.data.addPaymentToOrder.__typename !== 'Order') {
        const errorResult = result.data.addPaymentToOrder;
        throw new Error(
            `Failed to place order: ${errorResult.errorCode} - ${errorResult.message}`
        );
    }

    const orderCode = result.data.addPaymentToOrder.code;

    dispatchCartChanged();

    return orderCode;
}

interface GuestCustomerInput {
    emailAddress: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
}

export type SetCustomerForOrderResult =
    | { success: true }
    | { success: false; errorCode: 'EMAIL_CONFLICT'; message: string }
    | { success: false; errorCode: 'GUEST_CHECKOUT_DISABLED'; message: string }
    | { success: false; errorCode: 'NO_ACTIVE_ORDER'; message: string }
    | { success: false; errorCode: 'UNKNOWN'; message: string };

export async function setCustomerForOrder(
    input: GuestCustomerInput
): Promise<SetCustomerForOrderResult> {
    const result = await mutate(
        SetCustomerForOrderMutation,
        { input },
        { useAuthToken: true }
    );

    const response = result.data.setCustomerForOrder;

    switch (response.__typename) {
        case 'Order': {
            return { success: true };
        }
        case 'AlreadyLoggedInError':
            return { success: true };
        case 'EmailAddressConflictError':
            return { success: false, errorCode: 'EMAIL_CONFLICT', message: response.message };
        case 'GuestCheckoutError':
            return { success: false, errorCode: 'GUEST_CHECKOUT_DISABLED', message: response.message };
        case 'NoActiveOrderError':
            return { success: false, errorCode: 'NO_ACTIVE_ORDER', message: response.message };
        default:
            return { success: false, errorCode: 'UNKNOWN', message: 'Unknown error' };
    }
}
