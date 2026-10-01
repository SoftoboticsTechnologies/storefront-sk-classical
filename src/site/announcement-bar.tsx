import {Suspense} from "react";
import {NavigationLink} from '@/site/navigation/navigation-link';
import {BrandLogo} from '@/site/brand-logo';
import {NavbarCart} from '@/site/navigation/navbar/navbar-cart';
import {NavbarWishlist} from '@/site/navigation/navbar/navbar-wishlist';
import {NavbarUser} from '@/site/navigation/navbar/navbar-user';
import {CurrencyPickerWrapper} from '@/site/navigation/navbar/currency-picker-wrapper';
import {NavbarUserSkeleton} from '@/site/navigation/skeletons/navbar-user-skeleton';
import {SearchInput} from '@/site/navigation/search-input';
import {SearchInputSkeleton} from '@/site/navigation/skeletons/search-input-skeleton';
import {FindStoreLink} from '@/site/navigation/find-store-link';

// Ghost buttons assume a light surface; recolour them for the primary-coloured bar.
const onPrimaryButtons = "[&_[data-slot=button]]:text-primary-foreground [&_[data-slot=button]:hover]:bg-primary-foreground/15 [&_[data-slot=button]:hover]:text-primary-foreground [&_[data-slot=button][aria-expanded=true]]:bg-primary-foreground/15";

/**
 * Top brand bar: logo, find-store link, search and account/cart. Scrolls away with the page;
 * only the menu row in `navbar.tsx` stays pinned.
 */
export function AnnouncementBar() {
    return (
        <div className="bg-primary text-primary-foreground">
            {/* Narrower than `container` so logo, search and actions read as one group. */}
            <div className="mx-auto max-w-6xl px-4 md:px-6 grid grid-cols-[minmax(0,1fr)_auto] grid-rows-[3rem_2.5rem] items-center gap-x-2 gap-y-1 py-1 sm:h-16 sm:grid-cols-[auto_1fr_auto] sm:grid-rows-1 sm:gap-x-3 sm:gap-y-0 sm:py-0 md:h-[4.5rem] md:gap-8">
                <NavigationLink href="/" className="row-start-1 col-start-1 shrink-0 sm:row-auto sm:col-auto">
                    <BrandLogo className="h-10 sm:h-12" priority onPrimary />
                </NavigationLink>

                <div className="row-start-2 col-span-2 flex min-w-0 items-center justify-center gap-2 sm:row-auto sm:col-span-1 md:gap-4">
                    <FindStoreLink/>
                    <Suspense fallback={<SearchInputSkeleton />}>
                        <SearchInput/>
                    </Suspense>
                </div>

                <div className={`row-start-1 col-start-2 flex items-center gap-0 sm:row-auto sm:col-auto sm:gap-1 md:gap-2 ${onPrimaryButtons}`}>
                    <Suspense>
                        <CurrencyPickerWrapper />
                    </Suspense>
                    <Suspense fallback={<NavbarUserSkeleton />}>
                        <NavbarUser/>
                    </Suspense>
                    <span className="hidden md:block h-6 w-px bg-primary-foreground/25" aria-hidden="true" />
                    <Suspense>
                        <NavbarWishlist/>
                    </Suspense>
                    <Suspense>
                        <NavbarCart/>
                    </Suspense>
                </div>
            </div>
        </div>
    );
}
