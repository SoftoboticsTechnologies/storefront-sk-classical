import {IndianRupee, Repeat2, Truck, type LucideIcon} from 'lucide-react';
import {useTranslations} from 'next-intl';
import {LEGAL_PAGES, type LegalSlug} from '@/config/legal-content';
import {LegalBlocks} from '@/components/legal-blocks';
import {PolicyDialog} from '@/features/products/components/policy-dialog';

interface Marker {
    icon: LucideIcon;
    /** Looping icon animation (see globals.css). */
    animation: string;
    label: string;
    /** Store policy shown in a pop-up when the marker is clicked. */
    policy?: LegalSlug;
}

/**
 * Trust card under Add to Cart: three animated icon markers over a dispatch
 * strip. Copy restates only the store's own policies (site/legal FAQ and
 * policy pages): UPI/card payments, returns on select items, shipping across
 * India, dispatch within 2 business days. Don't add claims (free delivery,
 * COD, fixed return windows) the store doesn't offer.
 */
export function ProductTrustMarkers() {
    const t = useTranslations('Product');

    const markers: Marker[] = [
        {icon: IndianRupee, animation: 'animate-pulse-scale', label: t('trust.payments')},
        {icon: Repeat2, animation: 'animate-spin-slow', label: t('trust.returns'), policy: 'return-policy'},
        {icon: Truck, animation: 'animate-slide-x', label: t('trust.shipping'), policy: 'shipping-policy'},
    ];

    return (
        <div className="overflow-hidden rounded-2xl border border-gold/30 bg-card">
            <div className="grid grid-cols-3 gap-3 p-4 sm:gap-4">
                {markers.map(({icon: Icon, animation, label, policy}) => {
                    const content = (
                        <>
                            <span className="flex size-10 items-center justify-center rounded-full bg-secondary ring-1 ring-gold/40">
                                <Icon className={`size-[1.15rem] text-primary ${animation}`} aria-hidden="true" />
                            </span>
                            <span className="text-[11px] sm:text-xs font-medium leading-snug text-foreground">{label}</span>
                        </>
                    );
                    const className = 'flex flex-col items-center gap-2.5 text-center';
                    return policy ? (
                        <PolicyDialog
                            key={label}
                            title={LEGAL_PAGES[policy].title}
                            href={`/${policy}`}
                            triggerClassName={`${className} group cursor-pointer rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold hover:[&>span:last-child]:text-primary`}
                            trigger={content}
                        >
                            <LegalBlocks blocks={LEGAL_PAGES[policy].blocks} />
                        </PolicyDialog>
                    ) : (
                        <div key={label} className={className}>
                            {content}
                        </div>
                    );
                })}
            </div>
            <p className="bg-secondary py-2.5 text-center text-xs font-medium text-muted-foreground">{t('trust.dispatch')}</p>
        </div>
    );
}
