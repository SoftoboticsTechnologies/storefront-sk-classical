'use client';

import {useEffect, useState} from 'react';
import {getActiveChannel} from '@/platform/vendure/channel-client';
import {getActiveCurrencyCode} from '@/features/currency/currency-client';
import {CurrencyPicker} from './currency-picker';

// Client-side (static export has no per-request server to read the currency
// cookie from) — fetches the channel's available currencies and the user's
// current selection on mount so the picker reflects it.
export function CurrencyPickerWrapper() {
    const [state, setState] = useState<{availableCurrencyCodes: string[]; activeCurrencyCode: string} | null>(null);

    useEffect(() => {
        let cancelled = false;
        Promise.all([getActiveChannel(), getActiveCurrencyCode()]).then(([channel, activeCurrency]) => {
            if (cancelled) return;
            setState({
                availableCurrencyCodes: channel.availableCurrencyCodes as string[],
                activeCurrencyCode: activeCurrency,
            });
        });
        return () => {
            cancelled = true;
        };
    }, []);

    if (!state) {
        return null;
    }

    return (
        <CurrencyPicker
            availableCurrencyCodes={state.availableCurrencyCodes}
            activeCurrencyCode={state.activeCurrencyCode}
        />
    );
}
