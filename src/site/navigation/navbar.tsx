import {NavbarCollections} from '@/site/navigation/navbar/navbar-collections';
import {MobileNavWrapper} from '@/site/navigation/navbar/mobile-nav-wrapper';
import {MobileCategoryStrip} from '@/site/navigation/navbar/mobile-category-strip';
import {Suspense} from "react";

/**
 * Pinned menu row. Logo, search, account and cart live in the scrolling top bar
 * (`site/announcement-bar.tsx`); this row only carries the centred menu and
 * the mobile menu trigger (plus a scrollable category strip below `xl`).
 */
export function Navbar() {
    return (
        // Sticky (not fixed) so the top bar above can scroll away. -mb-16
        // cancels its flow height, keeping the mt-16 offset pages already use.
        <header className="sticky top-0 z-50 -mb-16 border-b border-gold/30 backdrop-blur-md bg-background/85">
            <div className="container mx-auto px-4">
                <div className="relative flex items-center gap-2 xl:justify-center h-16">
                    <div className="flex shrink-0 items-center xl:absolute xl:left-0">
                        <Suspense>
                            <MobileNavWrapper />
                        </Suspense>
                    </div>
                    <div className="flex min-w-0 flex-1 xl:hidden">
                        <Suspense>
                            <MobileCategoryStrip/>
                        </Suspense>
                    </div>
                    <nav className="hidden xl:flex items-center">
                        <Suspense>
                            <NavbarCollections/>
                        </Suspense>
                    </nav>
                </div>
            </div>
        </header>
    );
}
