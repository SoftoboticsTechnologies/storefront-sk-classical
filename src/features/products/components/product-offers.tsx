'use client';

import {useEffect, useState} from 'react';
import {useFormatter, useLocale, useTranslations} from 'next-intl';
import {ChevronRight, Copy, Tag, Ticket} from 'lucide-react';
import {toast} from 'sonner';
import {Sheet, SheetContent, SheetDescription, SheetTitle} from '@/components/ui/sheet';
import {Price} from '@/features/pricing/price';
import {getLowestOfferPrice, loadPublicPromotions, type PublicPromotion} from '@/features/products/offers';

interface ProductOffersProps {
    /** Live price (minor units, tax inclusive) of the selected variant. */
    price: number;
    currencyCode: string;
    /** Channel default currency, which Vendure promotion amounts are configured in. */
    channelCurrencyCode: string;
}

/**
 * Dashed offers strip under the price ("Get this as low as ₹X", or "View
 * available offers" when no offer lowers this item's price) that opens an
 * Offers & Coupons drawer. Data is real Vendure promotions from
 * `publicPromotions`; renders nothing until that query exists and returns offers.
 */
export function ProductOffers({price, currencyCode, channelCurrencyCode}: ProductOffersProps) {
    const t = useTranslations('Product');
    const locale = useLocale();
    const [promotions, setPromotions] = useState<PublicPromotion[]>([]);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        let cancelled = false;
        loadPublicPromotions(locale).then((result) => {
            if (!cancelled) setPromotions(result);
        });
        return () => {
            cancelled = true;
        };
    }, [locale]);

    if (promotions.length === 0) return null;

    // Minimum-order amounts are in the channel currency; when the viewer browses in
    // another one, offers with a minimum can't be checked against this price.
    const comparable = currencyCode === channelCurrencyCode
        ? promotions
        : promotions.filter((promotion) => promotion.minimumOrderAmount == null);
    const lowestPrice = getLowestOfferPrice(price, comparable);

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="animate-fade-in group my-1.5 flex w-full items-center justify-between gap-3 rounded-xl border border-dashed border-gold bg-gold/5 px-3.5 py-2.5 text-left text-sm font-medium text-primary transition hover:bg-gold/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
                <span className="inline-flex items-center gap-2">
                    <Ticket className="size-4 shrink-0" aria-hidden="true" />
                    {lowestPrice != null ? (
                        <span>
                            {t('offers.lowAs')}{' '}
                            <span className="font-bold">
                                <Price value={lowestPrice} currencyCode={currencyCode} />
                            </span>
                        </span>
                    ) : (
                        t('offers.view')
                    )}
                </span>
                <ChevronRight className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </button>

            <Sheet open={open} onOpenChange={setOpen}>
                <SheetContent side="right" className="w-full gap-0 sm:max-w-md">
                    <div className="border-b border-gold/30 px-5 pt-5 pb-4">
                        <SheetTitle className="text-xl font-bold uppercase tracking-wide">{t('offers.title')}</SheetTitle>
                        <span className="mt-1.5 block h-0.5 w-6 rounded-full bg-primary" aria-hidden="true" />
                        <SheetDescription className="mt-2 text-xs">{t('offers.applyAtCheckout')}</SheetDescription>
                    </div>
                    <div className="flex-1 space-y-3 overflow-y-auto px-5 py-5">
                        <h3 className="text-base font-semibold">{t('offers.checkout')}</h3>
                        {promotions.map((promotion) => (
                            <OfferCard key={promotion.id} promotion={promotion} currencyCode={channelCurrencyCode} />
                        ))}
                    </div>
                </SheetContent>
            </Sheet>
        </>
    );
}

function OfferCard({promotion, currencyCode}: {promotion: PublicPromotion; currencyCode: string}) {
    const t = useTranslations('Product');
    const format = useFormatter();
    const [expanded, setExpanded] = useState(false);
    const hasDetails = !!promotion.description || promotion.minimumOrderAmount != null || !!promotion.endsAt;

    const copyCode = async (code: string) => {
        try {
            await navigator.clipboard.writeText(code);
            toast.success(t('offers.copied'));
        } catch {
            // Clipboard blocked; the code is still visible to copy by hand.
        }
    };

    return (
        <div className="flex gap-3 rounded-xl border border-dashed border-gold/60 bg-card p-4">
            <Tag className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
            <div className="min-w-0 flex-1 space-y-1.5">
                <p className="font-medium text-foreground">{promotion.name}</p>

                {promotion.couponCode && (
                    <button
                        type="button"
                        onClick={() => copyCode(promotion.couponCode!)}
                        title={t('offers.copy')}
                        className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-primary/50 bg-primary/5 px-2 py-0.5 font-mono text-xs font-semibold tracking-wider text-primary hover:bg-primary/10"
                    >
                        {promotion.couponCode}
                        <Copy className="size-3" aria-hidden="true" />
                        <span className="sr-only">{t('offers.copy')}</span>
                    </button>
                )}

                {expanded && (
                    <div className="animate-fade-in space-y-1 text-xs leading-relaxed text-muted-foreground">
                        {promotion.description && <p>{promotion.description}</p>}
                        {promotion.minimumOrderAmount != null && (
                            <p>
                                {t('offers.minOrder')}{' '}
                                <Price value={promotion.minimumOrderAmount} currencyCode={currencyCode} />
                            </p>
                        )}
                        {promotion.endsAt && (
                            <p>{t('offers.validTill', {date: format.dateTime(new Date(promotion.endsAt), {dateStyle: 'medium'})})}</p>
                        )}
                    </div>
                )}

                {hasDetails && (
                    <button
                        type="button"
                        onClick={() => setExpanded((value) => !value)}
                        aria-expanded={expanded}
                        className="text-sm font-semibold text-primary hover:underline underline-offset-4"
                    >
                        {expanded ? t('offers.showLess') : t('offers.knowMore')}
                    </button>
                )}
            </div>
        </div>
    );
}
