import {getActiveChannel} from '@/platform/vendure/channel';

/**
 * Get the active currency code for build-time (server) use.
 *
 * Static export has no per-request cycle at build time, so there is no
 * cookie to read here — the currency cookie is now read client-side only
 * (see `./currency`, `'use client'`). This always resolves to the real
 * channel default currency (never hardcoded/assumed). Any per-request/
 * per-user currency override happens client-side via
 * `currency-client.ts#getActiveCurrencyCode()`.
 */
export async function getActiveCurrencyCode(): Promise<string> {
    const channel = await getActiveChannel();
    return channel.defaultCurrencyCode;
}
