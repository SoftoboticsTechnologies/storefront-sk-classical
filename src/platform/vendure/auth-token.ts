'use client';

// Static export has no server to set an httpOnly cookie from, so the bearer
// token is kept in localStorage instead. This is a deliberate security
// trade-off (XSS-readable token) accepted for the S3+CloudFront migration —
// see docs/decisions.md. AUTH_TOKEN_CHANGED_EVENT lets components (e.g. the
// auth context) react to login/logout without a full page reload.
const AUTH_TOKEN_STORAGE_KEY = process.env.NEXT_PUBLIC_VENDURE_AUTH_TOKEN_STORAGE_KEY || 'vendure-auth-token';
export const AUTH_TOKEN_CHANGED_EVENT = 'vendure-auth-token-changed';

function isBrowser() {
    return typeof window !== 'undefined';
}

export async function setAuthToken(token: string) {
    if (!isBrowser()) return;
    window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
    window.dispatchEvent(new CustomEvent(AUTH_TOKEN_CHANGED_EVENT, {detail: {token}}));
}

export async function getAuthToken(): Promise<string | undefined> {
    if (!isBrowser()) return undefined;
    return window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY) ?? undefined;
}

export async function removeAuthToken() {
    if (!isBrowser()) return;
    window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent(AUTH_TOKEN_CHANGED_EVENT, {detail: {token: undefined}}));
}
