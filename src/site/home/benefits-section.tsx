import {Gem, Headset, ShieldCheck, Sparkles} from "lucide-react";
import {getTranslations} from 'next-intl/server';
import {getRouteLocale} from '@/platform/i18n/server';

const featureKeys = [
    {icon: Gem, key: 'authentic'},
    {icon: Sparkles, key: 'stageReady'},
    {icon: ShieldCheck, key: 'secureCheckout'},
    {icon: Headset, key: 'support'},
] as const;

export async function BenefitsSection() {
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'Home'});

    return (
        <section className="border-y border-gold/30 bg-card">
            <div className="container mx-auto px-4 py-12 md:py-16">
                <h2 className="sr-only">{t('whyShopWithUs')}</h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                    {featureKeys.map((feature) => (
                        <div key={feature.key} className="flex flex-col items-center text-center gap-3">
                            <div className="size-14 rounded-full border border-gold/50 flex items-center justify-center text-primary dark:text-gold">
                                <feature.icon className="size-6" strokeWidth={1.5} />
                            </div>
                            <h3 className="font-serif text-xl font-semibold">{t(`features.${feature.key}.title`)}</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed max-w-[16rem]">{t(`features.${feature.key}.description`)}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
