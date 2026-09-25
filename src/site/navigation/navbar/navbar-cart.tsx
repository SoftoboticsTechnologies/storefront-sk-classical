'use client';

import {useCallback, useEffect, useState} from 'react';
import {CartIcon} from './cart-icon';
import {query} from '@/platform/vendure/client-api';
import {GetActiveOrderQuery} from '@/features/cart/graphql';
import {CART_CHANGED_EVENT} from '@/features/cart/cart-events';
import {AUTH_TOKEN_CHANGED_EVENT} from '@/platform/vendure/auth-token';

export function NavbarCart() {
    const [cartItemCount, setCartItemCount] = useState(0);

    const refresh = useCallback(async () => {
        try {
            const orderResult = await query(GetActiveOrderQuery, undefined, {
                useAuthToken: true,
            });
            setCartItemCount(orderResult.data.activeOrder?.totalQuantity || 0);
        } catch {
            setCartItemCount(0);
        }
    }, []);

    useEffect(() => {
        refresh();
        window.addEventListener(CART_CHANGED_EVENT, refresh);
        window.addEventListener(AUTH_TOKEN_CHANGED_EVENT, refresh);
        return () => {
            window.removeEventListener(CART_CHANGED_EVENT, refresh);
            window.removeEventListener(AUTH_TOKEN_CHANGED_EVENT, refresh);
        };
    }, [refresh]);

    return <CartIcon cartItemCount={cartItemCount} />;
}
