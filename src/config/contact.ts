/**
 * Store WhatsApp contact, shared by the site chrome (`site/brand.ts`) and
 * features that link to a chat (product page "Start Chat"). Features can't
 * import `site/`, so the number lives here.
 */
export const STORE_WHATSAPP_NUMBER = '918888820222';

export const STORE_WHATSAPP_HREF = `https://wa.me/${STORE_WHATSAPP_NUMBER}`;

/** A chat link with a prefilled message. */
export function buildWhatsAppHref(message: string): string {
    return `${STORE_WHATSAPP_HREF}?text=${encodeURIComponent(message)}`;
}
