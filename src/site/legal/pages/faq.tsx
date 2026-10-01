import type {Metadata} from 'next';
import {Mail, Phone} from 'lucide-react';
import {Accordion, AccordionContent, AccordionItem, AccordionTrigger} from '@/components/ui/accordion';
import {SITE_NAME, buildCanonicalUrl} from '@/config/metadata';
import {BRAND} from '@/site/brand';
import {FAQ_GROUPS, FAQ_PAGE} from '@/site/legal/faq';
import {NavigationLink} from '@/site/navigation/navigation-link';
import {WhatsAppIcon} from '@/components/icons/whatsapp-icon';

export function generateMetadata(): Metadata {
    return {
        title: FAQ_PAGE.title,
        description: FAQ_PAGE.description,
        alternates: {canonical: buildCanonicalUrl('/faq')},
        openGraph: {
            title: `${FAQ_PAGE.title} | ${SITE_NAME}`,
            description: FAQ_PAGE.description,
            type: 'website',
        },
    };
}

const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_GROUPS.flatMap((group) => group.items).map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {'@type': 'Answer', text: item.answer},
    })),
};

export default function FaqPage() {
    const {contact} = BRAND;

    return (
        <div className="mt-16">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{__html: JSON.stringify(faqJsonLd).replace(/</g, '\\u003c')}}
            />
            <div className="border-b border-gold/30 bg-muted/40">
                <div className="container mx-auto px-4 md:px-6 lg:px-8 py-12 md:py-16 text-center">
                    <h1 className="font-serif text-3xl md:text-4xl font-semibold text-primary text-balance">
                        {FAQ_PAGE.title}
                    </h1>
                    <div className="mx-auto mt-4 h-px w-16 bg-gold" />
                </div>
            </div>

            <div className="container mx-auto max-w-3xl px-4 py-12 md:py-16 space-y-10">
                {FAQ_GROUPS.map((group) => (
                    <section key={group.title}>
                        <h2 className="font-serif text-xl md:text-2xl font-semibold text-primary mb-2">{group.title}</h2>
                        <Accordion className="border-y border-gold/20">
                            {group.items.map((item) => (
                                <AccordionItem key={item.id} value={item.id} className="border-gold/20">
                                    <AccordionTrigger className="text-base">{item.question}</AccordionTrigger>
                                    <AccordionContent className="text-base leading-relaxed text-muted-foreground">
                                        <p>{item.answer}</p>
                                        {item.link && (
                                            <p>
                                                <NavigationLink href={item.link.href} className="text-primary">
                                                    {item.link.label}
                                                </NavigationLink>
                                            </p>
                                        )}
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </section>
                ))}

                <section className="rounded-lg border border-gold/30 bg-muted/40 p-6 md:p-8 text-center">
                    <h2 className="font-serif text-xl font-semibold text-primary">Still have a question?</h2>
                    <p className="mt-2 text-muted-foreground">Our team is happy to help — reach us any time.</p>
                    <div className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm">
                        <a href={contact.phoneHref} className="inline-flex items-center gap-2 hover:text-primary transition-colors">
                            <Phone className="size-4 text-gold" />
                            {contact.phone}
                        </a>
                        <a
                            href={contact.whatsappHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 hover:text-primary transition-colors"
                        >
                            <WhatsAppIcon className="size-4 text-[#25D366]" />
                            WhatsApp
                        </a>
                        <a href={`mailto:${contact.email}`} className="inline-flex items-center gap-2 break-all hover:text-primary transition-colors">
                            <Mail className="size-4 text-gold" />
                            {contact.email}
                        </a>
                    </div>
                </section>
            </div>
        </div>
    );
}
