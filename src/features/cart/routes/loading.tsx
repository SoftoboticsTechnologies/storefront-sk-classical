import { CartSkeleton } from '@/features/cart/components/cart-skeleton';

export default function CartLoading() {
    return (
        <div className="container mx-auto px-4 md:px-6 lg:px-8 py-20">
            <div className="h-9 w-48 bg-muted animate-pulse rounded mb-8" />
            <CartSkeleton />
        </div>
    );
}
