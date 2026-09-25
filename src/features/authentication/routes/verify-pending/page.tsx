import type {Metadata} from 'next';
import {Suspense} from 'react';
import {getRouteLocale} from '@/platform/i18n/server';
import {getTranslations} from 'next-intl/server';
import {VerifyPendingContent} from './verify-pending-content';

export const metadata: Metadata = {
    title: 'Verification Pending',
    description: 'Check your email to verify your account.',
};

export default async function VerifyPendingPage() {
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'Verify'});
    return (
        <div className="flex min-h-screen items-center justify-center px-4">
            <div className="w-full max-w-md space-y-6">
                <Suspense fallback={<div>{t('loading')}</div>}>
                    <VerifyPendingContent />
                </Suspense>
            </div>
        </div>
    );
}
