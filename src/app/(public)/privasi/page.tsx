import type { Metadata } from 'next';
import { siteConfig } from '@/config/site';

export const metadata: Metadata = {
  title: 'Kebijakan privasi | Karsa Pandiga',
  description: 'Data apa yang kami kumpulkan saat kamu memesan, untuk apa, dan berapa lama disimpan.',
};

const RETENTION = '12 bulan';

interface PolicySection {
  heading: string;
  paragraphs?: readonly string[];
  items?: readonly string[];
}

const SECTIONS: readonly PolicySection[] = [
  {
    heading: 'Data yang kami kumpulkan',
    items: [
      'Saat checkout: nama, nomor HP, alamat atau lokasi pengantaran, catatan, dan isi pesananmu.',
      'Saat membayar non-tunai: gambar bukti transfer yang kamu unggah.',
      'Jika kamu membuat akun: alamat email dan kata sandi. Kata sandi disimpan dalam bentuk acak (hash) oleh layanan autentikasi, sehingga kami tidak bisa membacanya.',
      'Data teknis: alamat IP, dipakai hanya untuk membatasi percobaan berlebihan saat melacak atau membuat pesanan. Disimpan paling lama sekitar satu hari.',
    ],
  },
  {
    heading: 'Untuk apa data dipakai',
    paragraphs: [
      'Untuk memproses pesanan, mengantar, memeriksa pembayaran, dan menghubungimu tentang pesanan. Juga untuk melindungi situs dari penyalahgunaan. Data tidak dijual dan tidak dipakai untuk iklan.',
    ],
  },
  {
    heading: 'Siapa yang bisa melihat',
    items: [
      'Admin Karsa Pandiga, yaitu anggota kelompok yang diberi akses.',
      'Penyedia layanan yang memproses data atas nama kami: Supabase (database, penyimpanan file, dan autentikasi) serta Vercel (hosting).',
      'Bukti transfer disimpan secara privat dan hanya bisa dibuka admin.',
    ],
  },
  {
    heading: 'Pembacaan bukti transfer (OCR)',
    paragraphs: [
      'Teks pada bukti transfer dibaca langsung di browsermu. Gambar baru dikirim ke server setelah dikecilkan. Saat pertama dipakai, pustaka OCR mengunduh data bahasa dari jaringan pengiriman konten (CDN) pihak ketiga. Hasil bacaan hanya membantu, keputusan akhir ada pada admin.',
    ],
  },
  {
    heading: 'Data di perangkatmu',
    paragraphs: [
      'Situs menyimpan isi keranjang dan pilihan tema di penyimpanan lokal browser. Nomor HP disimpan sementara selama tab terbuka agar kamu tidak mengetik ulang saat membayar atau melacak. Sesi login disimpan bila kamu masuk dengan akun. Kami tidak memakai cookie iklan maupun pelacak pihak ketiga.',
    ],
  },
  {
    heading: 'Berapa lama data disimpan',
    paragraphs: [
      `Data pesanan dan bukti transfer disimpan sekitar ${RETENTION} sejak pesanan dibuat, lalu dihapus oleh admin. Kamu bisa meminta penghapusan lebih awal. Pesanan yang masih berjalan baru bisa dihapus setelah selesai.`,
    ],
  },
  {
    heading: 'Hakmu',
    paragraphs: [
      'Kamu boleh meminta untuk melihat, memperbaiki, atau menghapus data pribadimu. Hubungi kami lewat kontak di bawah dan sebutkan kode pesananmu.',
    ],
  },
];

export default function PrivacyPage() {
  const { contact } = siteConfig;

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-balance text-3xl font-extrabold tracking-tight sm:text-4xl">
        Kebijakan privasi
      </h1>
      <p className="mt-4 leading-relaxed text-muted">
        Karsa Pandiga adalah usaha kelompok siswa dan bukan produk resmi sekolah. Halaman ini
        menjelaskan data apa yang kami simpan saat kamu memakai situs ini.
      </p>

      <div className="mt-10 space-y-10">
        {SECTIONS.map((section) => (
          <section key={section.heading}>
            <h2 className="text-xl font-bold">{section.heading}</h2>
            {section.paragraphs?.map((paragraph) => (
              <p key={paragraph} className="mt-3 leading-relaxed text-ink-soft">
                {paragraph}
              </p>
            ))}
            {section.items ? (
              <ul className="mt-3 list-disc space-y-2 pl-5 leading-relaxed text-ink-soft">
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}

        {contact.whatsapp !== '' || contact.email !== '' ? (
          <section>
            <h2 className="text-xl font-bold">Kontak</h2>
            <ul className="mt-3 space-y-1 text-ink-soft">
              {contact.whatsapp !== '' ? <li>WhatsApp: {contact.whatsapp}</li> : null}
              {contact.email !== '' ? <li>Email: {contact.email}</li> : null}
              {contact.replyHours !== '' ? <li>Jam balas: {contact.replyHours}</li> : null}
            </ul>
          </section>
        ) : null}
      </div>

      <p className="mt-12 text-sm text-muted">Terakhir diperbarui: 9 November 2026.</p>
    </main>
  );
}