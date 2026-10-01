import {useTranslations} from 'next-intl';
import {WhatsAppIcon} from '@/components/icons/whatsapp-icon';
import {buildWhatsAppHref} from '@/config/contact';

interface ProductContactCardProps {
    name: string;
    /** Absolute product URL, included in the prefilled chat message. */
    url: string;
}

/** "Have a question?" card opening a WhatsApp chat prefilled with this product. */
export function ProductContactCard({name, url}: ProductContactCardProps) {
    const t = useTranslations('Product');

    return (
        <section className="relative overflow-hidden rounded-2xl border border-gold/30 bg-secondary p-5 sm:p-6 kolam-pattern">
            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-foreground">{t('contact.title')}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{t('contact.subtitle')}</p>
                </div>
                <a
                    href={buildWhatsAppHref(t('contact.message', {name, url}))}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-primary bg-background px-5 py-2.5 text-sm font-semibold text-primary transition hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                >
                    <WhatsAppIcon className="size-4 text-[#25D366]" />
                    {t('contact.cta')}
                </a>
            </div>
        </section>
    );
}
