import {mutate} from '@/platform/vendure/client-api';
import {UpdateCustomerPasswordMutation, UpdateCustomerMutation, RequestUpdateCustomerEmailAddressMutation} from '@/features/account/graphql';

type ActionState = { error?: string; success?: boolean } | undefined;

/**
 * Client-side counterpart to the old Server Action. `t` is the translated
 * `Errors` message lookup — threaded in from the calling component since a
 * plain async function cannot call the `useTranslations` hook itself.
 */
export async function updatePasswordAction(prevState: ActionState, formData: FormData, t: (key: string) => string) {
    const currentPassword = formData.get('currentPassword') as string;
    const newPassword = formData.get('newPassword') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (!currentPassword || !newPassword || !confirmPassword) {
        return {error: t('fieldsRequired')};
    }

    if (newPassword !== confirmPassword) {
        return {error: t('passwordsMismatch')};
    }

    if (currentPassword === newPassword) {
        return {error: t('newPasswordMustDiffer')};
    }

    try {
        const result = await mutate(UpdateCustomerPasswordMutation, {
            currentPassword,
            newPassword,
        }, {useAuthToken: true});

        const updateResult = result.data.updateCustomerPassword;

        if (updateResult.__typename !== 'Success') {
            return {error: updateResult.message};
        }

        return {success: true};
    } catch {
        return {error: t('unexpectedError')};
    }
}

export async function updateCustomerAction(prevState: ActionState, formData: FormData, t: (key: string) => string) {
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;

    if (!firstName || !lastName) {
        return {error: t('firstLastNameRequired')};
    }

    try {
        const result = await mutate(UpdateCustomerMutation, {
            input: {
                firstName,
                lastName,
            },
        }, {useAuthToken: true});

        const updateResult = result.data.updateCustomer;

        if (!updateResult || !updateResult.id) {
            return {error: t('failedUpdateCustomer')};
        }

        return {success: true};
    } catch {
        return {error: t('unexpectedError')};
    }
}

export async function requestEmailUpdateAction(prevState: ActionState, formData: FormData, t: (key: string) => string) {
    const password = formData.get('password') as string;
    const newEmailAddress = formData.get('newEmailAddress') as string;

    if (!password || !newEmailAddress) {
        return {error: t('passwordEmailRequired')};
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmailAddress)) {
        return {error: t('invalidEmail')};
    }

    try {
        const result = await mutate(RequestUpdateCustomerEmailAddressMutation, {
            password,
            newEmailAddress,
        }, {useAuthToken: true});

        const updateResult = result.data.requestUpdateCustomerEmailAddress;

        if (updateResult.__typename !== 'Success') {
            return {error: updateResult.message};
        }

        return {success: true};
    } catch {
        return {error: t('unexpectedError')};
    }
}
