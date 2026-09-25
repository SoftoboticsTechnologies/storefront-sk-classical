'use client';

import {useEffect, type ReactNode} from 'react';
import {Loader2} from 'lucide-react';
import {useAuth} from '@/features/authentication/auth-context';
import {useRouter} from '@/platform/i18n/navigation';
import {AccountNavLinks} from '@/features/account/components/account-nav-links';

const navItems = [
    {href: '/account/orders', labelKey: 'orders', icon: 'Package'},
    {href: '/account/addresses', labelKey: 'addresses', icon: 'MapPin'},
    {href: '/account/profile', labelKey: 'profile', icon: 'User'},
];

/**
 * Client-side guard for the whole `/account` section. Previously each page
 * that needed an authenticated customer did its own server-side
 * `redirect({href:'/sign-in'})` check (see e.g. account/routes/orders/page.tsx,
 * owned separately). There is no server-side session to check anymore, so
 * this centralizes the same behavior as a client check on the auth context.
 */
export function AccountLayoutClient({children}: {children: ReactNode}) {
    const {customer, isLoading} = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !customer) {
            router.push('/sign-in');
        }
    }, [isLoading, customer, router]);

    if (isLoading) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!customer) {
        // Redirecting via the effect above.
        return null;
    }

    return (
        <div className="container mx-auto px-4 py-30">
            {/* Mobile: horizontal tab bar */}
            <div className="md:hidden mb-6">
                <AccountNavLinks items={navItems} layout="horizontal" />
            </div>

            <div className="flex gap-8">
                {/* Desktop: sidebar */}
                <aside className="hidden md:block w-64 shrink-0">
                    <AccountNavLinks items={navItems} layout="vertical" />
                </aside>
                <main className="flex-1 min-w-0">
                    {children}
                </main>
            </div>
        </div>
    );
}
