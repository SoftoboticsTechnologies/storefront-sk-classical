'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { mutate } from '@/platform/vendure/client-api';
import {UpdateCustomerEmailAddressMutation} from '@/features/account/graphql';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from '@/platform/i18n/navigation';
import {useTranslations} from 'next-intl';

type VerifyEmailResult =
    | {status: 'missing-token'}
    | {status: 'success'}
    | {status: 'failed'; message?: string}
    | {status: 'error'};

function VerifyEmailContent() {
    const t = useTranslations('Account');
    const searchParams = useSearchParams();
    const token = searchParams.get('token') ?? undefined;
    const requests = useRef(new Map<string, Promise<VerifyEmailResult>>());
    const [result, setResult] = useState<VerifyEmailResult>();

    useEffect(() => {
        if (!token) {
            setResult({status: 'missing-token'});
            return;
        }

        let request = requests.current.get(token);
        if (!request) {
            request = mutate(UpdateCustomerEmailAddressMutation, {token}, {useAuthToken: true})
                .then((res): VerifyEmailResult => {
                    const updateResult = res.data.updateCustomerEmailAddress;
                    if (updateResult.__typename === 'Success') {
                        return {status: 'success'};
                    }
                    return {status: 'failed', message: updateResult.message};
                })
                .catch((): VerifyEmailResult => ({status: 'error'}));
            requests.current.set(token, request);
        }

        let active = true;
        request.then((res) => {
            if (active) setResult(res);
        });
        return () => {
            active = false;
        };
    }, [token]);

    if (!result) {
        return (
            <Card className="max-w-md mx-auto">
                <CardHeader>
                    <CardTitle>{t('verifyEmail.verifying')}</CardTitle>
                    <CardDescription>
                        {t('verifyEmail.verifyingDesc')}
                    </CardDescription>
                </CardHeader>
            </Card>
        );
    }

    if (result.status === 'missing-token') {
        return (
            <Card className="max-w-md mx-auto">
                <CardHeader>
                    <CardTitle>{t('verifyEmail.invalidLink')}</CardTitle>
                    <CardDescription>
                        {t('verifyEmail.invalidLinkDesc')}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                        {t('verifyEmail.checkEmail')}
                    </p>
                    <Button render={<Link href="/account/profile" />} nativeButton={false}>{t('verifyEmail.goToProfile')}</Button>
                </CardContent>
            </Card>
        );
    }

    if (result.status === 'success') {
        return (
            <Card className="max-w-md mx-auto">
                <CardHeader>
                    <CardTitle>{t('verifyEmail.success')}</CardTitle>
                    <CardDescription>
                        {t('verifyEmail.successDesc')}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                        {t('verifyEmail.successMessage')}
                    </p>
                    <Button render={<Link href="/account/profile" />} nativeButton={false}>{t('verifyEmail.goToProfile')}</Button>
                </CardContent>
            </Card>
        );
    }

    if (result.status === 'failed') {
        return (
            <Card className="max-w-md mx-auto">
                <CardHeader>
                    <CardTitle>{t('verifyEmail.failed')}</CardTitle>
                    <CardDescription>
                        {result.message || t('verifyEmail.failedDefault')}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                        {t('verifyEmail.failedMessage')}
                    </p>
                    <Button render={<Link href="/account/profile" />} nativeButton={false}>{t('verifyEmail.goToProfile')}</Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="max-w-md mx-auto">
            <CardHeader>
                <CardTitle>{t('verifyEmail.error')}</CardTitle>
                <CardDescription>
                    {t('verifyEmail.errorDesc')}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                    {t('verifyEmail.errorMessage')}
                </p>
                <Button render={<Link href="/account/profile" />} nativeButton={false}>{t('verifyEmail.goToProfile')}</Button>
            </CardContent>
        </Card>
    );
}

export default function VerifyEmailPage() {
    return (
        <div className="container mx-auto px-4 py-8 mt-16">
            <Suspense fallback={null}>
                <VerifyEmailContent />
            </Suspense>
        </div>
    );
}
