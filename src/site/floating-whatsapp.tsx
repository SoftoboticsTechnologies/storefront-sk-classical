import {getTranslations} from 'next-intl/server';
import {getRouteLocale} from '@/platform/i18n/server';
import {BRAND} from '@/site/brand';
import {WhatsAppIcon} from '@/components/icons/whatsapp-icon';

/**
 * Site-wide chat shortcut, pinned bottom-right. A round icon at rest; on
 * hover/focus it widens into a pill revealing "Chat with us" left of the icon.
 */
export async function FloatingWhatsApp() {
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'Footer'});

    return (
        <a
            href={BRAND.contact.whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t('whatsapp')}
            className="group fixed bottom-4 right-4 z-40 flex h-12 md:h-14 items-center rounded-full bg-[#25D366] text-[#0b3b24] shadow-lg shadow-black/25 transition-shadow hover:shadow-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#25D366]/40 md:bottom-6 md:right-6"
        >
            <span className="absolute inset-0 rounded-full bg-[#25D366] opacity-60 animate-ping motion-reduce:hidden group-hover:hidden group-focus-visible:hidden" aria-hidden="true" />
            <span
                className="relative max-w-0 overflow-hidden whitespace-nowrap text-sm md:text-base font-semibold opacity-0 transition-all duration-300 ease-out group-hover:max-w-48 group-hover:pl-5 group-hover:opacity-100 group-focus-visible:max-w-48 group-focus-visible:pl-5 group-focus-visible:opacity-100 motion-reduce:transition-none"
                aria-hidden="true"
            >
                {t('chatWithUs')}
            </span>
            <span className="relative flex size-12 md:size-14 shrink-0 items-center justify-center text-white">
                <WhatsAppIcon className="size-6 md:size-7" />
            </span>
        </a>
    );
}
