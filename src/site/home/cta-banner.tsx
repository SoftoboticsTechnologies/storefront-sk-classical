import Image from "next/image";
import {Button} from "@/components/ui/button";
import { Link } from '@/platform/i18n/navigation';
import {getTranslations} from 'next-intl/server';
import {getRouteLocale} from '@/platform/i18n/server';

export async function CtaBanner() {
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'Home'});

    return (
        <section className="relative overflow-hidden bg-[#4a0f16] text-white">
            <Image
                src="/images/categories/jewellery.webp"
                alt=""
                fill
                className="object-cover object-right opacity-40"
                sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#4a0f16] via-[#4a0f16]/90 to-[#4a0f16]/30" />
            <div className="relative container mx-auto px-4 py-16 md:py-24">
                <div className="max-w-xl">
                    <p className="text-xs font-medium uppercase tracking-[0.25em] text-gold mb-3">
                        {t('ctaBanner.eyebrow')}
                    </p>
                    <h2 className="text-3xl md:text-5xl font-semibold mb-4 text-balance">
                        {t('ctaBanner.title')}
                    </h2>
                    <p className="text-white/80 leading-relaxed mb-8">
                        {t('ctaBanner.subtitle')}
                    </p>
                    <Button
                        render={<Link href="/register" />}
                        nativeButton={false}
                        size="lg"
                        className="min-w-[200px] bg-gold text-gold-foreground hover:bg-gold/90 uppercase tracking-[0.15em] text-xs"
                    >
                        {t('ctaBanner.cta')}
                    </Button>
                </div>
            </div>
        </section>
    );
}
