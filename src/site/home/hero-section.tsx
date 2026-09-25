import {getTranslations} from 'next-intl/server';
import {getRouteLocale} from '@/platform/i18n/server';
import {getTopCollections} from '@/features/collections/data';
import {getCollectionHref} from '@/features/collections/utils';
import {HeroCarousel, type HeroSlide} from '@/site/home/hero-carousel';

/**
 * Brand campaign banners (artwork in `public/images/banners`). Each links to
 * the first live collection whose slug/name contains one of its keywords, in
 * order — so links follow the real Vendure catalog rather than hardcoded slugs.
 */
const BANNERS = [
    {src: '/images/banners/hero-2.webp', altKey: 'slideCostume', keywords: ['bharatnatyam-dress', 'costume']},
    {src: '/images/banners/hero-1.webp', altKey: 'slideGhungroo', keywords: ['5-line', 'ghungroo']},
    {src: '/images/banners/hero-3.webp', altKey: 'slideJada', keywords: ['ornament-set', 'accessor']},
] as const;

export async function HeroSection() {
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'Hero'});
    const collections = await getTopCollections(locale);

    const resolveHref = (keywords: readonly string[]) => {
        for (const keyword of keywords) {
            const match = collections.find((c) => `${c.slug} ${c.name}`.toLowerCase().includes(keyword));
            if (match) return getCollectionHref(match);
        }
        return '/search';
    };

    const slides: HeroSlide[] = BANNERS.map((banner, index) => ({
        src: banner.src,
        alt: t(banner.altKey),
        href: resolveHref(banner.keywords),
        dotLabel: t('goToSlide', {n: index + 1}),
    }));

    return (
        <HeroCarousel
            slides={slides}
            labels={{region: t('region'), previous: t('previous'), next: t('next')}}
        />
    );
}
