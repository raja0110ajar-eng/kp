import { Skeleton } from '@/components/ui/Skeleton';

export default function ProductsLoading() {
  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8" aria-busy="true">
      <span role="status" className="sr-only">
        Memuat katalog…
      </span>
      <Skeleton className="h-9 w-48" />
      <Skeleton className="h-10 w-full max-w-md" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => (
          <div key={index} className="space-y-3">
            <Skeleton className="aspect-square w-full rounded-2xl" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-5 w-1/3" />
          </div>
        ))}
      </div>
    </main>
  );
}