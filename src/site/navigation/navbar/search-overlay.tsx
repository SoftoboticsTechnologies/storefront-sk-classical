'use client';

import {useDeferredValue, useEffect, useState, useTransition} from 'react';
import Image from 'next/image';
import {useTranslations} from 'next-intl';
import {useRouter} from '@/platform/i18n/navigation';
import {readFragment} from '@/platform/vendure/graphql';
import {ProductCardFragment} from '@/features/products/graphql';
import {
    Command,
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {getSearchSuggestions, type SearchSuggestion} from '@/features/search/suggest';
import {Price} from '@/features/pricing/price';

interface SearchOverlayProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function SearchOverlay({open, onOpenChange}: SearchOverlayProps) {
    const t = useTranslations('Navigation');
    const router = useRouter();
    const [value, setValue] = useState('');
    const deferredValue = useDeferredValue(value);
    const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        if (!open) return;
        const term = deferredValue.trim();
        if (!term) {
            setSuggestions([]);
            return;
        }
        const handle = setTimeout(() => {
            startTransition(() => {
                getSearchSuggestions(term).then(setSuggestions);
            });
        }, 200);
        return () => clearTimeout(handle);
    }, [deferredValue, open]);

    useEffect(() => {
        if (!open) {
            setValue('');
            setSuggestions([]);
        }
    }, [open]);

    const navigateToProduct = (slug: string) => {
        onOpenChange(false);
        router.push(`/product/${slug}`);
    };

    const submitSearch = () => {
        const term = value.trim();
        if (!term) return;
        onOpenChange(false);
        router.push(`/search?q=${encodeURIComponent(term)}`);
    };

    return (
        <CommandDialog
            open={open}
            onOpenChange={onOpenChange}
            title={t('searchProducts')}
            description={t('searchProducts')}
        >
            <Command shouldFilter={false}>
                <CommandInput
                    placeholder={t('searchProducts')}
                    value={value}
                    onValueChange={setValue}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && suggestions.length === 0) {
                            submitSearch();
                        }
                    }}
                />
                <CommandList>
                    {value.trim() && !isPending && suggestions.length === 0 && (
                        <CommandEmpty>{t('searchNoResults', {term: value.trim()})}</CommandEmpty>
                    )}
                    {suggestions.length > 0 && (
                        <CommandGroup heading={t('searchSuggestions')}>
                            {suggestions.map((item) => {
                                const product = readFragment(ProductCardFragment, item);
                                return (
                                    <CommandItem
                                        key={product.productId}
                                        value={product.productId}
                                        onSelect={() => navigateToProduct(product.slug)}
                                        className="gap-3"
                                    >
                                        <div className="size-10 shrink-0 overflow-hidden rounded-md bg-muted">
                                            {product.productAsset && (
                                                <Image
                                                    src={`${product.productAsset.preview}?preset=thumb`}
                                                    alt=""
                                                    width={40}
                                                    height={40}
                                                    className="size-full object-cover"
                                                />
                                            )}
                                        </div>
                                        <span className="flex-1 truncate">{product.productName}</span>
                                        <span className="text-sm font-medium text-muted-foreground">
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
                    )}
                </CommandList>
            </Command>
        </CommandDialog>
    );
}
