'use client';

import {useState} from 'react';
import Image from 'next/image';
import { Link } from '@/platform/i18n/navigation';
import {Button} from '@/components/ui/button';
import {Minus, Plus, X, Loader2} from 'lucide-react';
import {Price} from '@/features/pricing/price';
import {removeFromCart, adjustQuantity} from './actions';
import {useTranslations} from 'next-intl';

type ActiveOrder = {
    id: string;
    currencyCode: string;
    lines: Array<{
        id: string;
        quantity: number;
        unitPriceWithTax: number;
        linePriceWithTax: number;
        productVariant: {
            id: string;
            name: string;
            sku: string;
            product: {
                name: string;
                slug: string;
                featuredAsset?: {
                    preview: string;
                } | null;
            };
        };
    }>;
};

export function CartItems({activeOrder}: { activeOrder: ActiveOrder | null }) {
    const t = useTranslations('Cart');
    const [pendingLineId, setPendingLineId] = useState<string | null>(null);

    if (!activeOrder || activeOrder.lines.length === 0) {
        return (
            <div className="container mx-auto px-4 py-16">
                <div className="text-center">
                    <h1 className="text-3xl font-bold mb-4">{t('empty')}</h1>
                    <p className="text-muted-foreground mb-8">
                        {t('emptyMessage')}
                    </p>
                    <Button render={<Link href="/" />} nativeButton={false}>{t('continueShopping')}</Button>
                </div>
            </div>
        );
    }

    const handleAdjust = async (lineId: string, quantity: number) => {
        setPendingLineId(lineId);
        try {
            await adjustQuantity(lineId, quantity);
        } finally {
            setPendingLineId(null);
        }
    };

    const handleRemove = async (lineId: string) => {
        setPendingLineId(lineId);
        try {
            await removeFromCart(lineId);
        } finally {
            setPendingLineId(null);
        }
    };

    return (
        <div className="lg:col-span-2 divide-y divide-border">
            {activeOrder.lines.map((line) => {
                const isPending = pendingLineId === line.id;
                return (
                <div
                    key={line.id}
                    className="flex flex-col sm:flex-row gap-4 p-4 first:rounded-t-xl last:rounded-b-xl border-x first:border-t last:border-b bg-card transition-colors duration-200 hover:bg-muted/30"
                >
                    {line.productVariant.product.featuredAsset && (
                        <Link
                            href={`/product/${line.productVariant.product.slug}`}
                            prefetch={false}
                            className="flex-shrink-0"
                        >
                            <Image
                                src={line.productVariant.product.featuredAsset.preview}
                                alt={line.productVariant.name}
                                width={120}
                                height={120}
                                className="rounded-xl object-cover w-full sm:w-[120px] h-[120px]"
                            />
                        </Link>
                    )}

                    <div className="flex-grow min-w-0">
                        <Link
                            href={`/product/${line.productVariant.product.slug}`}
                            prefetch={false}
                            className="font-semibold hover:underline block"
                        >
                            {line.productVariant.product.name}
                        </Link>
                        {line.productVariant.name !== line.productVariant.product.name && (
                            <p className="text-sm text-muted-foreground mt-1">
                                {line.productVariant.name}
                            </p>
                        )}
                        <p className="text-sm text-muted-foreground mt-1">
                            {t('sku', {sku: line.productVariant.sku})}
                        </p>
                        <p className="text-sm text-muted-foreground mt-2 sm:hidden">
                            <Price value={line.unitPriceWithTax} currencyCode={activeOrder.currencyCode}/> {t('each')}
                        </p>

                        <div className="flex items-center gap-3 mt-4">
                            <div className="flex items-center gap-1 border rounded-full bg-muted/50">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 rounded-full transition-all duration-200 hover:bg-background"
                                    disabled={line.quantity <= 1 || isPending}
                                    onClick={() => handleAdjust(line.id, Math.max(1, line.quantity - 1))}
                                >
                                    <Minus className="h-4 w-4"/>
                                </Button>

                                <span className="w-10 text-center font-semibold tabular-nums transition-all duration-200">{line.quantity}</span>

                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 rounded-full transition-all duration-200 hover:bg-background"
                                    disabled={isPending}
                                    onClick={() => handleAdjust(line.id, line.quantity + 1)}
                                >
                                    <Plus className="h-4 w-4"/>
                                </Button>
                            </div>

                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 rounded-full text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors duration-200"
                                disabled={isPending}
                                onClick={() => handleRemove(line.id)}
                            >
                                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-5 w-5"/>}
                            </Button>

                            <div className="sm:hidden ml-auto">
                                <p className="font-semibold text-lg">
                                    <Price value={line.linePriceWithTax}
                                           currencyCode={activeOrder.currencyCode}/>
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="hidden sm:block text-right flex-shrink-0">
                        <p className="font-semibold text-lg">
                            <Price value={line.linePriceWithTax} currencyCode={activeOrder.currencyCode}/>
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                            <Price value={line.unitPriceWithTax} currencyCode={activeOrder.currencyCode}/> {t('each')}
                        </p>
                    </div>
                </div>
                );
            })}
        </div>
    );
}
