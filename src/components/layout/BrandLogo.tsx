import Image from 'next/image';
import Link from 'next/link';

interface BrandLogoProps {
  size?: number;
  /** true bila ditaruh di atas latar navy/gelap (teks dibuat putih). */
  onInverse?: boolean;
  /** true: nama disembunyikan di layar sempit agar header tidak penuh. */
  compact?: boolean;
}

export function BrandLogo({ size = 36, onInverse = false, compact = false }: BrandLogoProps) {
  return (
    <Link href="/" aria-label="Karsa Pandiga, ke beranda" className="flex shrink-0 items-center gap-2.5">
      <Image src="/logo.png" alt="" width={size} height={size} className="rounded-[22%]" />
      <span
        className={`whitespace-nowrap text-lg font-extrabold tracking-tight ${
          compact ? 'hidden min-[430px]:inline' : ''
        } ${onInverse ? 'text-white' : 'text-ink'}`}
      >
        Karsa Pandiga
      </span>
    </Link>
  );
}