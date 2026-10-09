'use client';

import {useEffect, useMemo, useRef, useState, useTransition} from 'react';
import {useRouter} from '@/platform/i18n/navigation';
import {Button} from '@/components/ui/button';
import {Label} from '@/components/ui/label';
import {RadioGroup, RadioGroupItem} from '@/components/ui/radio-group';
import {ShoppingCart, Diamond, Info, Loader2, Minus, Plus, Zap} from 'lucide-react';
import {cn} from '@/lib/utils';
import {addToCart} from '@/features/products/add-to-cart';
import {useCartLine} from '@/features/products/use-cart-line';
import {adjustQuantity, removeFromCart} from '@/features/cart/cart-mutations';
import {toast} from 'sonner';
import {Price} from '@/features/pricing/price';
import {useTranslations} from 'next-intl';
import {useLiveProductPricing, type LiveVariantPricing} from '@/features/products/product-price-client';
import {WishlistButton} from '@/features/wishlist/wishlist-button';
import {ProductShareButton} from '@/features/products/components/product-share-button';
import {ProductOffers} from '@/features/products/components/product-offers';

interface ProductInfoProps {
    product: {
        id: string;
        slug: string;
        name: string;
        description: string;
        variants: Array<{
            id: string;
            name: string;
            sku: string;
            priceWithTax: number;
            stockLevel: string;
            options: Array<{
                id: string;
                code: string;
                name: string;
                groupId: string;
                group: {
                    id: string;
                    code: string;
                    name: string;
                };
            }>;
        }>;
        optionGroups: Array<{
            id: string;
            code: string;
            name: string;
            options: Array<{
                id: string;
                code: string;
                name: string;
            }>;
        }>;
    };
    /** Channel default currency the build-time variant prices are in. */
    buildCurrencyCode: string;
    /**
     * The variant to select initially, resolved server-side from the URL's
     * optional `/[sku]` segment (or `product.variants[0]` when absent) — see
     * routes/page.tsx. Options are seeded from this variant so the first
     * client render matches the statically-exported HTML exactly.
     */
    initialVariantId: string;
}

export function ProductInfo({product, buildCurrencyCode, initialVariantId}: ProductInfoProps) {
    const t = useTranslations('Product');
    // Build-time price/stock for every variant, in the channel default
    // currency — passed as initialData so useLiveProductPricing can skip its
    // re-fetch entirely when the viewer's currency matches (the common
    // case), instead of always refetching on every PDP mount.
    const buildPricing = useMemo<{currencyCode: string; variants: LiveVariantPricing[]}>(() => ({
        currencyCode: buildCurrencyCode,
        variants: product.variants.map((variant) => ({
            id: variant.id,
            priceWithTax: variant.priceWithTax,
            stockLevel: variant.stockLevel,
        })),
    }), [product.variants, buildCurrencyCode]);
    const {data: livePricing, loading: pricingLoading} = useLiveProductPricing(
        product.slug,
        buildPricing,
        buildCurrencyCode
    );
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const ctaRef = useRef<HTMLDivElement>(null);
    const [showStickyBar, setShowStickyBar] = useState(false);

    // Mobile sticky buy bar: visible whenever the main Add to Cart row is off screen.
    useEffect(() => {
        const el = ctaRef.current;
        if (!el) return;
        const observer = new IntersectionObserver(([entry]) => setShowStickyBar(!entry.isIntersecting));
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    // Seeded from the variant the current URL resolved to (server-side, in
    // routes/page.tsx) rather than read here via next/navigation's
    // useSearchParams(), which requires a Suspense boundary or de-opts this
    // entire page to client-side-only rendering (no static HTML at all — see
    // docs/decisions.md).
    const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() => {
        const initialOptions: Record<string, string> = {};
        const initialVariant = product.variants.find((v) => v.id === initialVariantId) ?? product.variants[0];
        initialVariant?.options.forEach((option) => {
            initialOptions[option.groupId] = option.id;
        });
        return initialOptions;
    });

    // Find the matching variant based on selected options
    const selectedVariant = useMemo(() => {
        if (product.variants.length === 1) {
            return product.variants[0];
        }

        // If not all option groups have a selection, return null
        if (Object.keys(selectedOptions).length !== product.optionGroups.length) {
            return null;
        }

        // Find variant that matches all selected options
        return product.variants.find((variant) => {
            const variantOptionIds = variant.options.map((opt) => opt.id);
            const selectedOptionIds = Object.values(selectedOptions);
            return selectedOptionIds.every((optId) => variantOptionIds.includes(optId));
        });
    }, [selectedOptions, product.variants, product.optionGroups]);

    const handleOptionChange = (groupId: string, optionId: string) => {
        const nextOptions = {...selectedOptions, [groupId]: optionId};
        setSelectedOptions(nextOptions);

        // Only navigate once every option group has a selection — until then
        // there's no single matching variant (and therefore no prerendered
        // page) to go to yet.
        if (Object.keys(nextOptions).length !== product.optionGroups.length) {
            return;
        }

        const targetVariant = product.variants.find((variant) => {
            const variantOptionIds = variant.options.map((opt) => opt.id);
            return Object.values(nextOptions).every((optId) => variantOptionIds.includes(optId));
        });

        if (!targetVariant) return;

        // Each variant has its own prerendered static page (routes/page.tsx's
        // generateStaticParams enumerates one per non-default variant), so
        // this is a real navigation to already-rendered content — its price
        // is genuinely present in that page's HTML, not just updated in the
        // live DOM. The default variant (product.variants[0]) lives at the
        // product's own bare URL rather than a `/[sku]` sub-path.
        const isDefaultVariant = targetVariant.id === product.variants[0]?.id;
        router.push(
            isDefaultVariant ? `/product/${product.slug}` : `/product/${product.slug}/${targetVariant.sku}`,
            {scroll: false}
        );
    };

    // This variant's line in the ActiveOrder (Vendure is the source of truth); once it
    // exists, Add to Cart turns into a − qty + stepper bound to that line.
    const {line: cartLine, refresh: refreshCartLine} = useCartLine(selectedVariant?.id);

    // Which control started the pending cart mutation, so only that one shows progress.
    const [pendingAction, setPendingAction] = useState<'add' | 'buy' | 'increase' | 'decrease' | null>(null);

    const showCartError = (error?: string) => {
        toast.error(t('errorTitle'), {description: error || t('errorAddToCart')});
    };

    const handleBuyNow = () => {
        if (!selectedVariant) return;

        // Already in the cart: go to checkout with the quantity the customer chose.
        if (cartLine) {
            router.push('/checkout');
            return;
        }

        setPendingAction('buy');
        startTransition(async () => {
            // Same ActiveOrder add as Add to Cart, then on to checkout.
            const result = await addToCart(selectedVariant.id, 1);

            if (result.success) {
                router.push('/checkout');
            } else {
                setPendingAction(null);
                showCartError(result.error);
            }
        });
    };

    const handleAddToCart = async () => {
        if (!selectedVariant) return;

        setPendingAction('add');
        startTransition(async () => {
            const result = await addToCart(selectedVariant.id, 1);

            if (result.success) {
                await refreshCartLine();
                toast.success(t('addedToCartMessage'), {
                    description: t('addedToCartDescription', {name: product.name}),
                });
            } else {
                showCartError(result.error);
            }
            setPendingAction(null);
        });
    };

    const handleStep = (delta: 1 | -1) => {
        if (!cartLine) return;

        setPendingAction(delta > 0 ? 'increase' : 'decrease');
        startTransition(async () => {
            const nextQuantity = cartLine.quantity + delta;
            // At 1, "−" removes the line and the button returns to Add to Cart.
            const result = nextQuantity <= 0
                ? await removeFromCart(cartLine.id)
                : await adjustQuantity(cartLine.id, nextQuantity);

            await refreshCartLine();
            if (!result.success) {
                showCartError(result.error);
            } else if (nextQuantity <= 0) {
                toast.success(t('removedFromCart'));
            }
            setPendingAction(null);
        });
    };

    // Price/stock are currency-dependent, so the live-fetched value (correct
    // for the viewer's active currency) takes over once it resolves. Until
    // then, fall back to the real price/stock already fetched server-side at
    // build time (`selectedVariant`) so a genuine value is always shown —
    // both on first paint and in the statically-exported HTML for SEO —
    // instead of a skeleton.
    const liveVariant = selectedVariant
        ? livePricing?.variants.find((variant) => variant.id === selectedVariant.id)
        : undefined;
    const displayVariant = liveVariant
        ? {priceWithTax: liveVariant.priceWithTax, stockLevel: liveVariant.stockLevel}
        : selectedVariant
            ? {priceWithTax: selectedVariant.priceWithTax, stockLevel: selectedVariant.stockLevel}
            : undefined;
    const displayCurrencyCode = livePricing?.currencyCode ?? buildCurrencyCode;
    const isCheckingAvailability = pricingLoading && !liveVariant;
    const isInStock = !!displayVariant && displayVariant.stockLevel !== 'OUT_OF_STOCK';
    const canAddToCart = !!selectedVariant && !isCheckingAvailability && isInStock;

    const addToCartLabel = isPending && pendingAction === 'add'
        ? t('adding')
        : !selectedVariant && product.optionGroups.length > 0
            ? t('selectOptions')
            : selectedVariant && isCheckingAvailability
                ? t('checkingAvailability')
                : !isInStock
                    ? t('outOfStock')
                    : t('addToCart');

    const pillClass = 'flex-1 h-11 rounded-full font-semibold transition-colors';

    // Render helpers (not components) so both button rows share this state without remounting.
    const renderAddToCart = (compact = false) => {
        const textSize = compact ? 'text-sm' : 'text-sm sm:text-base';

        if (cartLine) {
            const stepButton = 'flex h-full w-11 shrink-0 items-center justify-center rounded-full text-primary transition-colors hover:bg-gold/15 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold';
            return (
                <div className={cn(pillClass, 'flex items-center justify-between border border-gold/60 bg-background px-0.5', textSize)}>
                    <button
                        type="button"
                        onClick={() => handleStep(-1)}
                        disabled={isPending}
                        aria-label={t('decreaseQuantity')}
                        className={stepButton}
                    >
                        {pendingAction === 'decrease' ? <Loader2 className="size-4 animate-spin"/> : <Minus className="size-4"/>}
                    </button>
                    <span className="min-w-8 text-center font-semibold tabular-nums text-primary" aria-live="polite">
                        <span className="sr-only">{t('quantityInCart')} </span>
                        {cartLine.quantity}
                    </span>
                    <button
                        type="button"
                        onClick={() => handleStep(1)}
                        disabled={isPending}
                        aria-label={t('increaseQuantity')}
                        className={stepButton}
                    >
                        {pendingAction === 'increase' ? <Loader2 className="size-4 animate-spin"/> : <Plus className="size-4"/>}
                    </button>
                </div>
            );
        }

        return (
            <Button
                variant="outline"
                className={cn(pillClass, 'border-gold/60 bg-background text-primary hover:bg-gold/10 hover:text-primary', textSize)}
                disabled={!canAddToCart || isPending}
                onClick={handleAddToCart}
            >
                {pendingAction === 'add' ? <Loader2 className="mr-1.5 size-4 animate-spin"/> : <ShoppingCart className="mr-1.5 size-4"/>}
                {addToCartLabel}
            </Button>
        );
    };

    const renderBuyNow = (compact = false) => (
        <Button
            className={cn(pillClass, 'bg-primary text-primary-foreground hover:bg-primary/90', compact ? 'text-sm' : 'text-sm sm:text-base')}
            disabled={!canAddToCart || isPending}
            onClick={handleBuyNow}
        >
            {isPending && pendingAction === 'buy' ? <Loader2 className="mr-1.5 size-4 animate-spin"/> : <Zap className="mr-1.5 size-4"/>}
            {t('buyNow')}
        </Button>
    );

    return (
        <div className="space-y-5">
            {/* Title + share */}
            <div className="flex items-start justify-between gap-4">
                <h1 className="text-2xl md:text-3xl font-medium leading-snug">{product.name}</h1>
                <div className="flex shrink-0 items-center gap-2">
                    <WishlistButton slug={product.slug} />
                    <ProductShareButton name={product.name} />
                </div>
            </div>

            {/* Price + tax note */}
            {displayVariant && (
                <div className="space-y-1.5">
                    <p className="text-3xl md:text-4xl font-bold tracking-tight text-primary">
                        <Price value={displayVariant.priceWithTax} currencyCode={displayCurrencyCode}/>
                    </p>
                    <ProductOffers
                        price={displayVariant.priceWithTax}
                        currencyCode={displayCurrencyCode}
                        channelCurrencyCode={buildCurrencyCode}
                    />
                    <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Info className="size-3.5" aria-hidden="true" />
                        {t('taxInclusive')}
                    </p>
                </div>
            )}

            <div className="ornament-divider" aria-hidden="true">
                <Diamond className="size-2 fill-current" />
            </div>

            {/* Option Groups — one card per group, like a size picker. */}
            {product.optionGroups.map((group) => (
                <div key={group.id} className="space-y-3 rounded-2xl border border-gold/30 bg-card p-4">
                    <Label className="text-base font-semibold">
                        {group.name}
                    </Label>
                    <RadioGroup
                        value={selectedOptions[group.id] || ''}
                        onValueChange={(value) => handleOptionChange(group.id, value)}
                    >
                        <div className="flex flex-wrap gap-2.5">
                            {group.options.map((option) => (
                                <div key={option.id}>
                                    <RadioGroupItem
                                        value={option.id}
                                        id={option.id}
                                        className="peer sr-only"
                                    />
                                    <Label
                                        htmlFor={option.id}
                                        className="flex min-w-16 items-center justify-center rounded-lg border border-gold/40 bg-background px-4 py-2.5 text-sm font-medium cursor-pointer transition-all hover:border-gold hover:bg-gold/10 peer-data-[checked]:border-primary peer-data-[checked]:bg-primary/5 peer-data-[checked]:text-primary peer-data-[checked]:ring-1 peer-data-[checked]:ring-primary"
                                    >
                                        {option.name}
                                    </Label>
                                </div>
                            ))}
                        </div>
                    </RadioGroup>
                </div>
            ))}

            {/* Stock Status: only flagged when the variant can't be bought. */}
            {displayVariant && !isInStock && (
                <div className="text-sm">
                    <span className="inline-flex items-center gap-1.5 text-destructive font-medium">
                        <span className="h-2 w-2 rounded-full bg-destructive" />
                        {t('outOfStock')}
                    </span>
                </div>
            )}

            {/* Add to Cart + Buy Now: equal-width pills, ~44px tall. */}
            <div ref={ctaRef} className="flex gap-3">
                {renderAddToCart()}
                {renderBuyNow()}
            </div>

            {/* Mobile sticky buy bar, shown once the main buttons scroll out of view. The
                right padding leaves room for the site's floating WhatsApp button, which
                then sits at the end of the bar. Same handlers/state as the main buttons. */}
            <div
                className={cn(
                    'fixed inset-x-0 bottom-0 z-30 border-t border-gold/30 bg-background/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pr-20 shadow-[0_-8px_24px_-12px_rgb(74_15_22/0.35)] backdrop-blur transition-transform duration-300 lg:hidden',
                    showStickyBar ? 'translate-y-0' : 'translate-y-full'
                )}
                aria-hidden={!showStickyBar}
                inert={!showStickyBar}
            >
                <div className="flex gap-2.5">
                    {renderAddToCart(true)}
                    {renderBuyNow(true)}
                </div>
            </div>
        </div>
    );
}
