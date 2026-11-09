import { Clock, Mail, MessageCircle } from 'lucide-react';
import { siteConfig } from '@/config/site';
import { buildWhatsAppLink } from '@/lib/whatsapp';

// Komponen Instagram kustom dengan styling yang sama seperti Lucide
const InstagramIcon = ({ className = "w-6 height-6" }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

export function ContactSection() {
  const { contact, members } = siteConfig;
  const whatsappUrl =
    contact.whatsapp !== ''
      ? buildWhatsAppLink(contact.whatsapp, 'Halo Karsa Pandiga, saya ingin bertanya tentang produk.')
      : '';
  const hasContact =
    whatsappUrl !== '' || contact.instagram !== '' || contact.email !== '' || contact.replyHours !== '';

  if (!hasContact && members.length === 0) return null;

  return (
    <section id="kontak" className="py-16 sm:py-24">
      <div className="mx-auto grid max-w-6xl gap-14 px-4 sm:px-6 lg:grid-cols-2">
        {hasContact ? (
          <div>
            <h2 className="text-balance text-3xl font-extrabold tracking-tight sm:text-4xl">
              Ada pertanyaan? Hubungi kami
            </h2>
            <ul className="mt-8 space-y-4 text-sm">
              {whatsappUrl !== '' ? (
                <li>
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 font-semibold text-white transition hover:bg-primary-hover"
                  >
                    <MessageCircle className="h-4 w-4" aria-hidden />
                    Chat WhatsApp {contact.whatsapp}
                  </a>
                </li>
              ) : null}
              {contact.instagram !== '' ? (
                <li>
                  <a
                    href={`https://instagram.com/${contact.instagram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 font-semibold hover:text-link"
                  >
                    <InstagramIcon className="h-4 w-4" aria-hidden />@{contact.instagram}
                  </a>
                </li>
              ) : null}
              {contact.email !== '' ? (
                <li>
                  <a
                    href={`mailto:${contact.email}`}
                    className="inline-flex items-center gap-2 font-semibold hover:text-link"
                  >
                    <Mail className="h-4 w-4" aria-hidden />
                    {contact.email}
                  </a>
                </li>
              ) : null}
              {contact.replyHours !== '' ? (
                <li className="inline-flex items-center gap-2 text-muted">
                  <Clock className="h-4 w-4" aria-hidden />
                  Balas pesan: {contact.replyHours}
                </li>
              ) : null}
            </ul>
          </div>
        ) : null}

        {members.length > 0 ? (
          <div>
            <h2 className="text-balance text-3xl font-extrabold tracking-tight sm:text-4xl">
              Tim Karsa Pandiga
            </h2>
            <ul className="mt-8 divide-y divide-line border-y border-line">
              {members.map((member) => (
                <li key={member.name} className="py-3">
                  <p className="font-semibold">{member.name}</p>
                  {member.role !== '' ? <p className="text-sm text-muted">{member.role}</p> : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}