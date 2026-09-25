'use client';

import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from '@/platform/i18n/navigation';
import { CheckCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function VerifyPendingContent() {
    const t = useTranslations('Verify');
    const searchParams = useSearchParams();
    const redirectTo = searchParams.get('redirectTo') ?? undefined;

    const signInHref = redirectTo
        ? `/sign-in?redirectTo=${encodeURIComponent(redirectTo)}`
        : '/sign-in';

    return (
        <Card>
            <CardContent className="pt-6 space-y-4">
                <div className="flex justify-center">
                    <CheckCircle className="h-16 w-16 text-green-600" />
                </div>
                <div className="space-y-2 text-center">
                    <h1 className="text-2xl font-bold">{t('pending.title')}</h1>
                    <p className="text-muted-foreground">
                        {t('pending.message')}
                    </p>
                </div>
                <div className="bg-muted p-4 rounded-md">
                    <p className="text-sm text-muted-foreground">
                        {t('pending.spamNote')}
                    </p>
                </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
                <Link href={signInHref} className="w-full">
                    <Button className="w-full">
                        {t('pending.goToSignIn')}
                    </Button>
                </Link>
            </CardFooter>
        </Card>
    );
}
