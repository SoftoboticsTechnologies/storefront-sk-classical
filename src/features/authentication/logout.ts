import {mutate} from '@/platform/vendure/client-api';
import {removeAuthToken} from '@/platform/vendure/auth-token';
import {LogoutMutation} from './graphql';

/**
 * Client-side counterpart to the old Server Action. Callers must navigate
 * (e.g. `router.push('/')`) after this resolves — a plain async function
 * cannot call the `useRouter` hook itself.
 */
export async function logoutAction() {
    await mutate(LogoutMutation);
    await removeAuthToken();
}
