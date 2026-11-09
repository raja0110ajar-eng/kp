import Link from 'next/link';
import { secondaryButtonClass } from '@/components/admin/styles';

interface PaginationProps {
  basePath: string;
  /** Parameter filter aktif (nilai kosong tidak ikut ke URL). */
  params: Record<string, string>;
  page: number;
  pageSize: number;
  total: number;
}

export function Pagination({ basePath, params, page, pageSize, total }: PaginationProps) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  if (pageCount <= 1) return null;

  function hrefFor(target: number): string {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== '') search.set(key, value);
    }
    if (target > 1) search.set('page', String(target));
    const query = search.toString();
    return query ? `${basePath}?${query}` : basePath;
  }

  return (
    <nav aria-label="Halaman" className="flex items-center justify-between gap-3">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} className={secondaryButtonClass}>
          Sebelumnya
        </Link>
      ) : (
        <span />
      )}
      <span className="text-sm text-muted">
        Halaman {page} dari {pageCount}
      </span>
      {page < pageCount ? (
        <Link href={hrefFor(page + 1)} className={secondaryButtonClass}>
          Berikutnya
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}