import Image from "next/image";
import {Diamond, Gem, HeartHandshake, Mail, Phone, Sparkles} from "lucide-react";
import {createLegalPage} from "@/site/legal/legal-page";
import {LEGAL_PAGES} from "@/site/legal/content";
import {BRAND} from "@/site/brand";
import {BrandLogo} from "@/site/brand-logo";
import {StoreLocatorIcon} from "@/site/navigation/find-store-link";
import {WhatsAppIcon} from "@/components/icons/whatsapp-icon";

// Metadata stays shared with the other static store pages; only the layout is bespoke.
const {generateMetadata} = createLegalPage('about-us');
export {generateMetadata};

const content = LEGAL_PAGES['about-us'];
// Copy comes from `config/legal-content.ts` (the brand's own About text), in order:
// intro, who we serve, our commitment, closing tagline.
const [intro, audience, commitment, closing] = content.blocks.map((block) =>
    block.type === 'paragraph' ? block.text.replace(/\*\*/g, '') : ''
);

// Restates the three commitments named in the brand's own About copy.
const VALUES = [
    {icon: Sparkles, title: 'Authentic Designs', text: 'Thoughtfully curated pieces rooted in India’s rich cultural heritage.'},
    {icon: Gem, title: 'Superior Quality', text: 'Craftsmanship for everyday wear, festive celebrations and sacred rituals.'},
    {icon: HeartHandshake, title: 'Exceptional Service', text: 'Service that honours the traditions we hold dear, with every purchase.'},
];

function Eyebrow({children}: {children: string}) {
    return <p className="text-xs font-medium uppercase tracking-[0.25em] text-primary/80 dark:text-gold">{children}</p>;
}

export default function AboutUsPage() {
    const {contact} = BRAND;

    return (
        <div className="mt-16">
            {/* Hero: logo on maroon with a faint kolam ground. */}
            <section className="relative overflow-hidden bg-primary text-primary-foreground">
                <div className="kolam-pattern absolute inset-0 opacity-25" aria-hidden="true" />
                <div className="relative container mx-auto px-4 md:px-6 lg:px-8 py-14 md:py-20 flex flex-col items-center text-center">
                    <BrandLogo onPrimary priority className="h-28 md:h-36" />
                    <p className="mt-6 text-xs uppercase tracking-[0.3em] text-gold">Our Story</p>
                    <h1 className="mt-3 font-serif text-3xl md:text-5xl font-semibold text-balance">{content.title}</h1>
                    <div className="ornament-divider mt-5 w-full max-w-48" aria-hidden="true">
                        <Diamond className="size-2.5 fill-current" />
                    </div>
                    <p className="mt-5 max-w-2xl text-sm md:text-base leading-relaxed text-primary-foreground/80 text-balance">
                        {content.description}
                    </p>
                </div>
            </section>
            <div className="temple-border" aria-hidden="true" />

            {/* Story */}
            <section className="py-16 md:py-24">
                <div className="container mx-auto px-4 md:px-6 lg:px-8 grid md:grid-cols-2 gap-12 md:gap-16 items-center">
                    <div className="relative mx-auto w-full max-w-md">
                        <div className="absolute inset-0 rounded-t-[999px] rounded-b-xl border border-gold/60 translate-x-3 translate-y-3 md:translate-x-4 md:translate-y-4" aria-hidden="true" />
                        <div className="relative aspect-4/5 overflow-hidden rounded-t-[999px] rounded-b-xl bg-muted ring-1 ring-gold/40">
                            <Image
                                src="/images/categories/costumes.webp"
                                alt="Shri Kalaivani Costumes collection"
                                fill
                                className="object-cover"
                                style={{objectPosition: 'center 25%'}}
                                sizes="(max-width: 768px) 100vw, 448px"
                            />
                        </div>
                        <div className="absolute -bottom-6 -left-4 md:-left-8 size-28 md:size-36 overflow-hidden rounded-full border-4 border-background bg-muted shadow-xl ring-1 ring-gold/50">
                            <Image src="/images/categories/jewellery.webp" alt="" fill className="object-cover" sizes="144px" />
                        </div>
                    </div>
                    <div className="space-y-5">
                        <Eyebrow>Who we are</Eyebrow>
                        <h2 className="text-3xl md:text-4xl font-semibold leading-tight text-balance">
                            Celebrating India&apos;s <em className="text-gold">cultural heritage</em>
                        </h2>
                        <p className="text-muted-foreground leading-relaxed text-lg">{intro}</p>
                        <p className="text-muted-foreground leading-relaxed">{audience}</p>
                    </div>
                </div>
            </section>

            {/* Values */}
            <section className="relative overflow-hidden bg-muted/40 border-y border-gold/25 py-16 md:py-20">
                <div className="kolam-pattern absolute inset-0 opacity-30" aria-hidden="true" />
                <div className="relative container mx-auto px-4 md:px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl text-center space-y-4">
                        <Eyebrow>Our Promise</Eyebrow>
                        <h2 className="text-3xl md:text-4xl font-semibold">More than just products</h2>
                        <p className="text-muted-foreground leading-relaxed">{commitment}</p>
                    </div>
                    <div className="mt-12 grid gap-6 sm:grid-cols-3">
                        {VALUES.map(({icon: Icon, title, text}) => (
                            <div key={title} className="rounded-2xl border border-gold/30 bg-card p-6 text-center shadow-sm transition hover:-translate-y-1 hover:border-gold/60 hover:shadow-md">
                                <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-secondary ring-1 ring-gold/40">
                                    <Icon className="size-6 text-primary" strokeWidth={1.75} />
                                </span>
                                <h3 className="mt-4 font-serif text-xl font-semibold text-primary">{title}</h3>
                                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Visit the store */}
            <section className="py-16 md:py-24">
                <div className="container mx-auto px-4 md:px-6 lg:px-8">
                    <div className="mx-auto max-w-4xl overflow-hidden rounded-3xl border border-gold/40 bg-card shadow-sm md:grid md:grid-cols-[2fr_3fr]">
                        <div className="relative flex flex-col items-center justify-center gap-4 bg-primary p-8 md:p-10 text-center text-primary-foreground">
                            <div className="kolam-pattern absolute inset-0 opacity-20" aria-hidden="true" />
                            <span className="relative flex size-24 items-center justify-center rounded-full bg-primary-foreground/10 ring-1 ring-gold/60 text-gold">
                                <span className="scale-[1.75]"><StoreLocatorIcon pinFillClassName="fill-primary" /></span>
                            </span>
                            <h2 className="relative font-serif text-2xl md:text-3xl font-semibold">Visit Our Store</h2>
                            <p className="relative text-sm text-primary-foreground/75">Come see the collection in person.</p>
                        </div>
                        <div className="p-8 md:p-10 space-y-5">
                            <address className="not-italic">
                                <p className="font-serif text-xl font-semibold text-primary">{contact.storeName}</p>
                                <p className="mt-1 text-muted-foreground leading-relaxed">{contact.address}</p>
                            </address>
                            <ul className="space-y-2.5 text-sm">
                                <li>
                                    <a href={contact.phoneHref} className="inline-flex items-center gap-2.5 hover:text-primary">
                                        <Phone className="size-4 text-gold" />{contact.phone}
                                    </a>
                                </li>
                                <li>
                                    <a href={contact.whatsappHref} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2.5 hover:text-primary">
                                        <WhatsAppIcon className="size-4 text-[#25D366]" />{contact.phone}
                                    </a>
                                </li>
                                <li>
                                    <a href={`mailto:${contact.email}`} className="inline-flex items-center gap-2.5 break-all hover:text-primary">
                                        <Mail className="size-4 text-gold" />{contact.email}
                                    </a>
                                </li>
                            </ul>
                            <a
                                href={contact.mapsHref}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 rounded-full bg-primary py-2.5 pl-4 pr-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                            >
                                <StoreLocatorIcon pinFillClassName="fill-primary" />
                                Find Store
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* Closing tagline */}
            <div className="temple-border temple-border-flip" aria-hidden="true" />
            <section className="bg-primary text-primary-foreground py-12 md:py-14">
                <p className="container mx-auto px-4 text-center font-serif text-2xl md:text-3xl italic text-balance">
                    {closing}
                </p>
            </section>
        </div>
    );
}
