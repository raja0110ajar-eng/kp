'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Package } from 'lucide-react';

export interface GalleryImage {
  url: string;
  alt: string;
}

export function ProductGallery({ images }: { images: GalleryImage[] }) {
  const [selected, setSelected] = useState(0);
  const current = images[selected] ?? images[0];

  if (!current) {
    return (
      <div className="flex aspect-square w-full items-center justify-center rounded-2xl border border-line bg-soft text-muted">
        <Package className="h-12 w-12" aria-hidden />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-line bg-soft">
        <Image
          src={current.url}
          alt={current.alt}
          fill
          sizes="(min-width: 768px) 50vw, 100vw"
          className="object-cover"
        />
      </div>

      {images.length > 1 ? (
        <ul className="grid grid-cols-4 gap-2">
          {images.map((image, index) => (
            <li key={image.url}>
              <button
                type="button"
                onClick={() => setSelected(index)}
                aria-label={`Lihat foto ${index + 1} dari ${images.length}`}
                aria-current={index === selected ? 'true' : undefined}
                className={`relative aspect-square w-full overflow-hidden rounded-lg border-2 bg-soft ${
                  index === selected ? 'border-primary' : 'border-transparent hover:border-line-strong'
                }`}
              >
                <Image src={image.url} alt="" fill sizes="25vw" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}