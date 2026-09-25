import {mutate} from '@/platform/vendure/client-api';
import {LoginMutation} from '@/features/authentication/graphql';

export type LoginActionResult =
    | {error: string; success?: undefined; token?: undefined}
    | {success: true; token?: string; error?: undefined};

/**
 * Client-side counterpart to the old Server Action. `t` is the translated
 * `Errors` message lookup — threaded in from the calling component since a
 * plain async function cannot call the `useTranslations` hook itself.
 */
export async function loginAction(
    username: string,
    password: string,
    t: (key: string) => string,
): Promise<LoginActionResult> {
    const result = await mutate(LoginMutation, {
        username,
        password,
    }, {useAuthToken: true});

    const loginResult = result.data.login;

    if (loginResult.__typename !== 'CurrentUser') {
        if (loginResult.__typename === 'NotVerifiedError') {
            return {error: t('verifyEmailFirst')};
        }
        return {error: t('invalidCredentials')};
    }

    return {success: true, token: result.token};
}
