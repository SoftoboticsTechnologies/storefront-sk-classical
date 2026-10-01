'use client';

import {Share2} from 'lucide-react';
import {useTranslations} from 'next-intl';
import {toast} from 'sonner';

/** Round share button beside the product title: native share sheet, else copies the link. */
export function ProductShareButton({name}: {name: string}) {
    const t = useTranslations('Product');

    const share = async () => {
        const url = window.location.href;
        if (navigator.share) {
            try {
                await navigator.share({title: name, url});
            } catch {
                // Dismissing the share sheet rejects; nothing to do.
            }
            return;
        }
        try {
            await navigator.clipboard.writeText(url);
            toast.success(t('linkCopied'));
        } catch {
            // Clipboard blocked (e.g. insecure context) — nothing useful to fall back to.
        }
    };

    return (
        <button
            type="button"
            onClick={share}
            aria-label={t('share')}
            title={t('share')}
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-primary ring-1 ring-gold/40 transition hover:scale-105 hover:ring-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        >
            <Share2 className="size-4" />
        </button>
    );
}
