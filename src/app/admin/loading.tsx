import { Skeleton } from '@/components/ui/Skeleton';

export default function AdminLoading() {
  return (
    <main className="mx-auto max-w-5xl space-y-6" aria-busy="true">
      <span role="status" className="sr-only">
        Memuat…
      </span>
      <Skeleton className="h-8 w-56" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-28 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-48 w-full rounded-2xl" />
    </main>
  );
}