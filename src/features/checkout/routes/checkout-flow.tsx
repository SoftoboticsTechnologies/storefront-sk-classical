'use client';

import { useEffect, useRef, useState } from 'react';
import { Check } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import ContactStep from './steps/contact-step';
import ShippingAddressStep from './steps/shipping-address-step';
import PaymentStep from './steps/payment-step';
import ReviewStep from './steps/review-step';
import OrderSummary from './order-summary';
import { useCheckout } from './checkout-provider';
import { setShippingMethod as setShippingMethodAction } from './actions';
import {useTranslations} from 'next-intl';

type CheckoutStep = 'contact' | 'shipping' | 'payment' | 'review';

export default function CheckoutFlow() {
  const t = useTranslations('Checkout');
  const { order, isGuest, shippingMethods, refreshOrder } = useCheckout();

  const getStepOrder = (): CheckoutStep[] => {
    if (isGuest) {
      return ['contact', 'shipping', 'payment', 'review'];
    }
    return ['shipping', 'payment', 'review'];
  };

  const stepOrder = getStepOrder();

  const getInitialState = () => {
    const completed = new Set<CheckoutStep>();
    let current: CheckoutStep = stepOrder[0];

    if (isGuest) {
      if (order.customer?.emailAddress) {
        completed.add('contact');
        current = 'shipping';
      }
    }

    if (order.shippingAddress?.streetLine1 && order.shippingAddress?.country) {
      if (!isGuest || completed.has('contact')) {
        completed.add('shipping');
        current = 'payment';
      }
    }

    return { completed, current };
  };

  const initialState = getInitialState();

  const shippingAppliedRef = useRef<string | null>(null);
  useEffect(() => {
    const hasAddress = Boolean(order.shippingAddress?.streetLine1 && order.shippingAddress?.country);
    const method = shippingMethods[0];
    if (!hasAddress || !method) return;

    const key = `${order.id}:${method.id}:${order.subTotalWithTax}`;
    if (shippingAppliedRef.current === key) return;
    shippingAppliedRef.current = key;

    (async () => {
      try {
        await setShippingMethodAction(method.id);
        await refreshOrder();
      } catch (err) {
        console.error('Error applying shipping method:', err);
      }
    })();
  }, [order.id, order.shippingAddress?.streetLine1, order.shippingAddress?.country, order.subTotalWithTax, shippingMethods, refreshOrder]);

  const [currentStep, setCurrentStep] = useState<CheckoutStep>(initialState.current);
  const [completedSteps, setCompletedSteps] = useState<Set<CheckoutStep>>(initialState.completed);

  const handleStepComplete = (step: CheckoutStep) => {
    setCompletedSteps(prev => new Set([...prev, step]));

    const currentIndex = stepOrder.indexOf(step);
    const nextStep = stepOrder[currentIndex + 1];

    if (nextStep && completedSteps.has(nextStep)) {
      setCurrentStep('review');
    } else if (currentIndex < stepOrder.length - 1) {
      setCurrentStep(nextStep);
    }
  };

  const canAccessStep = (step: CheckoutStep): boolean => {
    const stepIndex = stepOrder.indexOf(step);

    if (stepIndex === 0) return true;

    const previousStep = stepOrder[stepIndex - 1];
    return completedSteps.has(previousStep);
  };

  const getStepNumber = (step: CheckoutStep): number => {
    return stepOrder.indexOf(step) + 1;
  };

  const stepLabels: Record<CheckoutStep, string> = {
    contact: t('steps.contact'),
    shipping: t('steps.address'),
    payment: t('steps.payment'),
    review: t('steps.review'),
  };

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <div className="mb-8 hidden sm:block">
          <div className="flex items-center justify-between">
            {stepOrder.map((step, index) => (
              <div key={step} className="flex items-center flex-1 last:flex-0">
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className={`flex items-center justify-center w-9 h-9 rounded-full text-sm font-semibold transition-all duration-300 ${
                      completedSteps.has(step)
                        ? 'bg-primary text-primary-foreground'
                        : currentStep === step
                        ? 'bg-primary text-primary-foreground ring-4 ring-primary/20'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {completedSteps.has(step) ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      getStepNumber(step)
                    )}
                  </div>
                  <span className={`text-xs font-medium whitespace-nowrap ${
                    completedSteps.has(step) || currentStep === step
                      ? 'text-primary'
                      : 'text-muted-foreground'
                  }`}>
                    {stepLabels[step]}
                  </span>
                </div>
                {index < stepOrder.length - 1 && (
                  <div className="flex-1 mx-2 mb-5">
                    <div className={`h-0.5 w-full transition-colors duration-300 ${
                      completedSteps.has(step) ? 'bg-primary' : 'bg-muted'
                    }`} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <Accordion
          value={[currentStep]}
          onValueChange={(value) => {
            const step = value[0] as CheckoutStep | undefined;
            if (step && canAccessStep(step)) {
              setCurrentStep(step);
            }
          }}
          className="space-y-4"
        >
          {isGuest && (
            <AccordionItem value="contact" className="border rounded-lg px-6">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold ${
                    completedSteps.has('contact')
                      ? 'bg-green-500 text-white'
                      : currentStep === 'contact'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {completedSteps.has('contact') ? '✓' : getStepNumber('contact')}
                  </div>
                  <span className="text-lg font-semibold">{t('contactInformation')}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4">
                <ContactStep
                  onComplete={() => handleStepComplete('contact')}
                />
              </AccordionContent>
            </AccordionItem>
          )}

          <AccordionItem
            value="shipping"
            className="border rounded-lg px-6"
            disabled={!canAccessStep('shipping')}
          >
            <AccordionTrigger
              className="hover:no-underline"
              disabled={!canAccessStep('shipping')}
            >
              <div className="flex items-center gap-3">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold ${
                  completedSteps.has('shipping')
                    ? 'bg-green-500 text-white'
                    : currentStep === 'shipping'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {completedSteps.has('shipping') ? '✓' : getStepNumber('shipping')}
                </div>
                <span className="text-lg font-semibold">{t('shippingAddress')}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-4">
              <ShippingAddressStep
                onComplete={() => handleStepComplete('shipping')}
              />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem
            value="payment"
            className="border rounded-lg px-6"
            disabled={!canAccessStep('payment')}
          >
            <AccordionTrigger
              className="hover:no-underline"
              disabled={!canAccessStep('payment')}
            >
              <div className="flex items-center gap-3">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold ${
                  completedSteps.has('payment')
                    ? 'bg-green-500 text-white'
                    : currentStep === 'payment'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {completedSteps.has('payment') ? '✓' : getStepNumber('payment')}
                </div>
                <span className="text-lg font-semibold">{t('paymentMethod')}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-4">
              <PaymentStep
                onComplete={() => handleStepComplete('payment')}
              />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem
            value="review"
            className="border rounded-lg px-6"
            disabled={!canAccessStep('review')}
          >
            <AccordionTrigger
              className="hover:no-underline"
              disabled={!canAccessStep('review')}
            >
              <div className="flex items-center gap-3">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold ${
                  currentStep === 'review'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {getStepNumber('review')}
                </div>
                <span className="text-lg font-semibold">{t('reviewAndPlaceOrder')}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-4">
              <ReviewStep
                onEditStep={setCurrentStep}
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      <div className="lg:col-span-1">
        <OrderSummary />
      </div>
    </div>
  );
}
