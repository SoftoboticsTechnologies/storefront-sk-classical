import {AddToCartMutation} from '@/features/cart/graphql';
import {TransitionOrderToStateMutation} from '@/features/checkout/graphql';
import {getActiveCurrencyCode} from '@/features/currency/currency-client';
import {mutate} from '@/platform/vendure/client-api';
import {setAuthToken} from '@/platform/vendure/auth-token';
import {dispatchCartChanged} from '@/features/cart/cart-events';

/**
 * Client-side add-to-cart. On failure returns `{success: false, error: undefined}`
 * so callers fall back to their own `useTranslations('Errors')`/localized copy
 * (see features/products/components/product-info.tsx, which already does this)
 * — getTranslations is server-only and unavailable here.
 */
export async function addToCart(variantId: string, quantity = 1) {
    const currencyCode = await getActiveCurrencyCode();

    try {
        let result = await mutate(
            AddToCartMutation,
            {variantId, quantity},
            {useAuthToken: true, currencyCode},
        );

        if (result.token) await setAuthToken(result.token);

        // If checkout was started (order moved to "ArrangingPayment") and the customer
        // comes back to add another item, Vendure rejects the mutation. Unlock the order
        // by transitioning it back to "AddingItems" (an allowed reverse transition) and retry.
        if (result.data.addItemToOrder.__typename !== 'Order'
            && result.data.addItemToOrder.errorCode === 'ORDER_MODIFICATION_ERROR') {
            await mutate(TransitionOrderToStateMutation, {state: 'AddingItems'}, {useAuthToken: true});
            result = await mutate(
                AddToCartMutation,
                {variantId, quantity},
                {useAuthToken: true, currencyCode},
            );
            if (result.token) await setAuthToken(result.token);
        }

        if (result.data.addItemToOrder.__typename === 'Order') {
            dispatchCartChanged();
            return {success: true, order: result.data.addItemToOrder};
        }
        return {success: false, error: result.data.addItemToOrder.message};
    } catch {
        return {success: false, error: undefined};
    }
}
