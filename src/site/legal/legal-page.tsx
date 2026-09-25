import type {Metadata} from "next";
import {Fragment, type ReactNode} from "react";
import {SITE_NAME, buildCanonicalUrl} from "@/config/metadata";
import {LEGAL_PAGES, type LegalBlock, type LegalSlug} from "@/site/legal/content";

/** Renders `**bold**` segments; everything else stays plain text. */
function renderInline(text: string): ReactNode {
    return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
        part.startsWith('**') && part.endsWith('**')
            ? <strong key={i} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>
            : <Fragment key={i}>{part}</Fragment>
    );
}

function Block({block}: {block: LegalBlock}) {
    switch (block.type) {
        case 'heading':
            return <h2 className="font-serif text-xl md:text-2xl font-semibold text-primary pt-4">{block.text}</h2>;
        case 'paragraph':
            return <p>{renderInline(block.text)}</p>;
        case 'list': {
            const List = block.ordered ? 'ol' : 'ul';
            return (
                <List className={`${block.ordered ? 'list-decimal' : 'list-disc'} space-y-2 pl-6 marker:text-gold`}>
                    {block.items.map((item) => <li key={item}>{renderInline(item)}</li>)}
                </List>
            );
        }
    }
}

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
                    <div className="container mx-auto px-4 py-12 md:py-16 text-center">
                        <h1 className="font-serif text-3xl md:text-4xl font-semibold text-primary text-balance">
                            {content.title}
                        </h1>
                        <div className="mx-auto mt-4 h-px w-16 bg-gold" />
                    </div>
                </div>
                <article className="container mx-auto max-w-3xl px-4 py-12 md:py-16 space-y-5 text-base leading-relaxed text-muted-foreground">
                    {content.blocks.map((block, i) => <Block key={i} block={block} />)}
                </article>
            </div>
        );
    }

    return {LegalPage, generateMetadata};
}
