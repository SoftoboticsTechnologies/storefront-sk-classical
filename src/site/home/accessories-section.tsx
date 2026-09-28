import Image from "next/image";
import {Diamond} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Link} from '@/platform/i18n/navigation';
import {getTranslations} from 'next-intl/server';
import {getRouteLocale} from '@/platform/i18n/server';
import {ProductShowcase} from '@/features/products/product-showcase';
import {ACCESSORIES_COLLECTION_SLUG} from "@/site/brand";

/**
 * "Bharatanatyam Accessories" homepage section: a square banner (dancer photo
 * under a maroon scrim and gold temple-arch outline) beside a 2-up grid of the
 * collection's products, framed top and bottom by temple-saree border bands.
 * Hidden while the collection is empty.
 */
export async function AccessoriesSection() {
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'Home'});
    const href = `/collection/${ACCESSORIES_COLLECTION_SLUG}`;

    return (
        <ProductShowcase
            collectionSlug={ACCESSORIES_COLLECTION_SLUG}
            take={4}
            className="relative bg-secondary"
            leading={<div className="temple-border" aria-hidden="true"/>}
            trailing={<div className="temple-border temple-border-flip" aria-hidden="true"/>}
            aside={
                <div className="relative aspect-square overflow-hidden rounded-2xl bg-[#4a0f16] text-white">
                    <Image
                        src="/images/categories/accessories.webp"
                        alt={t('accessories.imageAlt')}
                        fill
                        className="object-cover"
                        style={{objectPosition: 'center 25%'}}
                        sizes="(max-width: 768px) 100vw, 50vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#4a0f16] from-25% via-[#4a0f16]/60 via-50% to-transparent" aria-hidden="true"/>
                    <div className="kolam-pattern absolute inset-0 opacity-20" aria-hidden="true"/>
                    {/* Gold temple-arch outline framing the dancer. */}
                    <div className="absolute inset-3 sm:inset-4 rounded-t-[999px] rounded-b-xl border border-gold/70" aria-hidden="true"/>
                    <Diamond className="absolute top-1.5 sm:top-2.5 left-1/2 size-3.5 -translate-x-1/2 fill-gold text-gold" aria-hidden="true"/>

                    <div className="absolute inset-x-6 bottom-7 sm:inset-x-10 sm:bottom-10 flex flex-col items-center text-center">
                        <p className="text-[10px] sm:text-xs font-medium uppercase tracking-[0.25em] text-gold">
                            {t('accessories.eyebrow')}
                        </p>
                        <h2 className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-semibold text-balance">
                            {t('accessories.title')}
                        </h2>
                        <div className="ornament-divider mt-3 w-full max-w-40" aria-hidden="true">
                            <Diamond className="size-2.5 fill-current"/>
                        </div>
                        <p className="mt-3 hidden max-w-sm text-sm leading-relaxed text-white/85 sm:block md:hidden lg:block">
                            {t('accessories.body')}
                        </p>
                        <Button
                            render={<Link href={href}/>}
                            nativeButton={false}
                            size="lg"
                            className="mt-5 sm:mt-6 min-w-[180px] bg-gold text-gold-foreground hover:bg-gold/90 uppercase tracking-[0.15em] text-xs"
                        >
                            {t('accessories.cta')}
                        </Button>
                    </div>
                </div>
            }
        />
    );
}
