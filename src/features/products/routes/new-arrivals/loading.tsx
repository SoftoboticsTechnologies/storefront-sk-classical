export default function NewArrivalsLoading() {
    return (
        <div className="container mx-auto px-4 py-8 mt-16">
            <div className="flex flex-col items-center gap-4 py-8 md:py-12">
                <div className="h-3 w-28 bg-muted animate-pulse rounded" />
                <div className="h-10 w-64 bg-muted animate-pulse rounded" />
                <div className="h-4 w-80 max-w-full bg-muted animate-pulse rounded" />
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {Array.from({length: 8}).map((_, i) => (
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
