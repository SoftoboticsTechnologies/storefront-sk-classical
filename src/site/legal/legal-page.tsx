import type {Metadata} from "next";
import {SITE_NAME, buildCanonicalUrl} from "@/config/metadata";
import {LEGAL_PAGES, type LegalSlug} from "@/site/legal/content";
import {LegalBlocks} from "@/components/legal-blocks";

/**
 * Builds the route exports for one static store page. App routes stay a
 * one-line re-export of the result.
 */
export function createLegalPage(slug: LegalSlug) {
    const content = LEGAL_PAGES[slug];

    function generateMetadata(): Metadata {
        return {
            title: content.title,
            description: content.description,
            alternates: {canonical: buildCanonicalUrl(`/${slug}`)},
            openGraph: {
                title: `${content.title} | ${SITE_NAME}`,
                description: content.description,
                type: "website",
            },
        };
    }

    function LegalPage() {
        return (
            <div className="mt-16">
                <div className="border-b border-gold/30 bg-muted/40">
                    <div className="container mx-auto px-4 md:px-6 lg:px-8 py-12 md:py-16 text-center">
                        <h1 className="font-serif text-3xl md:text-4xl font-semibold text-primary text-balance">
                            {content.title}
                        </h1>
                        <div className="mx-auto mt-4 h-px w-16 bg-gold" />
                    </div>
                </div>
                <article className="container mx-auto max-w-3xl px-4 py-12 md:py-16 space-y-5 text-base leading-relaxed text-muted-foreground">
                    <LegalBlocks blocks={content.blocks} />
                </article>
            </div>
        );
    }

    return {LegalPage, generateMetadata};
}
