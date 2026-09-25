'use client';

// Static export has no server to set cookies from a request/response cycle,
// so this now reads/writes document.cookie directly in the browser. Same
// cookie name/attributes as before so nothing else needs to change.
const CURRENCY_COOKIE = 'vendure-currency';

function isBrowser() {
    return typeof document !== 'undefined';
}

export async function setCurrencyCookie(currencyCode: string) {
    if (!isBrowser()) return;
    const maxAge = 60 * 60 * 24 * 365;
    document.cookie = `${CURRENCY_COOKIE}=${encodeURIComponent(currencyCode)}; path=/; max-age=${maxAge}; samesite=lax`;
}

export async function getCurrencyCookie(): Promise<string | undefined> {
    if (!isBrowser()) return undefined;
    const match = document.cookie
        .split('; ')
        .find((row) => row.startsWith(`${CURRENCY_COOKIE}=`));
    return match ? decodeURIComponent(match.split('=')[1]) : undefined;
}
