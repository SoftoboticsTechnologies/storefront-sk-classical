import {Diamond} from "lucide-react";
import {cn} from "@/lib/utils";

/** Centred eyebrow + serif title + gold ornament rule used by homepage sections. */
export function SectionHeading({eyebrow, title, className}: {eyebrow: string; title: string; className?: string}) {
    return (
        <div className={cn("text-center mb-10 md:mb-14", className)}>
            <p className="text-xs font-medium uppercase tracking-[0.25em] text-primary/80 dark:text-gold mb-3">
                {eyebrow}
            </p>
            <h2 className="text-3xl md:text-5xl font-semibold text-balance">{title}</h2>
            <div className="ornament-divider mx-auto mt-5 max-w-xs" aria-hidden="true">
                <Diamond className="size-3 fill-current" />
            </div>
        </div>
    );
}
