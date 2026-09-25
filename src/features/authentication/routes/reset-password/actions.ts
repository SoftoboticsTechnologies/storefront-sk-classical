import {mutate} from '@/platform/vendure/client-api';
import {ResetPasswordMutation} from '@/features/authentication/graphql';

export type ResetPasswordActionResult =
    | {error: string; success?: undefined; token?: undefined}
    | {success: true; token?: string; error?: undefined};

/**
 * Client-side counterpart to the old Server Action. `t` is the translated
 * `Errors` message lookup — threaded in from the calling component since a
 * plain async function cannot call the `useTranslations` hook itself.
 */
export async function resetPasswordAction(
    token: string,
    password: string,
    confirmPassword: string,
    t: (key: string) => string,
): Promise<ResetPasswordActionResult> {
    if (!token || !password || !confirmPassword) {
        return {error: t('fieldsRequired')};
    }

    if (password !== confirmPassword) {
        return {error: t('passwordsMismatch')};
    }

    const result = await mutate(ResetPasswordMutation, {
        token,
        password,
    });

    const resetResult = result.data.resetPassword;

    if (resetResult.__typename !== 'CurrentUser') {
        return {error: resetResult.message};
    }

    return {success: true, token: result.token};
}
