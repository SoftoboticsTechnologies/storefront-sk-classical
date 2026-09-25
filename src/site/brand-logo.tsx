import Image from "next/image";
import {cn} from "@/lib/utils";
import {SITE_NAME} from "@/config/metadata";
import {BRAND} from "@/site/brand";

/**
 * SK monogram, swapping the black/white artwork with the colour theme.
 * `onPrimary` is for `bg-primary` surfaces (maroon in light mode, gold in dark),
 * which need the opposite artwork.
 */
export function BrandLogo({className, priority, onPrimary}: {className?: string; priority?: boolean; onPrimary?: boolean}) {
    const {width, height} = BRAND.logo;
    const light = onPrimary ? BRAND.logo.dark : BRAND.logo.light;
    const dark = onPrimary ? BRAND.logo.light : BRAND.logo.dark;

    return (
        <>
            <Image src={light} alt={SITE_NAME} width={width} height={height} priority={priority} className={cn("w-auto dark:hidden", className)} />
            <Image src={dark} alt={SITE_NAME} width={width} height={height} priority={priority} className={cn("w-auto hidden dark:block", className)} />
        </>
    );
}
