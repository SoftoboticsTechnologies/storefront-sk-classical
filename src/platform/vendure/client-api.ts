'use client';

import type {TadaDocumentNode} from 'gql.tada';
import {print} from 'graphql';
import {getAuthToken} from './auth-token';

const VENDURE_API_URL = process.env.NEXT_PUBLIC_VENDURE_SHOP_API_URL;
const VENDURE_CHANNEL_TOKEN = process.env.NEXT_PUBLIC_VENDURE_CHANNEL_TOKEN || '__default_channel__';
const VENDURE_AUTH_TOKEN_HEADER = 'vendure-auth-token';
const VENDURE_CHANNEL_TOKEN_HEADER = 'vendure-token';

interface VendureRequestOptions {
    token?: string;
    useAuthToken?: boolean;
    channelToken?: string;
    languageCode?: string;
    currencyCode?: string;
}

interface VendureResponse<T> {
    data?: T;
    errors?: Array<{ message: string; [key: string]: unknown }>;
}

function extractAuthToken(headers: Headers): string | null {
    return headers.get(VENDURE_AUTH_TOKEN_HEADER);
}

/**
 * Browser-side counterpart to platform/vendure/api.ts#query. Calls the Vendure
 * Shop API directly from the client (static-export deployments have no server
 * to proxy through). Mirrors the same {data, token?} shape so call sites port
 * with minimal changes. Requires Vendure's Shop API to allow CORS from this
 * origin and to expose the vendure-auth-token response header.
 */
export async function query<TResult, TVariables>(
    document: TadaDocumentNode<TResult, TVariables>,
    ...[variables, options]: TVariables extends Record<string, never>
        ? [variables?: TVariables, options?: VendureRequestOptions]
        : [variables: TVariables, options?: VendureRequestOptions]
): Promise<{ data: TResult; token?: string }> {
    if (!VENDURE_API_URL) {
        throw new Error('NEXT_PUBLIC_VENDURE_SHOP_API_URL environment variable is not set');
    }

    const {token, useAuthToken, channelToken, languageCode, currencyCode} = options || {};

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    let authToken = token;
    if (useAuthToken && !authToken) {
        authToken = await getAuthToken();
    }

    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }

    headers[VENDURE_CHANNEL_TOKEN_HEADER] = channelToken || VENDURE_CHANNEL_TOKEN;

    const url = new URL(VENDURE_API_URL);
    if (languageCode) {
        url.searchParams.set('languageCode', languageCode);
    }
    if (currencyCode) {
        url.searchParams.set('currencyCode', currencyCode);
    }

    const response = await fetch(url.toString(), {
        method: 'POST',
        headers,
        credentials: 'omit',
        body: JSON.stringify({
            query: print(document),
            variables: variables || {},
        }),
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: VendureResponse<TResult> = await response.json();

    if (result.errors) {
        throw new Error(result.errors.map(e => e.message).join(', '));
    }

    if (!result.data) {
        throw new Error('No data returned from Vendure API');
    }

    const newToken = extractAuthToken(response.headers);

    return {
        data: result.data,
        ...(newToken && {token: newToken}),
    };
}

/**
 * Execute a GraphQL mutation against the Vendure API (client-side).
 */
export async function mutate<TResult, TVariables>(
    document: TadaDocumentNode<TResult, TVariables>,
    ...[variables, options]: TVariables extends Record<string, never>
        ? [variables?: TVariables, options?: VendureRequestOptions]
        : [variables: TVariables, options?: VendureRequestOptions]
): Promise<{ data: TResult; token?: string }> {
    // @ts-expect-error - Complex conditional type inference, runtime behavior is correct
    return query(document, variables, options);
}
