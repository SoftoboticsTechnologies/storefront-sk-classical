'use client';

import {useState, useMemo, useTransition} from 'react';
import {useRouter} from '@/platform/i18n/navigation';
import {Button} from '@/components/ui/button';
import {Label} from '@/components/ui/label';
import {RadioGroup, RadioGroupItem} from '@/components/ui/radio-group';
import {Separator} from '@/components/ui/separator';
import {ShoppingCart, CheckCircle2} from 'lucide-react';
import {addToCart} from '@/features/products/add-to-cart';
import {toast} from 'sonner';
import {Price} from '@/features/pricing/price';
import {useTranslations} from 'next-intl';
import {useLiveProductPricing, type LiveVariantPricing} from '@/features/products/product-price-client';

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
    const [isAdded, setIsAdded] = useState(false);

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

    const handleAddToCart = async () => {
        if (!selectedVariant) return;

        startTransition(async () => {
            const result = await addToCart(selectedVariant.id, 1);

            if (result.success) {
                setIsAdded(true);
                toast.success(t('addedToCartMessage'), {
                    description: t('addedToCartDescription', {name: product.name}),
                });

                // Reset the added state after 2 seconds
                setTimeout(() => setIsAdded(false), 2000);
            } else {
                toast.error(t('errorTitle'), {
                    description: result.error || t('errorAddToCart'),
                });
            }
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

    return (
        <div className="space-y-6">
            {/* Product Title & Price */}
            <div className="space-y-2">
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{product.name}</h1>
                {displayVariant && (
                    <p className="text-2xl md:text-3xl text-muted-foreground font-semibold mt-3">
                        <Price value={displayVariant.priceWithTax} currencyCode={displayCurrencyCode}/>
                    </p>
                )}
            </div>

            <Separator />

            {/* Product Description */}
            <div className="prose prose-sm max-w-none text-muted-foreground">
                <div dangerouslySetInnerHTML={{__html: product.description}}/>
            </div>

            {/* Option Groups */}
            {product.optionGroups.length > 0 && (
                <div className="space-y-5">
                    {product.optionGroups.map((group) => (
                        <div key={group.id} className="space-y-3">
                            <Label className="text-base font-semibold">
                                {group.name}
                            </Label>
                            <RadioGroup
                                value={selectedOptions[group.id] || ''}
                                onValueChange={(value) => handleOptionChange(group.id, value)}
                            >
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {group.options.map((option) => (
                                        <div key={option.id}>
                                            <RadioGroupItem
                                                value={option.id}
                                                id={option.id}
                                                className="peer sr-only"
                                            />
                                            <Label
                                                htmlFor={option.id}
                                                className="flex items-center justify-center rounded-lg border-2 border-muted bg-popover px-4 py-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground peer-data-[checked]:border-primary peer-data-[checked]:ring-2 peer-data-[checked]:ring-primary/20 peer-data-[checked]:bg-primary/5 cursor-pointer transition-all"
                                            >
                                                {option.name}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </RadioGroup>
                        </div>
                    ))}
                </div>
            )}

            {/* Stock Status */}
            {displayVariant && (
                <div className="text-sm">
                    {isInStock ? (
                        <span className="inline-flex items-center gap-1.5 text-green-600 font-medium">
                            <span className="h-2 w-2 rounded-full bg-green-600" />
                            {t('inStock')}
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1.5 text-destructive font-medium">
                            <span className="h-2 w-2 rounded-full bg-destructive" />
                            {t('outOfStock')}
                        </span>
                    )}
                </div>
            )}

            {/* Add to Cart Button */}
            <div className="pt-2 space-y-3">
                <Button
                    size="lg"
                    className="w-full h-12 text-base font-semibold rounded-lg"
                    disabled={!canAddToCart || isPending}
                    onClick={handleAddToCart}
                >
                    {isAdded ? (
                        <>
                            <CheckCircle2 className="mr-2 h-5 w-5"/>
                            {t('addedToCart')}
                        </>
                    ) : (
                        <>
                            <ShoppingCart className="mr-2 h-5 w-5"/>
                            {isPending
                                ? t('adding')
                                : !selectedVariant && product.optionGroups.length > 0
                                    ? t('selectOptions')
                                    : selectedVariant && isCheckingAvailability
                                        ? t('checkingAvailability')
                                        : !isInStock
                                            ? t('outOfStock')
                                            : t('addToCart')}
                        </>
                    )}
                </Button>
            </div>

            {/* SKU */}
            {selectedVariant && (
                <div className="text-xs text-muted-foreground">
                    {t('sku', {sku: selectedVariant.sku})}
                </div>
            )}
        </div>
    );
}
