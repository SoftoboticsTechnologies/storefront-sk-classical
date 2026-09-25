import {query} from './api';
import {GetActiveChannelQuery} from './channel-graphql';

/**
 * Get the active channel. Runs only at build time under static export (no
 * per-request server left to cache against).
 * Channel configuration is language-independent, so no locale is required.
 */
export async function getActiveChannel() {
    const result = await query(GetActiveChannelQuery);
    return result.data.activeChannel;
}
