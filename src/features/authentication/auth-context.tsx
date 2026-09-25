'use client';

import {createContext, useCallback, useContext, useEffect, useState, type ReactNode} from 'react';
import {readFragment, type ResultOf} from '@/platform/vendure/graphql';
import {query} from '@/platform/vendure/client-api';
import {getAuthToken, setAuthToken as persistAuthToken, removeAuthToken, AUTH_TOKEN_CHANGED_EVENT} from '@/platform/vendure/auth-token';
import {ActiveCustomerFragment, GetActiveCustomerQuery} from '@/features/account/graphql';

type ActiveCustomer = ResultOf<typeof ActiveCustomerFragment> | null;

interface AuthContextValue {
    /** Bearer token for the current session (guest order token or signed-in customer token). undefined while loading. */
    token: string | undefined | null;
    customer: ActiveCustomer;
    isLoading: boolean;
    /** Persist a new token (e.g. after sign-in, register, or guest order creation) and refresh the active customer. */
    login: (token: string) => Promise<void>;
    logout: () => Promise<void>;
    refreshCustomer: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({children}: {children: ReactNode}) {
    const [token, setToken] = useState<string | undefined | null>(null);
    const [customer, setCustomer] = useState<ActiveCustomer>(null);
    const [isLoading, setIsLoading] = useState(true);

    const refreshCustomer = useCallback(async () => {
        const currentToken = await getAuthToken();
        setToken(currentToken);
        try {
            const result = await query(GetActiveCustomerQuery, undefined, currentToken ? {token: currentToken} : undefined);
            setCustomer(result.data.activeCustomer ? readFragment(ActiveCustomerFragment, result.data.activeCustomer) : null);
            if (result.token) {
                await persistAuthToken(result.token);
            }
        } catch {
            setCustomer(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshCustomer();
        const onTokenChanged = () => {
            refreshCustomer();
        };
        window.addEventListener(AUTH_TOKEN_CHANGED_EVENT, onTokenChanged);
        return () => window.removeEventListener(AUTH_TOKEN_CHANGED_EVENT, onTokenChanged);
    }, [refreshCustomer]);

    const login = useCallback(async (newToken: string) => {
        await persistAuthToken(newToken);
        await refreshCustomer();
    }, [refreshCustomer]);

    const logout = useCallback(async () => {
        await removeAuthToken();
        setCustomer(null);
        setToken(undefined);
    }, []);

    return (
        <AuthContext.Provider value={{token, customer, isLoading, login, logout, refreshCustomer}}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return ctx;
}
