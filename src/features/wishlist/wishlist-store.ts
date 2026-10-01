'use client';

import {useSyncExternalStore} from 'react';

// Browser-only wishlist: Vendure has no wishlist entity, so saved products live
// in localStorage as product slugs. Only slugs are stored — names, images and
// prices are always fetched live from Vendure when the list is shown.
const STORAGE_KEY = 'sk-wishlist';
export const WISHLIST_CHANGED_EVENT = 'sk-wishlist-changed';

const EMPTY: string[] = [];
let cachedRaw: string | null = null;
let cachedSlugs: string[] = EMPTY;

function readRaw(): string | null {
    try {
        return window.localStorage.getItem(STORAGE_KEY);
    } catch {
        return null;
    }
}

/** Current saved slugs, newest first. Same array reference until storage changes. */
export function getWishlist(): string[] {
    if (typeof window === 'undefined') return EMPTY;
    const raw = readRaw();
    if (raw !== cachedRaw) {
        cachedRaw = raw;
        try {
            const parsed: unknown = raw ? JSON.parse(raw) : [];
            cachedSlugs = Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === 'string') : EMPTY;
        } catch {
            cachedSlugs = EMPTY;
        }
    }
    return cachedSlugs;
}

function write(slugs: string[]) {
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(slugs));
    } catch {
        // Storage blocked (private mode etc.) — the toggle just won't persist.
    }
    window.dispatchEvent(new CustomEvent(WISHLIST_CHANGED_EVENT));
}

/** Adds or removes `slug`; returns true when it is now saved. */
export function toggleWishlist(slug: string): boolean {
    const current = getWishlist();
    const saved = current.includes(slug);
    write(saved ? current.filter((s) => s !== slug) : [slug, ...current]);
    return !saved;
}

/** Drops slugs Vendure no longer returns a product for. */
export function pruneWishlist(missing: string[]) {
    if (missing.length === 0) return;
    write(getWishlist().filter((s) => !missing.includes(s)));
}

function subscribe(onChange: () => void) {
    window.addEventListener(WISHLIST_CHANGED_EVENT, onChange);
    // Keeps other tabs in sync.
    window.addEventListener('storage', onChange);
    return () => {
        window.removeEventListener(WISHLIST_CHANGED_EVENT, onChange);
        window.removeEventListener('storage', onChange);
    };
}

/** Saved slugs; empty during static render/hydration, then the stored list. */
export function useWishlist(): string[] {
    return useSyncExternalStore(subscribe, getWishlist, () => EMPTY);
}
