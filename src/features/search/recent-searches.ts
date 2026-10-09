'use client';

import {useSyncExternalStore} from 'react';

// Per-browser convenience only: the last few submitted search terms, kept in
// localStorage. Never product data — just the strings the viewer typed.
const STORAGE_KEY = 'sk-recent-searches';
const CHANGED_EVENT = 'sk-recent-searches-changed';
const MAX_ENTRIES = 5;

const EMPTY: string[] = [];
let cachedRaw: string | null = null;
let cachedTerms: string[] = EMPTY;

function readRaw(): string | null {
    try {
        return window.localStorage.getItem(STORAGE_KEY);
    } catch {
        return null;
    }
}

function getRecentSearches(): string[] {
    if (typeof window === 'undefined') return EMPTY;
    const raw = readRaw();
    if (raw !== cachedRaw) {
        cachedRaw = raw;
        try {
            const parsed: unknown = raw ? JSON.parse(raw) : [];
            cachedTerms = Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === 'string') : EMPTY;
        } catch {
            cachedTerms = EMPTY;
        }
    }
    return cachedTerms;
}

function write(terms: string[]) {
    try {
        if (terms.length) {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(terms));
        } else {
            window.localStorage.removeItem(STORAGE_KEY);
        }
    } catch {
        // Storage blocked (private mode etc.) — recents just won't persist.
    }
    window.dispatchEvent(new CustomEvent(CHANGED_EVENT));
}

/** Moves `term` to the front (case-insensitive de-dupe), keeping the newest few. */
export function addRecentSearch(term: string) {
    const trimmed = term.trim();
    if (!trimmed) return;
    const lower = trimmed.toLowerCase();
    write([trimmed, ...getRecentSearches().filter((t) => t.toLowerCase() !== lower)].slice(0, MAX_ENTRIES));
}

export function clearRecentSearches() {
    write([]);
}

function subscribe(onChange: () => void) {
    window.addEventListener(CHANGED_EVENT, onChange);
    window.addEventListener('storage', onChange);
    return () => {
        window.removeEventListener(CHANGED_EVENT, onChange);
        window.removeEventListener('storage', onChange);
    };
}

export function useRecentSearches(): string[] {
    return useSyncExternalStore(subscribe, getRecentSearches, () => EMPTY);
}
