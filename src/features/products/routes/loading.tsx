import { Skeleton } from '@/components/ui/skeleton';

export default function ProductLoading() {
    return (
        <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 mt-16">
            <Skeleton className="h-4 w-56 mb-6" />
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">
                {/* Gallery: vertical thumbnail rail (desktop) / row below (mobile) */}
                <div className="relative flex flex-col lg:col-span-7 lg:block lg:pl-24">
                    <div className="order-2 mt-3 flex gap-2 lg:absolute lg:inset-y-0 lg:left-0 lg:mt-0 lg:flex-col">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <Skeleton key={i} className="size-16 lg:size-20 rounded-lg" />
                        ))}
                    </div>
                    <Skeleton className="order-1 aspect-square w-full rounded-2xl" />
                </div>

                {/* Buy box, trust markers, details */}
                <div className="space-y-5 lg:col-span-5">
                    <Skeleton className="h-10 w-4/5" />
                    <div className="space-y-2">
                        <Skeleton className="h-9 w-32" />
                        <Skeleton className="h-3 w-48" />
                    </div>
                    <Skeleton className="h-px w-full" />
                    <Skeleton className="h-24 w-full rounded-2xl" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-12 w-full rounded-lg" />
                    <Skeleton className="h-32 w-full rounded-2xl" />
                    <Skeleton className="h-56 w-full rounded-2xl" />
                </div>
            </div>
        </div>
    );
}
