import Image from "next/image";
import {ArrowRight, ChevronRight} from "lucide-react";
import { Link } from '@/platform/i18n/navigation';
import {getTranslations} from 'next-intl/server';
import {getRouteLocale} from '@/platform/i18n/server';
import {getRootCollections} from '@/features/collections/data';
import {formatCollectionName, getCollectionHref} from '@/features/collections/utils';
import {getCategoryImage} from '@/site/brand';
import {SectionHeading} from '@/site/home/section-heading';

/**
 * Subcategory index: one card per root collection — photo header with the
 * category name, its sub-collections as a tappable list, and a "shop all" footer.
 */
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
                    {groups.map(({collection, children}, index) => {
                        const name = formatCollectionName(collection.name);
                        const href = getCollectionHref(collection);
                        const image = getCategoryImage(collection);

                        return (
                            <article
                                key={collection.id}
                                className="group relative flex flex-col overflow-hidden rounded-2xl bg-card shadow-[0_1px_2px_rgb(42_10_14/0.06),0_8px_24px_-12px_rgb(42_10_14/0.18)] ring-1 ring-gold/25 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_2px_4px_rgb(42_10_14/0.08),0_24px_48px_-16px_rgb(42_10_14/0.35)] hover:ring-gold/60"
                            >
                                {/* See product-card.tsx: default prefetch hits a Next.js 16
                                    static-export bug (vercel/next.js#85374). */}
                                <Link href={href} prefetch={false} className="relative block aspect-4/3 overflow-hidden bg-[#2a0a0e]">
                                    {image && (
                                        <Image
                                            src={image.src}
                                            alt=""
                                            fill
                                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                                            className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-110"
                                            style={image.position ? {objectPosition: image.position} : undefined}
                                        />
                                    )}
                                    <div className="absolute inset-0 bg-linear-to-t from-[#2a0a0e] via-[#2a0a0e]/35 to-transparent" aria-hidden="true" />
                                    {/* Inset gold frame, echoing the ornamental hero banners. */}
                                    <div className="pointer-events-none absolute inset-3 rounded-xl border border-gold/40 transition-colors duration-500 group-hover:border-gold/80" aria-hidden="true" />

                                    <span className="absolute left-6 top-5 font-serif text-lg italic text-gold/90" aria-hidden="true">
                                        {String(index + 1).padStart(2, '0')}
                                    </span>
                                    <span className="absolute right-6 top-5 rounded-full border border-white/25 bg-black/25 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white backdrop-blur-sm">
                                        {t('shopByCategory.styles', {count: children.length})}
                                    </span>

                                    <div className="absolute inset-x-0 bottom-0 px-6 pb-6">
                                        <h3 className="font-serif text-[1.75rem] font-semibold leading-tight text-white">{name}</h3>
                                        <div className="mt-2.5 h-px w-10 bg-gold transition-all duration-500 group-hover:w-20" aria-hidden="true" />
                                    </div>
                                </Link>

                                <ul className="flex-1 px-3 py-3">
                                    {children.map((child) => (
                                        <li key={child.id}>
                                            <Link
                                                href={`/collection/${child.slug}`}
                                                prefetch={false}
                                                className="group/item flex items-center gap-3 rounded-lg px-3 py-2.5 text-[0.9rem] text-foreground/75 transition-colors hover:bg-secondary/70 hover:text-primary"
                                            >
                                                <span className="size-1.5 shrink-0 rotate-45 bg-gold/70 transition-colors group-hover/item:bg-primary" aria-hidden="true" />
                                                <span className="flex-1">{formatCollectionName(child.name)}</span>
                                                <ChevronRight className="size-4 shrink-0 -translate-x-1 text-primary opacity-0 transition-all group-hover/item:translate-x-0 group-hover/item:opacity-100" />
                                            </Link>
                                        </li>
                                    ))}
                                </ul>

                                <div className="px-6 pb-6">
                                    <Link
                                        href={href}
                                        prefetch={false}
                                        className="group/all flex items-center justify-between border-t border-gold/30 pt-4 text-xs font-semibold uppercase tracking-[0.16em] text-primary"
                                    >
                                        {t('shopByCategory.shopAll', {name})}
                                        <span className="flex size-8 items-center justify-center rounded-full border border-gold/50 transition-all duration-300 group-hover/all:border-primary group-hover/all:bg-primary group-hover/all:text-primary-foreground">
                                            <ArrowRight className="size-3.5 transition-transform group-hover/all:translate-x-0.5" />
                                        </span>
                                    </Link>
                                </div>
                            </article>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
