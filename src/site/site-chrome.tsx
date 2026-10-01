'use client';

import type {ReactNode} from 'react';
import {usePathname} from '@/platform/i18n/navigation';

const AUTH_PATHS = new Set(['/sign-in', '/login', '/register']);

interface SiteChromeProps {
    header: ReactNode;
    footer: ReactNode;
    children: ReactNode;
}

export function SiteChrome({header, footer, children}: SiteChromeProps) {
    const pathname = usePathname();
    const route = pathname.replace(/\/$/, '').split('/').at(-1);
    const showChrome = !AUTH_PATHS.has(`/${route}`);

    return (
        <>
            {showChrome && header}
            {children}
            {showChrome && footer}
        </>
    );
}
