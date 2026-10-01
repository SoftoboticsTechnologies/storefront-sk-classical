export default function WishlistLoading() {
    return (
        <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 mt-16">
            <div className="h-9 w-48 bg-muted animate-pulse rounded mb-2" />
            <div className="h-4 w-40 bg-muted animate-pulse rounded mb-8" />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
                {Array.from({length: 4}).map((_, i) => (
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
