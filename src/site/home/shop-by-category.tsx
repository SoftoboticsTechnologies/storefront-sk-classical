import Image from "next/image";
import { Link } from '@/platform/i18n/navigation';
import {getTranslations} from 'next-intl/server';
import {getRouteLocale} from '@/platform/i18n/server';
import {getTopCollections} from '@/features/collections/data';

export async function ShopByCategory() {
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'Home'});
    const collections = await getTopCollections(locale);

    if (collections.length === 0) {
        return null;
    }

    return (
        <section className="py-12 md:py-16 bg-muted/30">
            <div className="container mx-auto px-4">
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-8">
                    {t('shopByCategory.title')}
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {collections.map((collection) => (
                        <div key={collection.slug} className="bg-card rounded-xl border border-border overflow-hidden">
                            <Link
                                href={`/collection/${collection.slug}`}
                                // See product-card.tsx: default prefetch hits a Next.js 16
                                // static-export bug (vercel/next.js#85374).
                                prefetch={false}
                                className="group relative block aspect-16/9 bg-muted overflow-hidden"
                            >
                                {collection.featuredAsset?.preview ? (
                                    <Image
                                        src={collection.featuredAsset.preview}
                                        alt=""
                                        fill
                                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                    />
                                ) : null}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                                <span className="absolute bottom-4 left-4 text-lg font-semibold text-white">
                                    {collection.name}
                                </span>
                            </Link>
                            {collection.children && collection.children.length > 0 && (
                                <ul className="p-4 flex flex-wrap gap-x-4 gap-y-2">
                                    {collection.children.map((child) => (
                                        <li key={child.slug}>
                                            <Link
                                                href={`/collection/${child.slug}`}
                                                prefetch={false}
                                                className="text-sm text-muted-foreground hover:text-primary transition-colors"
                                            >
                                                {child.name}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
