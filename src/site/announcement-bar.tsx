import {Suspense} from "react";
import {NavigationLink} from '@/site/navigation/navigation-link';
import {BrandLogo} from '@/site/brand-logo';
import {NavbarCart} from '@/site/navigation/navbar/navbar-cart';
import {NavbarUser} from '@/site/navigation/navbar/navbar-user';
import {CurrencyPickerWrapper} from '@/site/navigation/navbar/currency-picker-wrapper';
import {NavbarUserSkeleton} from '@/site/navigation/skeletons/navbar-user-skeleton';
import {SearchInput} from '@/site/navigation/search-input';
import {SearchInputSkeleton} from '@/site/navigation/skeletons/search-input-skeleton';

// Ghost buttons assume a light surface; recolour them for the primary-coloured bar.
const onPrimaryButtons = "[&_[data-slot=button]]:text-primary-foreground [&_[data-slot=button]:hover]:bg-primary-foreground/15 [&_[data-slot=button]:hover]:text-primary-foreground [&_[data-slot=button][aria-expanded=true]]:bg-primary-foreground/15";

/**
 * Top brand bar: logo, search and account/cart. Scrolls away with the page;
 * only the menu row in `navbar.tsx` stays pinned.
 */
export function AnnouncementBar() {
    return (
        <div className="bg-primary text-primary-foreground">
            {/* Narrower than `container` so logo, search and actions read as one group. */}
            <div className="mx-auto max-w-6xl px-4 md:px-6 h-16 md:h-[4.5rem] grid grid-cols-[auto_1fr_auto] items-center gap-3 md:gap-8">
                <NavigationLink href="/" className="shrink-0">
                    <BrandLogo className="h-12" priority onPrimary />
                </NavigationLink>

                <div className="flex justify-center min-w-0">
                    <Suspense fallback={<SearchInputSkeleton />}>
                        <SearchInput/>
                    </Suspense>
                </div>

                <div className={`flex items-center gap-1 md:gap-2 ${onPrimaryButtons}`}>
                    <Suspense>
                        <CurrencyPickerWrapper />
                    </Suspense>
                    <Suspense fallback={<NavbarUserSkeleton />}>
                        <NavbarUser/>
                    </Suspense>
                    <span className="hidden md:block h-6 w-px bg-primary-foreground/25" aria-hidden="true" />
                    <Suspense>
                        <NavbarCart/>
                    </Suspense>
                </div>
            </div>
        </div>
    );
}
