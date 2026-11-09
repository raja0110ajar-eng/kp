import { Skeleton } from '@/components/ui/Skeleton';

export default function OrdersLoading() {
  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-8" aria-busy="true">
      <span role="status" className="sr-only">
        Memuat pesanan…
      </span>
      <Skeleton className="h-9 w-40" />
      <Skeleton className="h-20 w-full rounded-2xl" />
      <Skeleton className="h-20 w-full rounded-2xl" />
      <Skeleton className="h-40 w-full rounded-2xl" />
    </main>
  );
}