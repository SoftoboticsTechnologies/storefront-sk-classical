import {Fragment, type ReactNode} from "react";
import type {LegalBlock} from "@/config/legal-content";

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

/** Body of a static store page (`config/legal-content.ts`), shared by the pages and policy pop-ups. */
export function LegalBlocks({blocks}: {blocks: LegalBlock[]}) {
    return <>{blocks.map((block, i) => <Block key={i} block={block} />)}</>;
}
