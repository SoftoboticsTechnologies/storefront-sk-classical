import {Button} from "@/components/ui/button";
import { Link } from '@/platform/i18n/navigation';
import {getTranslations} from 'next-intl/server';
import {getRouteLocale} from '@/platform/i18n/server';

export async function CtaBanner() {
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'Home'});

    return (
        <section className="py-16 md:py-20 bg-primary text-primary-foreground">
            <div className="container mx-auto px-4 text-center max-w-2xl">
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-4">
                    {t('ctaBanner.title')}
                </h2>
                <p className="text-primary-foreground/85 leading-relaxed mb-8">
                    {t('ctaBanner.subtitle')}
                </p>
                <Button
                    render={<Link href="/register" />}
                    nativeButton={false}
                    size="lg"
                    variant="secondary"
                    className="min-w-[200px] text-base"
                >
                    {t('ctaBanner.cta')}
                </Button>
            </div>
        </section>
    );
}
