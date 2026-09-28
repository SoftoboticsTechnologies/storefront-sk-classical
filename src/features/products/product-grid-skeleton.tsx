export function ProductGridSkeleton() {
    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div className="h-5 w-32 bg-muted animate-pulse rounded" />
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="bg-card rounded-2xl border border-gold/25 p-1.5 sm:p-2">
                        <div className="aspect-4/5 rounded-t-[999px] rounded-b-xl bg-muted animate-pulse" />
                        <div className="flex flex-col items-center p-3 sm:p-4 space-y-2">
                            <div className="h-5 bg-muted animate-pulse rounded w-3/4" />
                            <div className="h-6 bg-muted animate-pulse rounded w-1/2" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
