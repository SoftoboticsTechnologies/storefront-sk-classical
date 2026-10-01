export interface ProductAttribute {
    label: string;
    value: string;
}

interface FacetValueLike {
    name: string;
    facet: {id: string; name: string};
}

// Facets that exist only to drive listing filters, not to describe the product.
const FILTER_ONLY_FACET = /price/i;

/**
 * "PRODUCT TYPE " → "Product Type", "3 line GHUNGROO" → "3 Line Ghungroo".
 * Only ALL-CAPS words are lowercased; mixed-case ones ("Colour/Varient") keep
 * their casing and just get a capital first letter.
 */
function toDisplayCase(text: string): string {
    return text
        .trim()
        .replace(/\s+/g, ' ')
        .split(' ')
        .map((word) => {
            const rest = word === word.toUpperCase() ? word.slice(1).toLowerCase() : word.slice(1);
            return word.charAt(0).toUpperCase() + rest;
        })
        .join(' ');
}

/**
 * "Product Information" rows from the product's real Vendure facet values,
 * one row per facet (multiple values joined), in the order Vendure returns
 * them. Filter-only facets like price ranges are left out.
 */
export function getProductAttributes(facetValues: FacetValueLike[]): ProductAttribute[] {
    const byFacet = new Map<string, ProductAttribute>();
    for (const {name, facet} of facetValues) {
        if (FILTER_ONLY_FACET.test(facet.name)) continue;
        const value = toDisplayCase(name);
        const existing = byFacet.get(facet.id);
        if (existing) {
            existing.value = `${existing.value}, ${value}`;
        } else {
            byFacet.set(facet.id, {label: toDisplayCase(facet.name), value});
        }
    }
    return [...byFacet.values()];
}
