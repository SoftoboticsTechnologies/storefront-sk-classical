'use client';

import {query} from './client-api';
import {GetActiveChannelQuery} from './channel-graphql';

/**
 * Client-side counterpart to platform/vendure/channel.ts#getActiveChannel.
 * No build-time/server cache under static export, so the result is memoized
 * in a module-level singleton promise for the lifetime of the page — every
 * caller (product info, every product card's price, etc.) shares the same
 * in-flight/resolved request instead of each firing its own. This is what
 * was causing a dozen-plus redundant `GetActiveChannelQuery` calls per
 * product page load (see docs/decisions.md, 2026-09-03 entry).
 */
let activeChannelPromise: ReturnType<typeof fetchActiveChannel> | null = null;

async function fetchActiveChannel() {
    const result = await query(GetActiveChannelQuery);
    return result.data.activeChannel;
}

export function getActiveChannel() {
    if (!activeChannelPromise) {
        activeChannelPromise = fetchActiveChannel().catch((error) => {
            // Don't cache a rejected promise — allow a retry on next call.
            activeChannelPromise = null;
            throw error;
        });
    }
    return activeChannelPromise;
}
