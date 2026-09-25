import {createNavigation} from 'next-intl/navigation';
import {routing} from './routing';
import {ComponentProps} from 'react';

const navigation = createNavigation(routing);

/**
 * Wraps next-intl's Link to default `prefetch` to `false`.
 *
 * Next.js 16's default Link prefetch (client segment cache) requests RSC
 * payload paths that don't match what `output: 'export'` writes to disk —
 * a confirmed upstream bug (vercel/next.js#85374, #92341) that fires a
 * storm of 404s for every rendered link, not just dynamic product/collection
 * routes. Defaulting prefetch off here (rather than passing it at every call
 * site) closes the hole app-wide; a call site can still opt back in with an
 * explicit `prefetch` prop once Next ships a fix. See docs/decisions.md.
 */
function Link({prefetch = false, ...props}: ComponentProps<typeof navigation.Link>) {
    return <navigation.Link prefetch={prefetch} {...props} />;
}

export const {redirect, usePathname, useRouter, getPathname} = navigation;
export {Link};
