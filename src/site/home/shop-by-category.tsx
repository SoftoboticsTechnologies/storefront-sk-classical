import { Link } from '@/platform/i18n/navigation';
import {getTranslations} from 'next-intl/server';
import {getRouteLocale} from '@/platform/i18n/server';
import {getRootCollections} from '@/features/collections/data';
import {formatCollectionName, getCollectionHref} from '@/features/collections/utils';
import {SectionHeading} from '@/site/home/section-heading';

/** Subcategory index: every root collection with its linkable children as chips. */
export async function ShopByCategory() {
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'Home'});
    const collections = await getRootCollections(locale);
    const groups = collections
        .map((collection) => ({collection, children: (collection.children ?? []).filter((child) => child.slug)}))
        .filter((group) => group.children.length > 0);

    if (groups.length === 0) {
        return null;
    }

    return (
        <section className="py-16 md:py-24 bg-secondary/60">
            <div className="container mx-auto px-4">
                <SectionHeading eyebrow={t('shopByCategory.eyebrow')} title={t('shopByCategory.title')} />
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {groups.map(({collection, children}) => (
                        <div key={collection.id} className="rounded-lg border border-gold/30 bg-card p-6">
                            <h3 className="font-serif text-2xl font-semibold mb-4">
                                <Link href={getCollectionHref(collection)} prefetch={false} className="hover:text-primary transition-colors">
                                    {formatCollectionName(collection.name)}
                                </Link>
                            </h3>
                            <ul className="flex flex-wrap gap-2">
                                {children.map((child) => (
                                    <li key={child.id}>
                                        <Link
                                            href={`/collection/${child.slug}`}
                                            // See product-card.tsx: default prefetch hits a Next.js 16
                                            // static-export bug (vercel/next.js#85374).
                                            prefetch={false}
                                            className="inline-block rounded-full border border-border px-3.5 py-1.5 text-sm text-muted-foreground transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground"
                                        >
                                            {formatCollectionName(child.name)}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
