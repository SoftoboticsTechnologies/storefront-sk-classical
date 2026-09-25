import Image from "next/image";
import {ArrowDown} from "lucide-react";
import type {ReactNode} from "react";
import {cn} from "@/lib/utils";

interface PageBannerProps {
    eyebrow: string;
    title: ReactNode;
    description?: string;
    image?: {src: string; position?: string};
    /** CTA label; the button jumps to `ctaHref` (an on-page anchor by default). */
    ctaLabel?: string;
    ctaHref?: string;
    className?: string;
}

/**
 * Listing-page hero: copy on a deep maroon panel, a themed photo fading in
 * from the right. On small screens the photo sits behind the copy under a
 * dark scrim so text stays legible.
 */
export function PageBanner({eyebrow, title, description, image, ctaLabel, ctaHref = '#products', className}: PageBannerProps) {
    return (
        <section className={cn("relative isolate overflow-hidden rounded-2xl bg-[#2a0a0e] text-white shadow-sm ring-1 ring-gold/20", className)}>
            {image && (
                <div className="absolute inset-0 -z-10 md:left-auto md:w-[58%]">
                    <Image
                        src={image.src}
                        alt=""
                        fill
                        priority
                        sizes="(max-width: 768px) 100vw, 58vw"
                        className="object-cover"
                        style={image.position ? {objectPosition: image.position} : undefined}
                    />
                    <div
                        className="absolute inset-0 bg-[#2a0a0e]/75 md:bg-transparent md:bg-linear-to-r md:from-[#2a0a0e] md:via-[#2a0a0e]/55 md:to-[#2a0a0e]/5"
                        aria-hidden="true"
                    />
                </div>
            )}

            <div className="relative max-w-xl px-6 py-8 sm:px-10 sm:py-10 md:px-12 md:py-14">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">{eyebrow}</p>
                <h1 className="mt-3 font-serif text-3xl sm:text-4xl md:text-5xl font-semibold leading-tight text-balance">
                    {title}
                </h1>
                {description && (
                    <p className="mt-4 text-sm sm:text-base leading-relaxed text-white/80 text-pretty">{description}</p>
                )}
                {ctaLabel && (
                    <a
                        href={ctaHref}
                        className="mt-6 inline-flex items-center gap-2 rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-gold-foreground shadow-sm transition hover:brightness-105"
                    >
                        {ctaLabel}
                        <ArrowDown className="size-4"/>
                    </a>
                )}
            </div>
        </section>
    );
}
