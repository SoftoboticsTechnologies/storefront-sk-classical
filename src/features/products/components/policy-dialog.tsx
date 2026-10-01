'use client';

import type {ReactNode} from 'react';
import {ArrowRight} from 'lucide-react';
import {useTranslations} from 'next-intl';
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger} from '@/components/ui/dialog';
import {Link} from '@/platform/i18n/navigation';

interface PolicyDialogProps {
    title: string;
    /** Full policy page, linked from the pop-up footer. */
    href: string;
    triggerClassName: string;
    trigger: ReactNode;
    /** Policy body, rendered on the server and passed through. */
    children: ReactNode;
}

/** Opens a store policy in a pop-up instead of navigating away from the product. */
export function PolicyDialog({title, href, triggerClassName, trigger, children}: PolicyDialogProps) {
    const t = useTranslations('Product');

    return (
        <Dialog>
            <DialogTrigger render={<button type="button" className={triggerClassName} />}>
                {trigger}
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl max-h-[85vh] grid-rows-[auto_minmax(0,1fr)_auto] gap-0 p-0">
                <DialogHeader className="border-b border-gold/30 px-6 py-5 pr-12">
                    <DialogTitle className="font-serif text-2xl font-semibold text-primary">{title}</DialogTitle>
                </DialogHeader>
                <div className="overflow-y-auto px-6 py-5 space-y-4 text-sm leading-relaxed text-muted-foreground">
                    {children}
                </div>
                <div className="border-t border-gold/30 px-6 py-4">
                    <Link
                        href={href}
                        prefetch={false}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                    >
                        {t('trust.viewFullPolicy')}
                        <ArrowRight className="size-4" />
                    </Link>
                </div>
            </DialogContent>
        </Dialog>
    );
}
