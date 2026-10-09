'use client';

import {useEffect, useState} from 'react';
import Image from 'next/image';
import {ArrowRight, History, Search, X} from 'lucide-react';
import {useLocale, useTranslations} from 'next-intl';
import {useRouter} from '@/platform/i18n/navigation';
import {readFragment} from '@/platform/vendure/graphql';
import {ProductCardFragment} from '@/features/products/graphql';
import {
    Command,
    CommandDialog,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from '@/components/ui/command';
import {Spinner} from '@/components/ui/spinner';
import {getSearchSuggestions, type SearchSuggestionResult} from '@/features/search/suggest';
import {addRecentSearch, clearRecentSearches, useRecentSearches} from '@/features/search/recent-searches';
import {Price} from '@/features/pricing/price';

interface SearchOverlayProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const DEBOUNCE_MS = 200;

/** Wraps case-insensitive occurrences of `term` in `text` with a highlight. */
function HighlightMatch({text, term}: {text: string; term: string}) {
    const index = term ? text.toLowerCase().indexOf(term.toLowerCase()) : -1;
    if (index === -1) return <>{text}</>;
    return (
        <>
            {text.slice(0, index)}
            <mark className="bg-transparent font-semibold text-foreground">
                {text.slice(index, index + term.length)}
            </mark>
            {text.slice(index + term.length)}
        </>
    );
}

export function SearchOverlay({open, onOpenChange}: SearchOverlayProps) {
    const t = useTranslations('Navigation');
    const locale = useLocale();
    const router = useRouter();
    const recentSearches = useRecentSearches();
    const [value, setValue] = useState('');
    const [results, setResults] = useState<(SearchSuggestionResult & {term: string}) | null>(null);
    const [loading, setLoading] = useState(false);

    const term = value.trim();

    useEffect(() => {
        if (!open || !term) {
            setResults(null);
            setLoading(false);
            return;
        }
        // `cancelled` drops responses for terms the viewer has already typed
        // past, so a slow earlier request can't overwrite newer suggestions.
        let cancelled = false;
        setLoading(true);
        const handle = setTimeout(() => {
            getSearchSuggestions(term, locale)
                .then((result) => {
                    if (!cancelled) setResults({...result, term});
                })
                .catch(() => {
                    if (!cancelled) setResults({items: [], totalItems: 0, term});
                })
                .finally(() => {
                    if (!cancelled) setLoading(false);
                });
        }, DEBOUNCE_MS);
        return () => {
            cancelled = true;
            clearTimeout(handle);
        };
    }, [term, open, locale]);

    useEffect(() => {
        if (!open) setValue('');
    }, [open]);

    const navigateToProduct = (slug: string) => {
        if (term) addRecentSearch(term);
        onOpenChange(false);
        router.push(`/product/${slug}`);
    };

    const submitSearch = (searchTerm: string) => {
        const trimmed = searchTerm.trim();
        if (!trimmed) return;
        addRecentSearch(trimmed);
        onOpenChange(false);
        router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    };

    const items = results?.items ?? [];
    const isStale = loading || results?.term !== term;
    const showNoResults = !!term && !isStale && items.length === 0;
    const hasMore = !!results && results.totalItems > items.length;

    return (
        <CommandDialog
            open={open}
            onOpenChange={onOpenChange}
            title={t('searchProducts')}
            description={t('searchProducts')}
            className="sm:max-w-xl"
        >
            {/* Filtering is done by Vendure, not cmdk. The first item is
                always "search for <term>", so Enter goes to the full results
                page and arrow keys reach individual products. */}
            <Command shouldFilter={false}>
                <CommandInput
                    placeholder={t('searchProducts')}
                    value={value}
                    onValueChange={setValue}
                />
                <CommandList className="max-h-[min(28rem,60vh)]">
                    {!term && recentSearches.length > 0 && (
                        <CommandGroup heading={t('searchRecent')}>
                            {recentSearches.map((recent) => (
                                <CommandItem
                                    key={recent}
                                    value={`recent:${recent}`}
                                    onSelect={() => submitSearch(recent)}
                                >
                                    <History className="text-muted-foreground" />
                                    <span className="flex-1 truncate">{recent}</span>
                                </CommandItem>
                            ))}
                            <CommandItem
                                value="recent:__clear"
                                onSelect={clearRecentSearches}
                                className="text-muted-foreground"
                            >
                                <X />
                                <span>{t('searchClearRecent')}</span>
                            </CommandItem>
                        </CommandGroup>
                    )}

                    {!term && recentSearches.length === 0 && (
                        <p className="py-6 text-center text-sm text-muted-foreground">{t('searchHint')}</p>
                    )}

                    {term && (
                        <CommandGroup>
                            <CommandItem value={`search:${term}`} onSelect={() => submitSearch(term)}>
                                <Search className="text-muted-foreground" />
                                <span className="flex-1 truncate">{t('searchFor', {term})}</span>
                                {loading ? <Spinner className="text-muted-foreground" /> : <ArrowRight className="text-muted-foreground" />}
                            </CommandItem>
                        </CommandGroup>
                    )}

                    {showNoResults && (
                        <p className="px-2 pb-6 pt-4 text-center text-sm text-muted-foreground">
                            {t('searchNoResults', {term})}
                        </p>
                    )}

                    {term && items.length > 0 && (
                        <>
                            <CommandSeparator />
                            <CommandGroup
                                heading={t('searchSuggestions')}
                                className={isStale ? 'opacity-60 transition-opacity' : 'transition-opacity'}
                            >
                                {items.map((item) => {
                                    const product = readFragment(ProductCardFragment, item);
                                    return (
                                        <CommandItem
                                            key={product.productId}
                                            value={`product:${product.productId}`}
                                            onSelect={() => navigateToProduct(product.slug)}
                                            className="gap-3"
                                        >
                                            <div className="size-12 shrink-0 overflow-hidden rounded-md bg-muted">
                                                {product.productAsset && (
                                                    <Image
                                                        src={`${product.productAsset.preview}?preset=thumb`}
                                                        alt=""
                                                        width={48}
                                                        height={48}
                                                        className="size-full object-cover"
                                                    />
                                                )}
                                            </div>
                                            <span className="flex-1 line-clamp-2 text-muted-foreground">
                                                <HighlightMatch text={product.productName} term={results?.term ?? ''} />
                                            </span>
                                            <span className="shrink-0 text-sm font-medium">
                                                {product.priceWithTax.__typename === 'PriceRange' ? (
                                                    <Price value={product.priceWithTax.min} currencyCode={product.currencyCode} />
                                                ) : product.priceWithTax.__typename === 'SinglePrice' ? (
                                                    <Price value={product.priceWithTax.value} currencyCode={product.currencyCode} />
                                                ) : null}
                                            </span>
                                        </CommandItem>
                                    );
                                })}
                            </CommandGroup>
                            {hasMore && (
                                <CommandGroup>
                                    <CommandItem
                                        value={`all:${term}`}
                                        onSelect={() => submitSearch(term)}
                                        className="justify-center font-medium text-primary"
                                    >
                                        <span>{t('searchViewAll', {count: results?.totalItems ?? 0})}</span>
                                        <ArrowRight />
                                    </CommandItem>
                                </CommandGroup>
                            )}
                        </>
                    )}
                </CommandList>
            </Command>
        </CommandDialog>
    );
}
