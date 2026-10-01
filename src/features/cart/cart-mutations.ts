import {mutate} from '@/platform/vendure/client-api';
import {RemoveFromCartMutation, AdjustCartItemMutation} from '@/features/cart/graphql';
import {TransitionOrderToStateMutation} from '@/features/checkout/graphql';
import {getActiveCurrencyCode} from '@/features/currency/currency-client';
import {dispatchCartChanged} from '@/features/cart/cart-events';

/** Result of a cart line mutation; `error` is Vendure's message (e.g. not enough stock). */
export interface CartMutationResult {
    success: boolean;
    error?: string;
}

// Starting checkout moves the order into "ArrangingPayment", which Vendure locks
// against further cart edits. If the customer navigates back to the cart (e.g. after
// abandoning checkout, or a payment attempt that never settled), any cart mutation
// fails with ORDER_MODIFICATION_ERROR. Transitioning back to "AddingItems" is an
// allowed reverse transition, so unlock the order and retry once instead of
// surfacing that error to the customer.
async function withCartModificationRetry<T extends {__typename: string}>(
    perform: () => Promise<T>
): Promise<T> {
    const result = await perform();
    if (result.__typename === 'Order' || !('errorCode' in result) || result.errorCode !== 'ORDER_MODIFICATION_ERROR') {
        return result;
    }

    await mutate(TransitionOrderToStateMutation, {state: 'AddingItems'}, {useAuthToken: true});
    return perform();
}

function toResult(result: {__typename: string; message?: string}): CartMutationResult {
    return result.__typename === 'Order' ? {success: true} : {success: false, error: result.message};
}

/** Removes an ActiveOrder line. Shared by the cart page and the product page stepper. */
export async function removeFromCart(lineId: string): Promise<CartMutationResult> {
    const currencyCode = await getActiveCurrencyCode();
    try {
        const result = await withCartModificationRetry(async () => {
            const response = await mutate(RemoveFromCartMutation, {lineId}, {useAuthToken: true, currencyCode});
            return response.data.removeOrderLine;
        });
        return toResult(result);
    } catch {
        return {success: false};
    } finally {
        dispatchCartChanged();
    }
}

/** Sets an ActiveOrder line's quantity. Shared by the cart page and the product page stepper. */
export async function adjustQuantity(lineId: string, quantity: number): Promise<CartMutationResult> {
    const currencyCode = await getActiveCurrencyCode();
    try {
        const result = await withCartModificationRetry(async () => {
            const response = await mutate(AdjustCartItemMutation, {lineId, quantity}, {useAuthToken: true, currencyCode});
            return response.data.adjustOrderLine;
        });
        return toResult(result);
    } catch {
        return {success: false};
    } finally {
        dispatchCartChanged();
    }
}
