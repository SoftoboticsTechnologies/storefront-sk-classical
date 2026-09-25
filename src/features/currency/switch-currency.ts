'use client';

import {setCurrencyCookie} from '@/features/currency/currency';
import {getActiveChannel} from '@/platform/vendure/channel-client';

export async function switchCurrency(currencyCode: string) {
    const channel = await getActiveChannel();
    if (!(channel.availableCurrencyCodes as string[]).includes(currencyCode)) {
        throw new Error('Invalid currency code');
    }

    await setCurrencyCookie(currencyCode);
    // No server data cache to invalidate under static export — every
    // currency-dependent client component (price/stock, cart, checkout)
    // reads the cookie itself, so a full reload is the simplest way to
    // guarantee everything currently on screen re-fetches with the new
    // currency (mirrors the old router.refresh() behavior).
    window.location.reload();
}
