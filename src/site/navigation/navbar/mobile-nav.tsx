'use client';

import {useState} from 'react';
import {Link, usePathname} from '@/platform/i18n/navigation';
import {cn} from '@/lib/utils';
import {isCategoryActive} from '@/site/navigation/navbar/mobile-category-strip-list';
import {ArrowRight, ChevronRight, Menu, Search, ShoppingBag, Sparkles, User, Package, MapPin} from 'lucide-react';
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
import {formatCollectionName, getCollectionHref, getCollectionPathSlug} from '@/features/collections/utils';

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
    const pathname = usePathname();

    const categoryChips = [
        ...collections.map((collection) => ({
            key: collection.id,
            href: getCollectionHref(collection),
            label: formatCollectionName(collection.name),
        })),
        {key: 'new-arrivals', href: '/new-arrivals', label: t('newArrivals')},
    ];

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
            <SheetTrigger render={<Button variant="ghost" size="icon" className="xl:hidden" />}>
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

                    {/* Category chips — mirrors the pinned mobile strip */}
                    <div>
                        <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            {t('shopByCategory')}
                        </p>
                        <ul className="flex flex-wrap gap-2 px-1">
                            {categoryChips.map((chip) => {
                                const active = isCategoryActive(pathname, chip.href);
                                return (
                                    <li key={chip.key}>
                                        <SheetClose
                                            render={
                                                <Link
                                                    href={chip.href}
                                                    aria-current={active ? 'page' : undefined}
                                                    className={cn(
                                                        'inline-flex h-9 items-center rounded-full border px-4 text-xs font-semibold uppercase tracking-[0.08em] no-underline transition-colors active:scale-[0.97]',
                                                        active
                                                            ? 'border-primary bg-primary text-primary-foreground'
                                                            : 'border-gold/40 text-foreground/85 hover:border-primary hover:text-primary',
                                                    )}
                                                />
                                            }
                                            nativeButton={false}
                                            onClick={handleLinkClick}
                                        >
                                            {chip.label}
                                        </SheetClose>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>

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
                        <SheetClose
                            render={
                                <Link
                                    href="/new-arrivals"
                                    className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md hover:bg-accent transition-colors"
                                />
                            }
                            nativeButton={false}
                            onClick={handleLinkClick}
                        >
                            <Sparkles className="h-5 w-5" />
                            {t('newArrivals')}
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
                                                key={collection.id}
                                                render={
                                                    <Link
                                                        href={getCollectionHref(collection)}
                                                        prefetch={false}
                                                        className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md hover:bg-accent transition-colors"
                                                    />
                                                }
                                                nativeButton={false}
                                                onClick={handleLinkClick}
                                            >
                                                {formatCollectionName(collection.name)}
                                            </SheetClose>
                                        );
                                    }

                                    return (
                                        <Accordion key={collection.id}>
                                            <AccordionItem value={collection.id}>
                                                <AccordionTrigger className="px-3 py-2.5 hover:no-underline">
                                                    {formatCollectionName(collection.name)}
                                                </AccordionTrigger>
                                                <AccordionContent className="pb-2 [&_a]:no-underline">
                                                    <div className="ml-4 flex flex-col gap-0.5 border-l border-gold/40 pl-2">
                                                        {getCollectionPathSlug(collection) && (
                                                            <SheetClose
                                                                render={
                                                                    <Link
                                                                        href={getCollectionHref(collection)}
                                                                        prefetch={false}
                                                                        className="group/sub flex items-center justify-between rounded-md px-3 py-2 text-sm font-semibold text-primary transition-colors hover:bg-gold/10"
                                                                    />
                                                                }
                                                                nativeButton={false}
                                                                onClick={handleLinkClick}
                                                            >
                                                                {t('viewAll')}
                                                                <ArrowRight className="size-4 text-gold transition-transform group-hover/sub:translate-x-0.5" />
                                                            </SheetClose>
                                                        )}
                                                        {children.filter((child) => child.slug).map((child) => (
                                                            <SheetClose
                                                                key={child.slug}
                                                                render={
                                                                    <Link
                                                                        href={`/collection/${child.slug}`}
                                                                        prefetch={false}
                                                                        className="group/sub flex items-center justify-between rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-gold/10 hover:text-foreground"
                                                                    />
                                                                }
                                                                nativeButton={false}
                                                                onClick={handleLinkClick}
                                                            >
                                                                {formatCollectionName(child.name)}
                                                                <ChevronRight className="size-4 text-gold/70 opacity-0 transition-all group-hover/sub:translate-x-0.5 group-hover/sub:opacity-100" />
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
