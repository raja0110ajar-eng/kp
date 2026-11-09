import Image from 'next/image';
import { Package } from 'lucide-react';
import { getPublicAssetUrl } from '@/lib/assets';

interface ProductImageProps {
  path: string | null;
  alt: string;
  sizes: string;
  /** true: gambar membesar halus saat induk ber-class "group" disorot. */
  zoom?: boolean;
}

export function ProductImage({ path, alt, sizes, zoom = false }: ProductImageProps) {
  return (
    <div className="relative aspect-square w-full overflow-hidden bg-soft">
      {path ? (
        <Image
          src={getPublicAssetUrl(path)}
          alt={alt}
          fill
          sizes={sizes}
          className={`object-cover transition-transform duration-500 ease-out motion-reduce:transition-none ${
            zoom ? 'group-hover:scale-105' : ''
          }`}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-muted">
          <Package className="h-10 w-10" aria-hidden />
        </div>
      )}
    </div>
  );
}