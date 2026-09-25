import type {Locale} from './routing';

const OG_LOCALE_MAP: Record<Locale, string> = { en: 'en_US', de: 'de_DE', hi: 'hi_IN', tel: 'te_IN' };
const INTL_LOCALE_MAP: Record<Locale, string> = { en: 'en-US', de: 'de-DE', hi: 'hi-IN', tel: 'te-IN' };

export function toOgLocale(locale: string): string {
    return OG_LOCALE_MAP[locale as Locale] || 'en_US';
}

export function toIntlLocale(locale: string): string {
    return INTL_LOCALE_MAP[locale as Locale] || 'en-US';
}
