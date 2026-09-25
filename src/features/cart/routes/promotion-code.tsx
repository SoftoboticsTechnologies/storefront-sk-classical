'use client';

import {useState} from 'react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Tag, Loader2} from 'lucide-react';
import {applyPromotionCode, removePromotionCode} from './actions';
import {useTranslations} from 'next-intl';

type ActiveOrder = {
    id: string;
    couponCodes?: string[] | null;
};

export function PromotionCode({activeOrder}: { activeOrder: ActiveOrder }) {
    const t = useTranslations('Cart');
    const [code, setCode] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [removingCode, setRemovingCode] = useState<string | null>(null);

    const handleApply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!code) return;
        setSubmitting(true);
        try {
            await applyPromotionCode(code);
            setCode('');
        } finally {
            setSubmitting(false);
        }
    };

    const handleRemove = async (couponCode: string) => {
        setRemovingCode(couponCode);
        try {
            await removePromotionCode(couponCode);
        } finally {
            setRemovingCode(null);
        }
    };

    return (
        <Card className="mt-4">
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <Tag className="h-5 w-5"/>
                    {t('promotionCode')}
                </CardTitle>
                <CardDescription>
                    {t('enterDiscountCode')}
                </CardDescription>
            </CardHeader>
            <CardContent>
                {activeOrder.couponCodes && activeOrder.couponCodes.length > 0 ? (
                    <div className="space-y-2">
                        {activeOrder.couponCodes.map((couponCode) => (
                            <div key={couponCode}
                                 className="flex items-center justify-between p-3 border rounded-md bg-green-50 dark:bg-green-950/20">
                                <div className="flex items-center gap-2">
                                    <Tag className="h-4 w-4 text-green-600"/>
                                    <span className="font-medium text-sm">{couponCode}</span>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                    disabled={removingCode === couponCode}
                                    onClick={() => handleRemove(couponCode)}
                                >
                                    {removingCode === couponCode && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                                    {t('remove')}
                                </Button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <form onSubmit={handleApply} className="flex gap-2">
                        <Input
                            type="text"
                            name="code"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder={t('enterCode')}
                            className="flex-1"
                            required
                        />
                        <Button type="submit" disabled={submitting}>
                            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {t('apply')}
                        </Button>
                    </form>
                )}
            </CardContent>
        </Card>
    );
}
