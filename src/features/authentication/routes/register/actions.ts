import {mutate} from '@/platform/vendure/client-api';
import {RegisterCustomerAccountMutation} from '@/features/authentication/graphql';

export interface RegisterInput {
    emailAddress: string;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    password: string;
}

export type RegisterActionResult =
    | {error: string; success?: undefined}
    | {success: true; error?: undefined};

/**
 * Client-side counterpart to the old Server Action. `t` is the translated
 * `Errors` message lookup — threaded in from the calling component since a
 * plain async function cannot call the `useTranslations` hook itself.
 */
export async function registerAction(
    input: RegisterInput,
    t: (key: string) => string,
): Promise<RegisterActionResult> {
    const {emailAddress, firstName, lastName, phoneNumber, password} = input;

    if (!emailAddress || !password) {
        return {error: t('emailPasswordRequired')};
    }

    const result = await mutate(RegisterCustomerAccountMutation, {
        input: {
            emailAddress,
            firstName: firstName || undefined,
            lastName: lastName || undefined,
            phoneNumber: phoneNumber || undefined,
            password,
        }
    });

    const registerResult = result.data.registerCustomerAccount;

    if (registerResult.__typename !== 'Success') {
        return {error: registerResult.message};
    }

    return {success: true};
}
