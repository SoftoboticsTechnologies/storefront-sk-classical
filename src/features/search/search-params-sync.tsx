'use client';

import {Suspense, useEffect} from 'react';
import {useSearchParams} from 'next/navigation';

interface SearchParamsSyncProps {
    onChange: (searchParamsString: string) => void;
}

function SearchParamsSyncInner({onChange}: SearchParamsSyncProps) {
    const searchParams = useSearchParams();
    const searchParamsString = searchParams.toString();

    useEffect(() => {
        onChange(searchParamsString);
    }, [searchParamsString, onChange]);

    return null;
}

/**
 * Reads the current URL search params and reports them via `onChange`,
 * isolated in its own (invisible — it renders nothing either way) Suspense
 * boundary.
 *
 * next/navigation's useSearchParams() de-opts its nearest ancestor Suspense
 * boundary to client-side-only rendering under static export (no
 * per-request server to resolve dynamic search params at build time) — see
 * docs/decisions.md. Calling it directly from a visible component (a filter
 * sidebar, product grid, sort dropdown, pagination) would blank that whole
 * boundary out of the statically-exported HTML. Isolating the call here
 * confines that cost to a component with no visible output; everything else
 * reads the reported string from state instead of calling the hook itself.
 */
export function SearchParamsSync(props: SearchParamsSyncProps) {
    return (
        <Suspense fallback={null}>
            <SearchParamsSyncInner {...props} />
        </Suspense>
    );
}
