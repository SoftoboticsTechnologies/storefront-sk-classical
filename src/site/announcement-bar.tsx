import {getTranslations} from 'next-intl/server';
import {getRouteLocale} from '@/platform/i18n/server';

export async function AnnouncementBar() {
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'AnnouncementBar'});

    return (
        <div className="bg-foreground text-background text-xs md:text-sm font-medium">
            <div className="container mx-auto px-4 h-9 flex items-center justify-center gap-x-6 gap-y-1 flex-wrap text-center">
                <span>{t('message1')}</span>
                <span className="hidden sm:inline opacity-50">&bull;</span>
                <span className="hidden sm:inline">{t('message2')}</span>
                <span className="hidden md:inline opacity-50">&bull;</span>
                <span className="hidden md:inline">{t('message3')}</span>
            </div>
        </div>
    );
}
