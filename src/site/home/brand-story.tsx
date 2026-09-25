import Image from "next/image";
import {Button} from "@/components/ui/button";
import { Link } from '@/platform/i18n/navigation';
import {getTranslations} from 'next-intl/server';
import {getRouteLocale} from '@/platform/i18n/server';

export async function BrandStory() {
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'Home'});

    return (
        <section className="py-16 md:py-24 overflow-hidden">
            <div className="container mx-auto px-4">
                <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
                    <div className="relative mx-auto w-full max-w-md">
                        <div className="absolute inset-0 rounded-lg border border-gold/50 translate-x-2 translate-y-2 md:translate-x-4 md:translate-y-4" aria-hidden="true" />
                        <div className="relative aspect-4/5 overflow-hidden rounded-lg bg-muted">
                            <Image
                                src="/images/categories/costumes.webp"
                                alt={t('brandStory.imageAlt')}
                                fill
                                className="object-cover"
                                style={{objectPosition: 'center 25%'}}
                                sizes="(max-width: 768px) 100vw, 448px"
                            />
                        </div>
                    </div>
                    <div className="space-y-6">
                        <p className="text-xs font-medium uppercase tracking-[0.25em] text-primary/80 dark:text-gold">
                            {t('brandStory.eyebrow')}
                        </p>
                        <h2 className="text-4xl md:text-5xl font-semibold leading-tight text-balance">
                            {t('brandStory.title')}{" "}
                            <em className="text-gold">{t('brandStory.titleAccent')}</em>
                        </h2>
                        <p className="text-muted-foreground leading-relaxed text-lg">{t('brandStory.body1')}</p>
                        <p className="text-muted-foreground leading-relaxed">{t('brandStory.body2')}</p>
                        <Button
                            render={<Link href="/search" />}
                            nativeButton={false}
                            size="lg"
                            className="min-w-[200px] uppercase tracking-[0.15em] text-xs"
                        >
                            {t('brandStory.cta')}
                        </Button>
                    </div>
                </div>
            </div>
        </section>
    );
}
