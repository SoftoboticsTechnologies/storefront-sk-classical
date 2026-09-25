import Image from "next/image";
import { Link } from '@/platform/i18n/navigation';
import {ArrowRight} from "lucide-react";
import {getTranslations} from 'next-intl/server';
import {getRouteLocale} from '@/platform/i18n/server';
import {getTopCollections} from '@/features/collections/data';

interface EditorialBannerProps {
    collectionSlug: string;
}

export async function EditorialBanner({collectionSlug}: EditorialBannerProps) {
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'Home'});
    const collections = await getTopCollections(locale);
    const collection = collections.find((c) => c.slug === collectionSlug);

    if (!collection) {
        return null;
    }

    return (
        <section className="py-12 md:py-16">
            <div className="container mx-auto px-4">
                <Link
                    href={`/collection/${collection.slug}`}
                    // See product-card.tsx: default prefetch hits a Next.js 16
                    // static-export bug (vercel/next.js#85374).
                    prefetch={false}
                    className="group relative block overflow-hidden rounded-2xl bg-muted min-h-[20rem] md:min-h-[26rem]"
                >
                    {collection.featuredAsset?.preview && (
                        <Image
                            src={collection.featuredAsset.preview}
                            alt=""
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                            sizes="100vw"
                        />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="relative h-full flex flex-col justify-end p-8 md:p-12 max-w-xl">
                        <span className="text-xs font-semibold tracking-widest uppercase text-white/80 mb-3">
                            {t('editorialBanner.eyebrow')}
                        </span>
                        <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-3">
                            {collection.name}
                        </h2>
                        <p className="text-white/85 leading-relaxed mb-6 line-clamp-2">
                            {collection.description?.trim() || t('editorialBanner.fallbackDescription')}
                        </p>
                        <span className="inline-flex items-center gap-1.5 text-white font-medium">
                            {t('editorialBanner.cta')}
                            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                        </span>
                    </div>
                </Link>
            </div>
        </section>
    );
}
