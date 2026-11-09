import Image from 'next/image';
import Link from 'next/link';

interface BrandLogoProps {
  size?: number;
  /** true bila ditaruh di atas latar navy/gelap (teks dibuat putih). */
  onInverse?: boolean;
}

export function BrandLogo({ size = 36, onInverse = false }: BrandLogoProps) {
  return (
    <Link href="/" aria-label="Karsa Pandiga, ke beranda" className="flex items-center gap-2.5">
      <Image src="/logo.png" alt="" width={size} height={size} className="rounded-[22%]" />
      <span className={`text-lg font-extrabold tracking-tight ${onInverse ? 'text-white' : 'text-ink'}`}>
        Karsa Pandiga
      </span>
    </Link>
  );
}