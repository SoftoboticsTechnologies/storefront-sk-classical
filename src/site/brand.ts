import {STORE_WHATSAPP_HREF} from '@/config/contact';

/**
 * Static brand details for SK Classics (Shri Kalaivani), taken from the
 * brand's existing site. Presentation only — nothing commerce-related lives here.
 */
export const BRAND = {
    logo: {
        light: '/logo/sk-logo-black.webp',
        dark: '/logo/sk-logo-white.webp',
        width: 320,
        height: 282,
    },
    contact: {
        phone: '+91 88888 20222',
        phoneHref: 'tel:+918888820222',
        whatsappHref: STORE_WHATSAPP_HREF,
        email: 'sagar.annadate@gmail.com',
        // Shop name as shown on its address / Google listing; first line of the address.
        storeName: 'Shri Kalaivani Costumes',
        address: 'Shop 1, Opp SBI Bank, Next to Lilawati Soc, Datta Wadi, Kharegaon, Kalwa, Thane, Maharashtra 400605',
        // The shop's Google business listing (link from the owner); backs "Find Store"
        // in the top bar and the footer address link.
        mapsHref: 'https://g.co/kgs/atUZCw',
    },
    social: {
        facebook: 'https://www.facebook.com/shrikalaivani.dresses/',
        instagram: 'https://www.instagram.com/shrikalaivani/',
    },
} as const;

/**
 * Vendure collection that feeds the homepage "Amazing Deals" grid. Create a
 * collection with this slug in the Vendure admin and add the deal products to
 * it; the section stays hidden until it has products.
 */
export const DEALS_COLLECTION_SLUG = 'amazing-deals';

/**
 * Vendure collection behind the homepage "Bharatanatyam Accessories" section;
 * like the deals grid, it hides itself while the collection has no products.
 */
export const ACCESSORIES_COLLECTION_SLUG = 'bharatanatyam-accessories';

/**
 * Collection page slugs behind the Jewellery and Ghungroo homepage sections.
 * Both are grouping-only parents in Vendure (no slug of their own), so these
 * are their name-derived page slugs and the sections list every child
 * collection's products; a real Vendure slug takes over if one is added.
 */
export const JEWELLERY_COLLECTION_SLUG = 'jewellery';
export const GHUNGROO_COLLECTION_SLUG = 'ghungroo';

// Category imagery lives with the collections feature (it also themes collection
// page banners); re-exported here for existing site imports.
export {getCategoryImage} from '@/features/collections/utils';
