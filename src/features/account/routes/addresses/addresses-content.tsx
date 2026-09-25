'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';
import { query } from '@/platform/vendure/client-api';
import { GetCustomerAddressesQuery } from '@/features/account/graphql';
import { GetAvailableCountriesQuery } from '@/features/checkout/graphql';
import { AddressesClient, type Country, type CustomerAddress } from './addresses-client';

export function AddressesContent() {
    const t = useTranslations('Account');
    const {locale} = useParams<{locale: string}>();
    const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
    const [countries, setCountries] = useState<Country[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const refresh = useCallback(async () => {
        const [addressesResult, countriesResult] = await Promise.all([
            query(GetCustomerAddressesQuery, undefined, {useAuthToken: true}),
            query(GetAvailableCountriesQuery, undefined, {languageCode: locale}),
        ]);

        setAddresses(addressesResult.data.activeCustomer?.addresses || []);
        setCountries(countriesResult.data.availableCountries || []);
    }, [locale]);

    useEffect(() => {
        let active = true;
        setIsLoading(true);
        refresh().finally(() => {
            if (active) setIsLoading(false);
        });
        return () => {
            active = false;
        };
    }, [refresh]);

    if (isLoading) {
        return (
            <div className="flex min-h-[40vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">{t('addresses')}</h1>
                <p className="text-muted-foreground mt-2">
                    {t('manageAddresses')}
                </p>
            </div>

            <AddressesClient addresses={addresses} countries={countries} onRefresh={refresh} />
        </div>
    );
}
