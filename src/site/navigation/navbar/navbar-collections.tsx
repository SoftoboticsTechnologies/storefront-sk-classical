import Image from 'next/image';
import {getTranslations} from 'next-intl/server';
import {getRouteLocale} from '@/platform/i18n/server';
import {getRootCollections} from '@/features/collections/data';
import {formatCollectionName, getCollectionHref, getCollectionPathSlug} from '@/features/collections/utils';
import {NavigationLink} from '@/site/navigation/navigation-link';
import {
    NavigationMenu,
    NavigationMenuList,
    NavigationMenuItem,
    NavigationMenuTrigger,
    NavigationMenuContent,
    NavigationMenuLink,
} from '@/components/ui/navigation-menu';
import {NavbarLink} from '@/site/navigation/navbar/navbar-link';

const itemClass = "px-2.5 2xl:px-4 uppercase tracking-[0.08em] 2xl:tracking-[0.12em] text-sm font-semibold";
const triggerClass = `bg-transparent hover:bg-transparent focus:bg-transparent data-popup-open:bg-transparent data-open:bg-transparent hover:text-primary ${itemClass}`;
const panelLinkClass = "uppercase tracking-[0.08em] text-sm font-semibold";

export async function NavbarCollections() {
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'Navigation'});

    const collections = await getRootCollections(locale);

    return (
        <NavigationMenu>
            <NavigationMenuList>
                <NavigationMenuItem>
                    <NavbarLink href="/" className={itemClass}>
                        {t('home')}
                    </NavbarLink>
                </NavigationMenuItem>

                {collections.length > 0 && (
                    <NavigationMenuItem>
                        <NavigationMenuTrigger className={triggerClass}>
                            {t('shop')}
                        </NavigationMenuTrigger>
                        <NavigationMenuContent>
                            <div className="grid w-[min(52rem,90vw)] grid-cols-4 gap-6 p-2">
                                {collections.map((collection) => (
                                    <div key={collection.id} className="space-y-1">
                                        <NavigationMenuLink
                                            render={<NavigationLink href={getCollectionHref(collection)} prefetch={false} />}
                                            className="font-serif text-lg font-semibold text-primary dark:text-gold"
                                        >
                                            {formatCollectionName(collection.name)}
                                        </NavigationMenuLink>
                                        {(collection.children ?? []).filter((child) => child.slug).map((child) => (
                                            <NavigationMenuLink
                                                key={child.id}
                                                render={<NavigationLink href={`/collection/${child.slug}`} prefetch={false} />}
                                                className={panelLinkClass}
                                            >
                                                {formatCollectionName(child.name)}
                                            </NavigationMenuLink>
                                        ))}
                                    </div>
                                ))}
                            </div>
                            <div className="mt-2 border-t border-gold/30 px-2 pt-2">
                                <NavigationMenuLink
                                    render={<NavigationLink href="/search" />}
                                    className={panelLinkClass}
                                >
                                    {t('allProducts')}
                                </NavigationMenuLink>
                            </div>
                        </NavigationMenuContent>
                    </NavigationMenuItem>
                )}

                {collections.map((collection) => {
                    const children = (collection.children ?? []).filter((child) => child.slug);
                    if (children.length === 0) {
                        return (
                            <NavigationMenuItem key={collection.id}>
                                <NavbarLink href={getCollectionHref(collection)} prefetch={false} className={itemClass}>
                                    {formatCollectionName(collection.name)}
                                </NavbarLink>
                            </NavigationMenuItem>
                        );
                    }

                    return (
                        <NavigationMenuItem key={collection.id}>
                            <NavigationMenuTrigger className={triggerClass}>
                                {formatCollectionName(collection.name)}
                            </NavigationMenuTrigger>
                            <NavigationMenuContent>
                                <ul className="grid w-56 gap-1">
                                    {/* Parent page first, then its subcategories. Grouping-only
                                        parents (no Vendure slug) get a name-derived page. */}
                                    {getCollectionPathSlug(collection) && (
                                        <li className="mb-1 border-b border-gold/30 pb-1">
                                            <NavigationMenuLink
                                                render={<NavigationLink href={getCollectionHref(collection)} prefetch={false} />}
                                                className={`${panelLinkClass} text-primary dark:text-gold`}
                                            >
                                                {t('viewAll')} {formatCollectionName(collection.name)}
                                            </NavigationMenuLink>
                                        </li>
                                    )}
                                    {children.map((child) => (
                                        <li key={child.id}>
                                            <NavigationMenuLink
                                                render={
                                                    <NavigationLink href={`/collection/${child.slug}`} prefetch={false} />
                                                }
                                                className={panelLinkClass}
                                            >
                                                {child.featuredAsset?.preview && (
                                                    <Image
                                                        src={`${child.featuredAsset.preview}?preset=thumb`}
                                                        alt=""
                                                        width={32}
                                                        height={32}
                                                        className="rounded-sm object-cover"
                                                    />
                                                )}
                                                {formatCollectionName(child.name)}
                                            </NavigationMenuLink>
                                        </li>
                                    ))}
                                </ul>
                            </NavigationMenuContent>
                        </NavigationMenuItem>
                    );
                })}

                <NavigationMenuItem>
                    <NavigationMenuTrigger className={triggerClass}>
                        {t('more')}
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                        <ul className="grid w-48 gap-1">
                            <li>
                                <NavigationMenuLink render={<NavigationLink href="/new-arrivals" />} className={panelLinkClass}>
                                    {t('newArrivals')}
                                </NavigationMenuLink>
                            </li>
                            <li>
                                <NavigationMenuLink render={<NavigationLink href="/search" />} className={panelLinkClass}>
                                    {t('allProducts')}
                                </NavigationMenuLink>
                            </li>
                        </ul>
                    </NavigationMenuContent>
                </NavigationMenuItem>
            </NavigationMenuList>
        </NavigationMenu>
    );
}
