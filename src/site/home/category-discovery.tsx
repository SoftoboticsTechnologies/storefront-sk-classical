import Image from "next/image";
import {ArrowRight} from "lucide-react";
import { Link } from '@/platform/i18n/navigation';
import {getTranslations} from 'next-intl/server';
import {getRouteLocale} from '@/platform/i18n/server';
import {getRootCollections} from '@/features/collections/data';
import {formatCollectionName, getCollectionHref} from '@/features/collections/utils';
import {getCategoryImage} from '@/site/brand';
import {SectionHeading} from '@/site/home/section-heading';

export async function CategoryDiscovery() {
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'Home'});
    const collections = await getRootCollections(locale);

    if (collections.length === 0) {
        return null;
    }

    return (
        <section className="py-16 md:py-24">
            <div className="container mx-auto px-4">
                <SectionHeading eyebrow={t('categoryDiscovery.eyebrow')} title={t('categoryDiscovery.title')} />
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    {collections.map((collection) => {
                        const image = getCategoryImage(collection);
                        return (
                            <Link
                                key={collection.id}
                                href={getCollectionHref(collection)}
                                // See product-card.tsx: default prefetch hits a Next.js 16
                                // static-export bug (vercel/next.js#85374).
                                prefetch={false}
                                className="group relative block aspect-3/4 overflow-hidden rounded-lg bg-muted ring-1 ring-gold/25"
                            >
                                {image && (
                                    <Image
                                        src={image.src}
                                        alt=""
                                        fill
                                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                                        style={image.position ? {objectPosition: image.position} : undefined}
                                        sizes="(max-width: 1024px) 50vw, 25vw"
                                    />
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />
                                <div className="absolute inset-2 rounded-md border border-transparent transition-colors duration-500 group-hover:border-gold/60" />
                                <div className="absolute inset-x-0 bottom-0 p-4 md:p-6 text-center">
                                    <h3 className="font-serif text-2xl md:text-3xl font-semibold text-white">
                                        {formatCollectionName(collection.name)}
                                    </h3>
                                    <span className="mt-2 inline-flex items-center gap-1.5 text-[0.7rem] md:text-xs uppercase tracking-[0.2em] text-gold">
                                        {t('categoryDiscovery.explore')}
                                        <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                                    </span>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
