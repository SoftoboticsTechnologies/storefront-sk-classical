import {getTranslations} from 'next-intl/server';
import {getRouteLocale} from '@/platform/i18n/server';
import {BRAND} from '@/site/brand';
import {WhatsAppIcon} from '@/site/whatsapp-icon';

/** Site-wide chat shortcut, pinned bottom-left (sonner toasts use bottom-right). */
export async function FloatingWhatsApp() {
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'Footer'});

    return (
        <a
            href={BRAND.contact.whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t('whatsapp')}
            title={t('whatsapp')}
            className="group fixed bottom-4 left-4 z-40 flex size-12 md:size-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-black/25 transition hover:scale-105 hover:bg-[#1ebe5b] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#25D366]/40 md:bottom-6 md:left-6"
        >
            <span className="absolute inset-0 rounded-full bg-[#25D366] opacity-60 animate-ping motion-reduce:hidden" aria-hidden="true" />
            <WhatsAppIcon className="relative size-6 md:size-7" />
        </a>
    );
}
