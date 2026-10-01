import {mutate} from '@/platform/vendure/client-api';
import {ApplyPromotionCodeMutation, RemovePromotionCodeMutation} from '@/features/cart/graphql';
import {getActiveCurrencyCode} from '@/features/currency/currency-client';
import {dispatchCartChanged} from '@/features/cart/cart-events';

// Line quantity mutations live in the top-level cart module so the product page
// stepper can share them (features may only import another feature's top level).
export {removeFromCart, adjustQuantity} from '@/features/cart/cart-mutations';

export async function applyPromotionCode(code: string) {
    if (!code) return;

    const currencyCode = await getActiveCurrencyCode();
    await mutate(ApplyPromotionCodeMutation, {couponCode: code}, {useAuthToken: true, currencyCode});
    dispatchCartChanged();
}

export async function removePromotionCode(code: string) {
    if (!code) return;

    const currencyCode = await getActiveCurrencyCode();
    await mutate(RemovePromotionCodeMutation, {couponCode: code}, {useAuthToken: true, currencyCode});
    dispatchCartChanged();
}
