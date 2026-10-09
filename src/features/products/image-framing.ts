// Per-image framing for product-card photos.
//
// Product-card photos sit in a 4:5 temple arch (semicircular top). By default a
// square/landscape photo is contained in a fixed square box at the bottom of
// the arch (see product-card.tsx), which leaves tall or narrow products small
// and the top of the arch empty. Instead, each photo is measured — where the
// product actually is versus its own plain backdrop — and placed so the
// product fills the usable part of the arch without crossing the curved top
// or getting cropped. Photos that can't be measured, already fill their frame
// (lifestyle shots), or wouldn't grow meaningfully keep the default layout.
//
// Pure functions only (no DOM), so the maths can be checked outside a browser.
// Geometry is in arch units: width 1, height 1.25 (4:5), y pointing down.

export type Rgb = [number, number, number];

/** Product extent within the photo, as fractions (0–1) of its width/height. */
export interface ProductBounds {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
}

/** Photo placement within the arch, as CSS percentages of the arch box. */
export interface Framing {
    left: number;
    top: number;
    width: number;
    height: number;
}

/**
 * Products whose card images must never be auto-framed (approved as-is).
 * Matched by Vendure product ID or by the English slug, so the exception
 * survives a different ID on another Vendure environment.
 */
const FRAMING_EXCLUSIONS: ReadonlyArray<{id: string; slug: string}> = [
    {id: '1422', slug: 'gold-black-synthetic-fiber-striped-hair-bun-accessory-for-women'},
    {id: '1428', slug: 'black-pure-cotton-bharatnatyam-practice-saree-for-women'},
];

export function isFramingExcluded(productId: string | undefined, slug: string): boolean {
    return FRAMING_EXCLUSIONS.some((p) => p.id === productId || p.slug === slug);
}

/** Zoom levels a default-layout square photo can use (each has classes in product-card-gallery.tsx). */
export type SquareZoom = 1.15 | 1.22 | 1.25 | 1.3;

/** Zoom for default-layout square photos when a product has no override. */
export const DEFAULT_SQUARE_ZOOM: SquareZoom = 1.15;

/**
 * Per-product zoom for default-layout square photos, on request. Each value is
 * the largest that was checked against the real photos without cropping the
 * product (e.g. the 5-line anklet photo spans its full height, so 1.25 is its
 * limit). Auto-framed photos are unaffected. Matched like the exclusions.
 */
const SQUARE_ZOOM_OVERRIDES: ReadonlyArray<{id: string; slug: string; zoom: SquareZoom}> = [
    {id: '1426', slug: 'brass-3-line-ghungroo-ankle-bells-maroon-velvet-pad-adjustable-strap', zoom: 1.3},
    {id: '1427', slug: 'maroon-brass-velvet-5-line-ghungroo-anklet-with-adjustable-strap', zoom: 1.25},
    {id: '1425', slug: 'gold-alloy-red-green-stone-pearl-jhumka-earrings-for-women', zoom: 1.22},
    {id: '1424', slug: 'gold-white-alloy-pearl-lattice-jhumka-earrings-for-women', zoom: 1.22},
];

export function getSquareZoom(productId: string | undefined, slug: string): SquareZoom {
    return SQUARE_ZOOM_OVERRIDES.find((p) => p.id === productId || p.slug === slug)?.zoom ?? DEFAULT_SQUARE_ZOOM;
}

const ARCH_HEIGHT = 1.25;
/** Side margin kept clear around the product (matches the default 7% inset). */
const SIDE_MARGIN = 0.07;
/** Gap between the product and the arch's curved top. */
const CURVE_MARGIN = 0.03;
/** Gap below a product that doesn't run off the photo's bottom edge. */
const BOTTOM_MARGIN = 0.05;
/** Never enlarge a photo past this many arch widths (keeps it sharp). */
const MAX_PHOTO_WIDTH = 2.5;
/** Only reframe when the product grows at least this much vs. the default layout. */
const MIN_GAIN = 1.08;
/** A product within this distance of a photo edge is treated as touching it. */
const EDGE = 0.025;

/** Per-channel difference from the backdrop that counts as "product". */
const DIFF_THRESHOLD = 36;
/** Pixels a sample row/column needs above the threshold (ignores JPEG specks). */
const MIN_HITS = 2;

function lerp(a: Rgb, b: Rgb, t: number): Rgb {
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

/**
 * Bounding box of everything that differs from the photo's backdrop, which is
 * modelled as a vertical top → middle → bottom gradient (studio light). `data`
 * is RGBA for a `size`×`size` resample of the photo. Shadows count as product,
 * so the box errs on the side of never cropping.
 */
export function detectProductBounds(
    data: Uint8ClampedArray,
    size: number,
    backdrop: {top: Rgb; middle: Rgb; bottom: Rgb}
): ProductBounds | null {
    const rowHits = new Array<number>(size).fill(0);
    const colHits = new Array<number>(size).fill(0);

    for (let y = 0; y < size; y++) {
        const t = y / (size - 1);
        const bg = t < 0.5 ? lerp(backdrop.top, backdrop.middle, t * 2) : lerp(backdrop.middle, backdrop.bottom, t * 2 - 1);
        for (let x = 0; x < size; x++) {
            const o = (y * size + x) * 4;
            if (data[o + 3] < 128) continue;
            const diff = Math.max(
                Math.abs(data[o] - bg[0]),
                Math.abs(data[o + 1] - bg[1]),
                Math.abs(data[o + 2] - bg[2])
            );
            if (diff > DIFF_THRESHOLD) {
                rowHits[y]++;
                colHits[x]++;
            }
        }
    }

    const first = (hits: number[]) => hits.findIndex((n) => n >= MIN_HITS);
    const last = (hits: number[]) => hits.length - 1 - [...hits].reverse().findIndex((n) => n >= MIN_HITS);
    const x0 = first(colHits);
    const y0 = first(rowHits);
    if (x0 === -1 || y0 === -1) return null;

    return {x0: x0 / size, y0: y0 / size, x1: (last(colHits) + 1) / size, y1: (last(rowHits) + 1) / size};
}

/** Width/height below which a photo counts as portrait (keep in sync with product-card-gallery.tsx). */
export const PORTRAIT_RATIO = 0.9;

/**
 * Photo width (arch widths) in the default layout — portrait photos cover the
 * whole arch; others are contained in a 0.86 square box, scaled 1.15 — and
 * whether that layout cuts the product off at the arch's curved top.
 */
function defaultLayout(bounds: ProductBounds, aspect: number): {width: number; cropsProduct: boolean} {
    if (aspect < PORTRAIT_RATIO) {
        const width = Math.max(1, ARCH_HEIGHT * aspect);
        const height = width / aspect;
        const productTop = (ARCH_HEIGHT - height) / 2 + bounds.y0 * height;
        const halfWidth = ((bounds.x1 - bounds.x0) * width) / 2;
        return {width, cropsProduct: productTop < curveTop(halfWidth) - CURVE_MARGIN};
    }
    return {width: 0.86 * 1.15 * Math.min(1, aspect), cropsProduct: false};
}

/** Highest point (y) the product may reach for a given half-width, under the arch's curve. */
function curveTop(halfWidth: number) {
    const r = 0.5;
    const hw = Math.min(halfWidth, r);
    return r - Math.sqrt(r * r - hw * hw) + CURVE_MARGIN;
}

/**
 * Where to place a photo so its product fills the arch, or `null` to keep the
 * default layout (full-bleed photo, product cut off at a side, or no real gain).
 * `aspect` is the photo's width / height.
 */
export function computeFraming(bounds: ProductBounds, aspect: number): Framing | null {
    const bw = bounds.x1 - bounds.x0;
    const bh = bounds.y1 - bounds.y0;
    if (bw <= 0 || bh <= 0 || aspect <= 0) return null;

    // Lifestyle/full-bleed photo: nothing to trim.
    if (bw >= 0.94 && bh >= 0.94) return null;
    // Product runs off a side of the photo: moving that edge into the arch
    // would show it cut off mid-air.
    if (bounds.x0 <= EDGE || bounds.x1 >= 1 - EDGE) return null;

    // A product running off the photo's bottom stays flush with the arch bottom.
    const touchesBottom = bounds.y1 >= 1 - EDGE;
    const bottomLimit = touchesBottom ? ARCH_HEIGHT : ARCH_HEIGHT - BOTTOM_MARGIN;

    // Largest photo width (arch widths) where the product still fits.
    const fits = (s: number) => {
        const w = bw * s;
        const h = (bh * s) / aspect;
        return w <= 1 - 2 * SIDE_MARGIN && h <= bottomLimit - curveTop(w / 2);
    };
    let lo = 0;
    let hi = MAX_PHOTO_WIDTH;
    if (fits(hi)) {
        lo = hi;
    } else {
        for (let i = 0; i < 30; i++) {
            const mid = (lo + hi) / 2;
            if (fits(mid)) lo = mid;
            else hi = mid;
        }
    }
    const s = lo;
    // Reframe only for a real gain in size, or when the default layout crops the product.
    const fallback = defaultLayout(bounds, aspect);
    if (!fallback.cropsProduct && s < fallback.width * MIN_GAIN) return null;

    const photoHeight = s / aspect;
    const productHeight = bh * photoHeight;
    const top = curveTop((bw * s) / 2);
    // Centre horizontally; vertically, sit on the arch bottom when the product
    // runs off the photo there, otherwise centre in the space under the curve.
    const productTop = touchesBottom ? ARCH_HEIGHT - productHeight : top + (bottomLimit - top - productHeight) / 2;
    const photoLeft = 0.5 - ((bounds.x0 + bounds.x1) / 2) * s;
    const photoTop = productTop - bounds.y0 * photoHeight;

    return {
        left: photoLeft * 100,
        top: (photoTop / ARCH_HEIGHT) * 100,
        width: s * 100,
        height: (photoHeight / ARCH_HEIGHT) * 100,
    };
}
