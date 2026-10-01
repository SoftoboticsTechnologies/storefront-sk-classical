import {BRAND} from '@/site/brand';

/**
 * Store FAQ. Every answer restates the store's own policies (`content.ts`) or
 * brand contact details — keep it in sync when a policy changes. English only,
 * like the other static store pages.
 */
export interface FaqItem {
    id: string;
    question: string;
    answer: string;
    link?: {href: string; label: string};
}

export interface FaqGroup {
    title: string;
    items: FaqItem[];
}

const {contact} = BRAND;

export const FAQ_PAGE = {
    title: 'Frequently Asked Questions',
    description: 'Answers to common questions about shipping, orders, returns, payments and contacting Shri Kalaivani Costumes.',
};

export const FAQ_GROUPS: FaqGroup[] = [
    {
        title: 'Shipping & Delivery',
        items: [
            {
                id: 'ship-where',
                question: 'Where do you ship?',
                answer: 'We ship all over India and try to get the best rates for our customers.',
                link: {href: '/shipping-policy', label: 'Read our Shipping Policy'},
            },
            {
                id: 'ship-when',
                question: 'When will my order be shipped?',
                answer: 'Orders placed Monday through Saturday IST are processed on the same or following business day, and shipped within two business days of order placement if the product is in stock in our warehouse. If you want to know the delivery time for a product, please contact us before placing your order.',
            },
            {
                id: 'ship-cost',
                question: 'How much does shipping cost?',
                answer: 'Shipping charges vary with the order value and delivery location. The shipping charge for your order is calculated and shown at checkout before you pay.',
            },
        ],
    },
    {
        title: 'Orders & Cancellations',
        items: [
            {
                id: 'order-status',
                question: 'Where can I see my orders?',
                answer: 'Sign in to your account and open My Orders to see every order you have placed and its current status.',
                link: {href: '/account/orders', label: 'Go to My Orders'},
            },
            {
                id: 'order-cancel',
                question: 'Can I cancel my order?',
                answer: 'Yes, as long as it has not shipped yet. Once a product has shipped, it can no longer be cancelled through our website. Contact us as soon as possible if you need to cancel.',
            },
        ],
    },
    {
        title: 'Returns & Exchanges',
        items: [
            {
                id: 'return-eligible',
                question: 'Can I return or exchange a product?',
                answer: 'Returns and exchanges apply only to select products — the eligibility and conditions are listed on each product page. For most products the standard return window is 3 days. Return/exchange charges may apply on a case-to-case basis.',
                link: {href: '/return-policy', label: 'Read our Return Policy'},
            },
            {
                id: 'return-condition',
                question: 'What condition must a returned item be in?',
                answer: 'Items must be unused and unwashed for hygiene reasons, with the original packaging and tags in place. Items without the original tags will not be accepted, and customized products cannot be returned or exchanged.',
            },
            {
                id: 'return-pickup',
                question: 'How do I send a return back?',
                answer: 'Raise your request within the return period shown on the product page. If pick-up service is not available at your location, you will need to self-ship the product to our office address.',
            },
        ],
    },
    {
        title: 'Payments & Products',
        items: [
            {
                id: 'payment-methods',
                question: 'Which payment methods do you accept?',
                answer: 'We accept UPI (including PhonePe, Google Pay and Paytm), RuPay, Mastercard and Visa. The options available for your order are shown at checkout.',
            },
            {
                id: 'product-colour',
                question: 'Will the product look exactly like the photos?',
                answer: 'We photograph every product carefully, but screens vary and the colour shown on the website may not exactly match the actual product.',
            },
        ],
    },
    {
        title: 'Contact',
        items: [
            {
                id: 'contact',
                question: 'How can I reach you?',
                answer: `Call us 24x7 or message us on WhatsApp at ${contact.phone}, or email ${contact.email}. You can also visit us at ${contact.storeName}, ${contact.address}.`,
            },
        ],
    },
];
