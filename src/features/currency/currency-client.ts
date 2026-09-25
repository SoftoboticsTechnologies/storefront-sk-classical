'use client';

import {getCurrencyCookie, setCurrencyCookie} from './currency';
import {getActiveChannel} from '@/platform/vendure/channel-client';

/**
 * Client-side counterpart to features/currency/currency-server.ts#getActiveCurrencyCode.
 * Same validation rule: an invalid/stale cookie value is never trusted, it
 * falls back to the channel default (see docs/decisions.md, 2026-08-29 entry).
 */
export async function getActiveCurrencyCode(): Promise<string> {
    const channel = await getActiveChannel();
    const cookieValue = await getCurrencyCookie();

    if (cookieValue && (channel.availableCurrencyCodes as string[]).includes(cookieValue)) {
        return cookieValue;
    }

    return channel.defaultCurrencyCode;
}

export {setCurrencyCookie};
