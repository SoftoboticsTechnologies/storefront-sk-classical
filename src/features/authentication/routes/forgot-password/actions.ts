import {mutate} from '@/platform/vendure/client-api';
import {RequestPasswordResetMutation} from '@/features/authentication/graphql';

export type RequestPasswordResetActionResult =
    | {error: string; success?: undefined}
    | {success: true; error?: undefined};

/**
 * Client-side counterpart to the old Server Action. `t` is the translated
 * `Errors` message lookup — threaded in from the calling component since a
 * plain async function cannot call the `useTranslations` hook itself.
 */
export async function requestPasswordResetAction(
    emailAddress: string,
    t: (key: string) => string,
): Promise<RequestPasswordResetActionResult> {
    if (!emailAddress) {
        return {error: t('emailRequired')};
    }

    try {
        const result = await mutate(RequestPasswordResetMutation, {
            emailAddress,
        });

        const resetResult = result.data.requestPasswordReset;

        if (resetResult?.__typename !== 'Success') {
            return {error: resetResult?.message || t('failedPasswordReset')};
        }

        return {success: true};
    } catch {
        return {error: t('unexpectedError')};
    }
}
