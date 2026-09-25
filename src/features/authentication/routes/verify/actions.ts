import {mutate} from '@/platform/vendure/client-api';
import {VerifyCustomerAccountMutation} from '@/features/authentication/graphql';

export type VerifyAccountActionResult =
    | {error: string; success?: undefined; token?: undefined}
    | {success: true; token?: string; error?: undefined};

/**
 * Client-side counterpart to the old Server Action. `t` is the translated
 * `Errors` message lookup — threaded in from the calling component since a
 * plain async function cannot call the `useTranslations` hook itself.
 */
export async function verifyAccountAction(
    token: string,
    t: (key: string) => string,
    password?: string,
): Promise<VerifyAccountActionResult> {
    if (!token) {
        return {error: t('verificationTokenRequired')};
    }

    try {
        const result = await mutate(VerifyCustomerAccountMutation, {
            token,
            password: password || undefined,
        });

        const verifyResult = result.data.verifyCustomerAccount;

        if (verifyResult.__typename !== 'CurrentUser') {
            return {error: verifyResult.message};
        }

        return {success: true, token: result.token};
    } catch {
        return {error: t('unexpectedError')};
    }
}
