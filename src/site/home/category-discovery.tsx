import Image from "next/image";
import { Link } from '@/platform/i18n/navigation';
import {getTranslations} from 'next-intl/server';
import {getRouteLocale} from '@/platform/i18n/server';
import {getTopCollections} from '@/features/collections/data';

export async function CategoryDiscovery() {
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'Home'});
    const collections = await getTopCollections(locale);

    if (collections.length === 0) {
        return null;
    }

    return (
        <section className="py-12 md:py-16">
            <div className="container mx-auto px-4">
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-8">
                    {t('categoryDiscovery.title')}
                </h2>
                <div className="flex gap-6 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-4 lg:grid-cols-6 md:gap-6">
                    {collections.map((collection) => (
                        <Link
                            key={collection.slug}
                            href={`/collection/${collection.slug}`}
                            // See product-card.tsx: default prefetch hits a Next.js 16
                            // static-export bug (vercel/next.js#85374).
                            prefetch={false}
                            className="group flex flex-col items-center gap-3 shrink-0 w-24 md:w-auto"
                        >
                            <div className="relative size-24 rounded-full overflow-hidden bg-muted border border-border transition-shadow group-hover:shadow-lg">
                                {collection.featuredAsset?.preview ? (
                                    <Image
                                        src={`${collection.featuredAsset.preview}?preset=thumb`}
                                        alt=""
                                        fill
                                        className="object-cover transition-transform duration-300 group-hover:scale-110"
                                        sizes="96px"
                                    />
                                ) : null}
                            </div>
                            <span className="text-sm font-medium text-center line-clamp-1 group-hover:text-primary transition-colors">
                                {collection.name}
                            </span>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
