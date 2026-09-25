import Image from "next/image";
import {Button} from "@/components/ui/button";
import { Link } from '@/platform/i18n/navigation';
import {getTranslations} from 'next-intl/server';
import {getRouteLocale} from '@/platform/i18n/server';
import {getTopCollections} from '@/features/collections/data';
import {preconnect} from 'react-dom';

export async function HeroSection() {
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'Hero'});
    const collections = await getTopCollections(locale);
    const featured = collections[0];
    const preview = featured?.featuredAsset?.preview;

    if (preview) {
        try {
            preconnect(new URL(preview).origin);
        } catch {
            // ignore malformed asset URL
        }
    }

    return (
        <section className="relative overflow-hidden bg-muted">
            <div className="container relative mx-auto px-4 py-12 md:py-0">
                <div className="grid md:grid-cols-2 gap-8 md:gap-0 items-center md:min-h-[32rem] lg:min-h-[38rem]">
                    <div className="relative z-10 space-y-6 md:pr-12">
                        <span className="inline-block text-xs font-semibold tracking-widest uppercase text-primary">
                            {t('eyebrow')}
                        </span>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-balance">
                            {featured ? (
                                <>
                                    {t('titlePrefix')}{" "}
                                    <span className="text-primary">{featured.name}</span>
                                </>
                            ) : (
                                t('titleFallback')
                            )}
                        </h1>
                        <p className="text-lg text-muted-foreground max-w-md leading-relaxed">
                            {t('subtitle')}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 pt-2">
                            <Button
                                render={<Link href={featured ? `/collection/${featured.slug}` : '/search'} />}
                                nativeButton={false}
                                size="lg"
                                className="min-w-[180px] text-base"
                            >
                                {t('shopNow')}
                            </Button>
                            <Button
                                render={<Link href="/search" />}
                                nativeButton={false}
                                variant="outline"
                                size="lg"
                                className="min-w-[180px] text-base"
                            >
                                {t('viewAllProducts')}
                            </Button>
                        </div>
                    </div>

                    <div className="relative aspect-4/3 md:aspect-auto md:h-full md:min-h-[24rem] rounded-2xl overflow-hidden bg-card">
                        {preview ? (
                            <Image
                                src={preview}
                                alt={featured?.name ?? ''}
                                fill
                                priority
                                className="object-cover"
                                sizes="(max-width: 768px) 100vw, 50vw"
                            />
                        ) : (
                            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,var(--color-primary)/12,transparent)]" />
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
