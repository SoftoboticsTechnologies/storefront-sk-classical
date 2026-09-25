'use client';

import { useState, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import { resetPasswordAction } from './actions';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Link, useRouter } from '@/platform/i18n/navigation';
import {useTranslations} from 'next-intl';
import {useAuth} from '@/features/authentication/auth-context';

export function ResetPasswordForm() {
    const t = useTranslations('Auth');
    const tErrors = useTranslations('Errors');
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const router = useRouter();
    const {login, refreshCustomer} = useAuth();
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    if (!token) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>{t('invalidResetLink')}</CardTitle>
                    <CardDescription>
                        {t('invalidResetLinkDescription')}
                    </CardDescription>
                </CardHeader>
                <CardFooter>
                    <Link href="/forgot-password">
                        <Button variant="outline" className="w-full">
                            {t('requestNewResetLink')}
                        </Button>
                    </Link>
                </CardFooter>
            </Card>
        );
    }

    const onSubmit = (formData: FormData) => {
        setError(null);
        const password = formData.get('password') as string;
        const confirmPassword = formData.get('confirmPassword') as string;

        startTransition(async () => {
            const result = await resetPasswordAction(token, password, confirmPassword, tErrors);
            if (result.error) {
                setError(result.error);
                return;
            }

            if (result.token) {
                await login(result.token);
            } else {
                await refreshCustomer();
            }

            router.push('/');
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('resetYourPassword')}</CardTitle>
                <CardDescription>
                    {t('resetYourPasswordDescription')}
                </CardDescription>
            </CardHeader>
            <form action={onSubmit}>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="password">{t('newPassword')}</Label>
                        <PasswordInput
                            id="password"
                            name="password"
                            placeholder="••••••••"
                            required
                            disabled={isPending}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">{t('confirmPassword')}</Label>
                        <PasswordInput
                            id="confirmPassword"
                            name="confirmPassword"
                            placeholder="••••••••"
                            required
                            disabled={isPending}
                        />
                    </div>
                    {error && (
                        <div className="text-sm text-destructive">
                            {error}
                        </div>
                    )}
                </CardContent>
                <CardFooter className="flex flex-col space-y-4">
                    <Button type="submit" className="w-full" disabled={isPending}>
                        {isPending ? t('resettingPassword') : t('resetPassword')}
                    </Button>
                    <Link
                        href="/sign-in"
                        className="text-sm text-center text-muted-foreground hover:text-primary"
                    >
                        {t('backToSignIn')}
                    </Link>
                </CardFooter>
            </form>
        </Card>
    );
}
