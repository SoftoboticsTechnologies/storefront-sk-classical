'use client';

import {useAuth} from '@/features/authentication/auth-context';

/**
 * Client-side replacement for the old server-cached getActiveCustomer().
 * Static export has no per-request server cache, so this reads the customer
 * already resolved by AuthProvider (see features/authentication/auth-context.tsx).
 */
export function useActiveCustomer() {
    const {customer, isLoading, refreshCustomer} = useAuth();
    return {customer, isLoading, refresh: refreshCustomer};
}
