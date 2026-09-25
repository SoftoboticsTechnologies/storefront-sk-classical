'use client';

import { createContext, useCallback, useContext, ReactNode, useState } from 'react';
import { useParams } from 'next/navigation';
import { CheckoutOrder } from './types';
import { GetActiveOrderForCheckoutQuery } from '@/features/checkout/graphql';
import { GetCustomerAddressesQuery } from '@/features/account/graphql';
import { query } from '@/platform/vendure/client-api';
import { getActiveCurrencyCode } from '@/features/currency/currency-client';
import { dispatchCartChanged } from '@/features/cart/cart-events';

interface CustomerAddress {
  id: string;
  fullName?: string | null;
  company?: string | null;
  streetLine1: string;
  streetLine2?: string | null;
  city?: string | null;
  province?: string | null;
  postalCode?: string | null;
  country: { id: string; code: string; name: string };
  phoneNumber?: string | null;
  defaultShippingAddress?: boolean | null;
  defaultBillingAddress?: boolean | null;
}

interface Country {
  id: string;
  code: string;
  name: string;
}

interface ShippingMethod {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  priceWithTax: number;
}

interface PaymentMethod {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  isEligible: boolean;
  eligibilityMessage?: string | null;
}

interface CheckoutContextType {
  order: CheckoutOrder;
  addresses: CustomerAddress[];
  countries: Country[];
  shippingMethods: ShippingMethod[];
  paymentMethods: PaymentMethod[];
  selectedPaymentMethodCode: string | null;
  setSelectedPaymentMethodCode: (code: string | null) => void;
  isGuest: boolean;
  /** Re-fetch GetActiveOrderForCheckout and update the order in context (ActiveOrder stays the sole source of truth — no local optimistic cart state beyond this). */
  refreshOrder: () => Promise<void>;
  /** Re-fetch the signed-in customer's saved addresses (e.g. after creating a new one). */
  refreshAddresses: () => Promise<void>;
}

const CheckoutContext = createContext<CheckoutContextType | null>(null);

interface CheckoutProviderProps {
  children: ReactNode;
  order: CheckoutOrder;
  addresses: CustomerAddress[];
  countries: Country[];
  shippingMethods: ShippingMethod[];
  paymentMethods: PaymentMethod[];
  isGuest: boolean;
}

export function CheckoutProvider({
  children,
  order: initialOrder,
  addresses: initialAddresses,
  countries,
  shippingMethods,
  paymentMethods,
  isGuest,
}: CheckoutProviderProps) {
  const {locale} = useParams<{locale: string}>();
  const [order, setOrder] = useState<CheckoutOrder>(initialOrder);
  const [addresses, setAddresses] = useState<CustomerAddress[]>(initialAddresses);
  const [selectedPaymentMethodCode, setSelectedPaymentMethodCode] = useState<string | null>(
    paymentMethods.length === 1 ? paymentMethods[0].code : null
  );

  const refreshOrder = useCallback(async () => {
    const currencyCode = await getActiveCurrencyCode();
    const result = await query(GetActiveOrderForCheckoutQuery, {}, {
      useAuthToken: true,
      languageCode: locale,
      currencyCode,
    });
    if (result.data.activeOrder) {
      setOrder(result.data.activeOrder);
    }
    dispatchCartChanged();
  }, [locale]);

  const refreshAddresses = useCallback(async () => {
    if (isGuest) return;
    const result = await query(GetCustomerAddressesQuery, {}, {useAuthToken: true});
    setAddresses(result.data.activeCustomer?.addresses || []);
  }, [isGuest]);

  return (
    <CheckoutContext.Provider
      value={{
        order,
        addresses,
        countries,
        shippingMethods,
        paymentMethods,
        selectedPaymentMethodCode,
        setSelectedPaymentMethodCode,
        isGuest,
        refreshOrder,
        refreshAddresses,
      }}
    >
      {children}
    </CheckoutContext.Provider>
  );
}

export function useCheckout() {
  const context = useContext(CheckoutContext);
  if (!context) {
    throw new Error('useCheckout must be used within CheckoutProvider');
  }
  return context;
}
