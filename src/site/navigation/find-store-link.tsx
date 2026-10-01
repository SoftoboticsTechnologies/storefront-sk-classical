import {getTranslations} from 'next-intl/server';
import {getRouteLocale} from '@/platform/i18n/server';
import {BRAND} from '@/site/brand';

/**
 * Line-art shop with a striped, scalloped awning, a door and a window, plus a
 * map pin on the top-right corner. Strokes use `currentColor`;
 * `pinFillClassName` should match the surface behind it so the pin masks the
 * awning where they overlap.
 */
export function StoreLocatorIcon({pinFillClassName}: {pinFillClassName: string}) {
    return (
        <svg
            viewBox="0 0 28 28"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-7 shrink-0"
            aria-hidden="true"
        >
            {/* Awning: top edge, stripes, scalloped hem */}
            <path d="M4 7.5h15.5l1.5 4.5" />
            <path d="M4 7.5 2.5 12" />
            <path d="M7.7 7.5 7 12M11.5 7.5V12M15.3 7.5 16 12" />
            <path d="M2.5 12a2.25 2.25 0 0 0 4.5 0a2.25 2.25 0 0 0 4.5 0a2.25 2.25 0 0 0 4.5 0a2.5 2.5 0 0 0 5 0" />
            {/* Shop body */}
            <path d="M3.5 14.2V24.5h16V14.2" />
            <path d="M2 24.5h19" />
            {/* Door with a glass panel, and a window */}
            <path d="M6 24.5v-7h4.5v7" />
            <path d="M7.2 18.8h2.1v2.2H7.2z" />
            <rect x="13" y="17.5" width="4" height="3.5" rx="0.5" />
            {/* Map pin over the awning's top-right corner */}
            <path
                className={pinFillClassName}
                d="M22.5 1.5a4.25 4.25 0 0 0-4.25 4.25c0 3.2 4.25 7.25 4.25 7.25s4.25-4.05 4.25-7.25A4.25 4.25 0 0 0 22.5 1.5z"
            />
            <circle cx="22.5" cy="5.75" r="1.4" />
        </svg>
    );
}

/**
 * "Find Store" link in the top bar, opening the shop's address in Maps.
 */
export async function FindStoreLink() {
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'Navigation'});

    return (
        <a
            href={BRAND.contact.mapsHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t('findStore')}
            className="flex shrink-0 items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-foreground/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        >
            <StoreLocatorIcon pinFillClassName="fill-primary" />
            <span className="hidden lg:inline whitespace-nowrap">{t('findStore')}</span>
        </a>
    );
}
