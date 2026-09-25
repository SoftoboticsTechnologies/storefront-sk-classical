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
        whatsappHref: 'https://wa.me/918888820222',
        email: 'sagar.annadate@gmail.com',
        address: 'Shop No 1, opp SBI Bank, Next to Lilavati Soc., Maharashtra, Thane, 400605',
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

// Category imagery lives with the collections feature (it also themes collection
// page banners); re-exported here for existing site imports.
export {getCategoryImage} from '@/features/collections/utils';
