import Image from "next/image";
import {ChevronRight, Mail, MapPin, Phone} from "lucide-react";
import {getRouteLocale} from '@/platform/i18n/server';
import {getRootCollections} from '@/features/collections/data';
import {formatCollectionName, getCollectionHref} from '@/features/collections/utils';
import {NavigationLink} from '@/site/navigation/navigation-link';
import {BRAND} from '@/site/brand';
import {WhatsAppIcon} from '@/components/icons/whatsapp-icon';
import {FacebookIcon, InstagramIcon} from '@/site/social-icons';
import {SITE_NAME} from '@/config/metadata';
import {StoreLocatorIcon} from '@/site/navigation/find-store-link';
import {getTranslations} from 'next-intl/server';


const COPYRIGHT_YEAR = 2026;

// Official artwork from Wikimedia Commons, stored in public/images/payments.
const PAYMENT_LOGOS = [
    {src: '/images/payments/phonepe.svg', name: 'PhonePe'},
    {src: '/images/payments/googlepay.svg', name: 'Google Pay'},
    {src: '/images/payments/paytm.svg', name: 'Paytm'},
    {src: '/images/payments/upi.svg', name: 'UPI'},
    {src: '/images/payments/rupay.svg', name: 'RuPay'},
    {src: '/images/payments/mastercard.svg', name: 'Mastercard'},
    {src: '/images/payments/visa.svg', name: 'Visa'},
];

const linkClass = "hover:text-gold transition-colors";
const headingClass = "font-serif text-lg font-semibold text-gold mb-4";

const POLICY_LINKS = [
    {href: '/about-us', key: 'aboutUs'},
    {href: '/privacy-policy', key: 'privacyPolicy'},
    {href: '/return-policy', key: 'returnPolicy'},
    {href: '/shipping-policy', key: 'shippingPolicy'},
    {href: '/terms-and-conditions', key: 'terms'},
] as const;

export async function Footer() {
    const locale = await getRouteLocale();

    const t = await getTranslations({locale, namespace: 'Footer'});
    const tNav = await getTranslations({locale, namespace: 'Navigation'});
    const collections = await getRootCollections(locale);
    const {contact} = BRAND;

    return (
        <footer className="mt-auto bg-[#2a0a0e] text-white/75">
            <div className="h-1 bg-gradient-to-r from-transparent via-gold to-transparent opacity-70" />
            <div className="container mx-auto px-6 md:px-10 lg:px-12 pt-14 pb-10">
                {/* Phones: link columns pair up (2-col), tablets/small laptops: 3-col, wide desktop: 5-col
                    (below xl the 5th column is too narrow for the phone number and email). */}
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-[1.4fr_1fr_1fr_1fr_1.2fr] gap-x-6 gap-y-10 xl:gap-10">
                    <div className="col-span-2 md:col-span-3 xl:col-span-1 xl:row-span-2">
                        <NavigationLink href="/" className="inline-block mb-3">
                            {/* Footer is always dark, so always use the white artwork. */}
                            <Image src={BRAND.logo.dark} alt={SITE_NAME} width={BRAND.logo.width} height={BRAND.logo.height} className="h-20 w-auto" />
                        </NavigationLink>
                        <p className="mb-4 text-xs uppercase tracking-[0.2em] text-gold">{t('tagline')}</p>
                        <p className="text-sm leading-relaxed text-balance">
                            {t('description')}
                        </p>

                        <div className="mt-6 flex items-center gap-3">
                            {[
                                {href: BRAND.social.facebook, label: 'Facebook', Icon: FacebookIcon},
                                {href: BRAND.social.instagram, label: 'Instagram', Icon: InstagramIcon},
                            ].map(({href, label, Icon}) => (
                                <a
                                    key={label}
                                    href={href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={label}
                                    className="flex size-10 items-center justify-center rounded-md bg-white shadow-sm ring-1 ring-white/20 transition hover:-translate-y-0.5 hover:shadow-md"
                                >
                                    <Icon className="size-5" />
                                </a>
                            ))}
                        </div>
                    </div>

                    <div>
                        <p className={headingClass}>{t('categories')}</p>
                        <ul className="space-y-2.5 text-sm">
                            {collections.map((collection) => {
                                const children = (collection.children ?? []).filter((child) => child.slug);
                                return (
                                    // CSS-only dropdown (hover / keyboard focus) so the footer stays a
                                    // Server Component. Touch screens hide it and just follow the parent link.
                                    <li key={collection.id} className="group/shop relative w-fit">
                                        <NavigationLink
                                            href={getCollectionHref(collection)}
                                            prefetch={false}
                                            className={`${linkClass} inline-flex items-center gap-1`}
                                        >
                                            {formatCollectionName(collection.name)}
                                            {children.length > 0 && (
                                                <ChevronRight className="size-3.5 text-gold transition-transform group-hover/shop:translate-x-0.5 pointer-coarse:hidden" aria-hidden="true" />
                                            )}
                                        </NavigationLink>
                                        {children.length > 0 && (
                                            <div className="invisible absolute left-full -top-3 z-20 pl-3 opacity-0 pointer-coarse:hidden transition-opacity duration-150 group-hover/shop:visible group-hover/shop:opacity-100 group-focus-within/shop:visible group-focus-within/shop:opacity-100">
                                                <ul className="min-w-48 space-y-1 rounded-md border border-gold/30 bg-[#3a1016] p-3 shadow-xl">
                                                    {children.map((child) => (
                                                        <li key={child.id}>
                                                            <NavigationLink
                                                                href={`/collection/${child.slug}`}
                                                                prefetch={false}
                                                                className={`${linkClass} block py-1 whitespace-nowrap`}
                                                            >
                                                                {formatCollectionName(child.name)}
                                                            </NavigationLink>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    </div>

                    <div>
                        <p className={headingClass}>{t('customer')}</p>
                        <ul className="space-y-2.5 text-sm">
                            <li>
                                <NavigationLink href="/search" className={linkClass}>
                                    {t('shopAll')}
                                </NavigationLink>
                            </li>
                            <li>
                                <NavigationLink href="/account/orders" className={linkClass}>
                                    {t('orders')}
                                </NavigationLink>
                            </li>
                            <li>
                                <NavigationLink href="/account/profile" className={linkClass}>
                                    {t('account')}
                                </NavigationLink>
                            </li>
                            <li>
                                <NavigationLink href="/cart" className={linkClass}>
                                    {t('cart')}
                                </NavigationLink>
                            </li>
                            <li>
                                <NavigationLink href="/faq" className={linkClass}>
                                    {t('faq')}
                                </NavigationLink>
                            </li>
                        </ul>
                    </div>

                    <nav aria-label={t('policies')}>
                        <p className={headingClass}>{t('policies')}</p>
                        <ul className="space-y-2.5 text-sm">
                            {POLICY_LINKS.map(({href, key}) => (
                                <li key={href}>
                                    <NavigationLink href={href} className={linkClass}>
                                        {t(key)}
                                    </NavigationLink>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    {/* Pinned to the top-right cell; the payment row sits below it. */}
                    <div className="col-span-2 md:col-span-3 xl:col-span-1 xl:col-start-5 xl:row-start-1">
                        <p className={headingClass}>{t('contact')}</p>
                        <ul className="space-y-3 text-sm">
                            <li>
                                <a href={contact.phoneHref} className={`${linkClass} inline-flex items-center gap-2.5`}>
                                    <Phone className="size-4 shrink-0 text-gold" />
                                    {contact.phone}
                                    <span className="rounded-sm border border-gold/60 px-1.5 py-px text-[0.7rem] font-semibold tracking-wide text-gold">24x7</span>
                                </a>
                            </li>
                            <li>
                                <a
                                    href={contact.whatsappHref}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={`${t('whatsapp')}: ${contact.phone}`}
                                    className={`${linkClass} inline-flex items-center gap-2.5`}
                                >
                                    <WhatsAppIcon className="size-4 shrink-0 text-[#25D366]" />
                                    {contact.phone}
                                </a>
                            </li>
                            <li>
                                <a href={`mailto:${contact.email}`} className={`${linkClass} inline-flex items-center gap-2.5 break-all`}>
                                    <Mail className="size-4 shrink-0 text-gold" />
                                    {contact.email}
                                </a>
                            </li>
                            <li className="flex items-start gap-2.5">
                                <MapPin className="size-4 shrink-0 text-gold mt-0.5" />
                                <address className="not-italic">
                                    <span className="block font-medium text-white/90">{contact.storeName}</span>
                                    {contact.address}
                                </address>
                            </li>
                        </ul>
                    </div>

                    {/* Under the Shop column on desktop, level with the payment row. */}
                    <div className="col-span-2 md:col-span-3 xl:col-span-1 xl:col-start-2 xl:row-start-2 self-end">
                        <a
                            href={contact.mapsHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-full border border-gold/60 py-1.5 pl-3 pr-4 text-sm font-medium text-gold transition-colors hover:bg-gold hover:text-[#2a0a0e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                        >
                            <StoreLocatorIcon pinFillClassName="fill-[#2a0a0e]" />
                            {tNav('findStore')}
                        </a>
                    </div>

                    {/* Second row on desktop, right-aligned to the Get in Touch column's edge. */}
                    <ul
                        aria-label={t('paymentMethods')}
                        className="col-span-2 md:col-span-3 xl:col-start-3 xl:col-span-3 xl:row-start-2 self-end flex flex-wrap items-center gap-2 md:justify-end"
                    >
                        {PAYMENT_LOGOS.map(({src, name}) => (
                            <li key={name} className="flex h-7 items-center rounded bg-white px-2.5 shadow-sm">
                                <Image src={src} alt={name} width={64} height={20} className="h-4 w-auto max-w-12 object-contain" />
                            </li>
                        ))}
                    </ul>
                </div>

            </div>

            {/* Copyright / powered-by strip always stays the last row of the page. */}
            <div className="border-t border-white/10">
                <div className="container mx-auto px-6 md:px-10 lg:px-12 py-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/70">
                    <p>&copy; {COPYRIGHT_YEAR} {t('copyright', {siteName: SITE_NAME})}</p>
                    <div className="flex items-center gap-3">
                        <span className="hidden sm:block h-3.5 w-px bg-white/30" aria-hidden="true" />
                        <span>{t('poweredBy')}</span>
                        <a
                            href="https://www.dripfunnel.com/in/"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="DripFunnel"
                            className="transition-opacity hover:opacity-80"
                        >
                            <Image src="/logo/dripfunnel-logo.png" alt="DripFunnel" width={845} height={143} className="h-4 w-auto" />
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
