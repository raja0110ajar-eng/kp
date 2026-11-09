import Link from 'next/link';
import { BrandLogo } from '@/components/layout/BrandLogo';
import { siteConfig } from '@/config/site';
import { buildWhatsAppLink } from '@/lib/whatsapp';

export function SiteFooter() {
  const { contact, school } = siteConfig;
  const whatsappUrl = contact.whatsapp !== '' ? buildWhatsAppLink(contact.whatsapp) : '';
  const linkClass = 'text-white/75 transition-colors hover:text-white';

  return (
    <footer className="on-inverse bg-inverse text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <BrandLogo onInverse />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/75">{siteConfig.tagline}</p>
          <p className="mt-3 text-sm text-white/60">
            {school.programName} {school.name}, {school.city}
          </p>
        </div>

        <nav aria-label="Tautan footer">
          <p className="font-semibold">Jelajahi</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link href="/products" className={linkClass}>
                Katalog produk
              </Link>
            </li>
            <li>
              <Link href="/orders" className={linkClass}>
                Lacak pesanan
              </Link>
            </li>
            <li>
              <Link href="/cart" className={linkClass}>
                Keranjang
              </Link>
            </li>
            <li>
              <Link href="/privasi" className={linkClass}>
                Kebijakan privasi
              </Link>
            </li>
          </ul>
        </nav>

        <div>
          <p className="font-semibold">Kontak</p>
          <ul className="mt-3 space-y-2 text-sm">
            {whatsappUrl !== '' ? (
              <li>
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>
                  WhatsApp {contact.whatsapp}
                </a>
              </li>
            ) : null}
            {contact.instagram !== '' ? (
              <li>
                <a
                  href={`https://instagram.com/${contact.instagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClass}
                >
                  Instagram @{contact.instagram}
                </a>
              </li>
            ) : null}
            {contact.email !== '' ? (
              <li>
                <a href={`mailto:${contact.email}`} className={linkClass}>
                  {contact.email}
                </a>
              </li>
            ) : null}
            {contact.replyHours !== '' ? (
              <li className="text-white/60">Balas pesan: {contact.replyHours}</li>
            ) : null}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto max-w-6xl space-y-1 px-4 py-6 text-xs leading-relaxed text-white/60 sm:px-6">
          <p>{siteConfig.footerDisclaimer}</p>
          {siteConfig.independenceNote !== '' ? <p>{siteConfig.independenceNote}</p> : null}
        </div>
      </div>
    </footer>
  );
}