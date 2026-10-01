'use client';

import {useCallback, useEffect, useState} from 'react';
import {query} from '@/platform/vendure/client-api';
import {AUTH_TOKEN_CHANGED_EVENT} from '@/platform/vendure/auth-token';
import {GetActiveOrderQuery} from '@/features/cart/graphql';
import {CART_CHANGED_EVENT} from '@/features/cart/cart-events';

interface CartLine {
    id: string;
    quantity: number;
}

/**
 * The ActiveOrder line (id + quantity) for one variant, or `line: null` when it isn't
 * in the cart. Read from Vendure on mount and re-read on every cart change
 * (same events the navbar cart listens to), so ActiveOrder stays the only
 * source of truth for quantities: no local cart state.
 */
export function useCartLine(variantId: string | undefined): {line: CartLine | null; refresh: () => Promise<void>} {
    const [lines, setLines] = useState<Array<{id: string; variantId: string; quantity: number}>>([]);

    const refresh = useCallback(async () => {
        try {
            const result = await query(GetActiveOrderQuery, undefined, {useAuthToken: true});
            setLines(
                (result.data.activeOrder?.lines ?? []).map((line) => ({
                    id: line.id,
                    variantId: line.productVariant.id,
                    quantity: line.quantity,
                })),
            );
        } catch {
            setLines([]);
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

    const match = variantId ? lines.find((l) => l.variantId === variantId) : undefined;
    // `refresh` lets a caller await the re-read right after its own mutation, so the
    // UI swaps straight from "Adding..." to the stepper without a flash in between.
    return {line: match ? {id: match.id, quantity: match.quantity} : null, refresh};
}
