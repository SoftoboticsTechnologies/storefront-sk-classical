'use client';

import {useState} from 'react';
import { Link } from '@/platform/i18n/navigation';
import {Menu, Search, ShoppingBag, User, Package, MapPin} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {SearchOverlay} from '@/site/navigation/navbar/search-overlay';
import {
    Sheet,
    SheetTrigger,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetClose,
} from '@/components/ui/sheet';
import {
    Accordion,
    AccordionItem,
    AccordionTrigger,
    AccordionContent,
} from '@/components/ui/accordion';
import {useTranslations} from 'next-intl';

interface Collection {
    id: string;
    name: string;
    slug: string;
    children?: Collection[] | null;
}

interface MobileNavProps {
    collections: Collection[];
}

export function MobileNav({collections}: MobileNavProps) {
    const t = useTranslations('Navigation');
    const [open, setOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);

    const handleLinkClick = () => {
        setOpen(false);
    };

    const handleSearchTrigger = () => {
        setOpen(false);
        setSearchOpen(true);
    };

    return (
        <>
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger render={<Button variant="ghost" size="icon" className="md:hidden" />}>
                <Menu className="size-5" />
                <span className="sr-only">{t('openMenu')}</span>
            </SheetTrigger>
            <SheetContent side="left" className="w-full sm:max-w-sm overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>{t('menu')}</SheetTitle>
                </SheetHeader>

                <div className="flex flex-col gap-6 px-4 pb-6">
                    {/* Search */}
                    <button
                        type="button"
                        onClick={handleSearchTrigger}
                        className="relative flex items-center rounded-md border border-input bg-transparent px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent"
                    >
                        <Search className="mr-2 h-4 w-4 shrink-0" />
                        <span className="truncate">{t('searchProducts')}</span>
                    </button>

                    {/* Shop All */}
                    <div>
                        <SheetClose
                            render={
                                <Link
                                    href="/search"
                                    className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md hover:bg-accent transition-colors"
                                />
                            }
                            nativeButton={false}
                            onClick={handleLinkClick}
                        >
                            <ShoppingBag className="h-5 w-5" />
                            {t('shopAll')}
                        </SheetClose>
                    </div>

                    {/* Collections */}
                    {collections.length > 0 && (
                        <div>
                            <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                {t('collections')}
                            </p>
                            <nav className="flex flex-col gap-0.5">
                                {collections.map((collection) => {
                                    const children = collection.children ?? [];
                                    if (children.length === 0) {
                                        return (
                                            <SheetClose
                                                key={collection.slug}
                                                render={
                                                    <Link
                                                        href={`/collection/${collection.slug}`}
                                                        prefetch={false}
                                                        className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md hover:bg-accent transition-colors"
                                                    />
                                                }
                                                nativeButton={false}
                                                onClick={handleLinkClick}
                                            >
                                                {collection.name}
                                            </SheetClose>
                                        );
                                    }

                                    return (
                                        <Accordion key={collection.slug}>
                                            <AccordionItem value={collection.slug}>
                                                <AccordionTrigger className="px-3 py-2.5 hover:no-underline">
                                                    {collection.name}
                                                </AccordionTrigger>
                                                <AccordionContent>
                                                    <div className="flex flex-col gap-0.5 pl-3">
                                                        <SheetClose
                                                            render={
                                                                <Link
                                                                    href={`/collection/${collection.slug}`}
                                                                    prefetch={false}
                                                                    className="px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors"
                                                                />
                                                            }
                                                            nativeButton={false}
                                                            onClick={handleLinkClick}
                                                        >
                                                            {t('viewAll')}
                                                        </SheetClose>
                                                        {children.map((child) => (
                                                            <SheetClose
                                                                key={child.slug}
                                                                render={
                                                                    <Link
                                                                        href={`/collection/${child.slug}`}
                                                                        prefetch={false}
                                                                        className="px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors"
                                                                    />
                                                                }
                                                                nativeButton={false}
                                                                onClick={handleLinkClick}
                                                            >
                                                                {child.name}
                                                            </SheetClose>
                                                        ))}
                                                    </div>
                                                </AccordionContent>
                                            </AccordionItem>
                                        </Accordion>
                                    );
                                })}
                            </nav>
                        </div>
                    )}

                    {/* Account links */}
                    <div>
                        <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            {t('account')}
                        </p>
                        <nav className="flex flex-col gap-0.5">
                            <SheetClose
                                render={
                                    <Link
                                        href="/account/profile"
                                        className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md hover:bg-accent transition-colors"
                                    />
                                }
                                nativeButton={false}
                                onClick={handleLinkClick}
                            >
                                <User className="h-5 w-5" />
                                {t('profile')}
                            </SheetClose>
                            <SheetClose
                                render={
                                    <Link
                                        href="/account/orders"
                                        className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md hover:bg-accent transition-colors"
                                    />
                                }
                                nativeButton={false}
                                onClick={handleLinkClick}
                            >
                                <Package className="h-5 w-5" />
                                {t('orders')}
                            </SheetClose>
                            <SheetClose
                                render={
                                    <Link
                                        href="/account/addresses"
                                        className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md hover:bg-accent transition-colors"
                                    />
                                }
                                nativeButton={false}
                                onClick={handleLinkClick}
                            >
                                <MapPin className="h-5 w-5" />
                                {t('addresses')}
                            </SheetClose>
                        </nav>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
        <SearchOverlay open={searchOpen} onOpenChange={setSearchOpen} />
        </>
    );
}
