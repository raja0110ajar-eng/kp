export interface SiteValue {
  title: string;
  description: string;
}

export interface SiteMember {
  name: string;
  /** Kosongkan ('') bila tidak ingin menampilkan peran. */
  role: string;
}

export interface SiteFaq {
  question: string;
  answer: string;
}

export interface SiteTestimonial {
  quote: string;
  name: string;
  /** Contoh: "Kelas XI RPL 1" atau "Guru". Kosongkan ('') bila tidak perlu. */
  context: string;
}

export interface SitePartner {
  name: string;
  url: string;
  status: string;
  description: string;
}

export interface SiteConfig {
  name: string;
  tagline: string;
  /** Arti nama "Karsa Pandiga" dengan kalimatmu sendiri. Kosongkan ('') untuk menyembunyikannya. */
  nameMeaning: string;
  heroHeadline: string;
  heroDescription: string;
  metaDescription: string;
  about: readonly string[];
  values: readonly SiteValue[];
  delivery: {
    school: { schedule: string; method: string };
    outside: { weekdaySchedule: string; weekendSchedule: string };
    returnPolicy: string;
  };
  /** Janji layanan yang harus ditepati admin. Pencapaiannya terlihat di halaman Laporan. */
  service: { confirmationHours: number };
  /** Batas layanan yang kami sebut terang-terangan. */
  limits: readonly string[];
  faq: readonly SiteFaq[];
  /** Testimoni manual (dengan izin orangnya). Kosong berarti bagian testimoni tersembunyi. */
  testimonials: readonly SiteTestimonial[];
  partners: readonly SitePartner[];
  contact: {
    whatsapp: string;
    instagram: string;
    email: string;
    replyHours: string;
  };
  school: { name: string; city: string; programName: string };
  members: readonly SiteMember[];
  footerDisclaimer: string;
  independenceNote: string;
}

const delivery = {
  school: {
    schedule: 'Saat jam istirahat',
    method: 'Diantar langsung ke kelas',
  },
  outside: {
    weekdaySchedule: 'Hari biasa: 17.00–19.00',
    weekendSchedule: 'Akhir pekan: 09.00–15.00',
  },
  returnPolicy:
    'Pembatalan atau retur karena barang cacat/rusak harus disertai bukti kecacatan atau kerusakan. Untuk produk makanan, sertakan juga penyebab masalahnya.',
} as const;

const service = { confirmationHours: 3 } as const;

const replyHours = 'Setiap hari, 07.00–21.00';

export const siteConfig: SiteConfig = {
  name: 'Karsa Pandiga',
  tagline: 'Karsa Pandiga: Inovasi Teknologi & Kreativitas Berkelanjutan untuk Sesama.',
  nameMeaning: '',
  heroHeadline: 'Inovasi Teknologi & Kreativitas Berkelanjutan untuk Sesama.',
  heroDescription:
    'Karya siswa PPLG SMKN 2 Klaten: kriya ramah lingkungan dari limbah, kemasan kertas benih, dan prototipe teknologi seperti SmartGloves. Diantar langsung oleh tim kami.',
  metaDescription:
    'Karya siswa PPLG SMKN 2 Klaten: tas dari limbah kabel dan kain, kertas benih (plantable paper), dan prototipe teknologi SmartGloves.',
  about: [
    'Karsa Pandiga adalah wadah kolaborasi kreatif berbasis vokasi dari kompetensi keahlian PPLG SMKN 2 Klaten.',
    'Tidak hanya berfokus pada pengembangan perangkat lunak dan gim, kami juga memperluas batas kreativitas untuk menciptakan produk inovatif yang solutif dan berdampak nyata.',
    'Dari sarung tangan pintar penerjemah isyarat SIBI dan BISINDO, platform digital, tas unik berbahan perpaduan kain dan kabel, hingga kemasan dan label kertas yang dapat tumbuh menjadi tanaman (plantable paper), setiap karya kami didedikasikan untuk memberikan solusi terbaik, membantu sesama, dan menjaga kelestarian lingkungan.',
  ],
  values: [
    {
      title: 'Integrasi Teknologi & Kreativitas',
      description:
        'Memadukan kecanggihan rekayasa perangkat lunak (website & smartgloves) dengan inovasi produk kriya fungsional yang bernilai guna tinggi.',
    },
    {
      title: 'Akar Keberlanjutan (Eco-Innovation)',
      description:
        'Mengusung prinsip kepedulian lingkungan melalui pemanfaatan limbah (kabel dan kain) serta produk inovatif ramah lingkungan seperti kertas benih (plantable paper dan kemasannya).',
    },
    {
      title: 'Berdaya Guna untuk Sesama',
      description:
        'Setiap inovasi dirancang bukan sekadar karya, melainkan untuk memberikan kemudahan, solusi praktis, serta manfaat nyata bagi pengguna dan masyarakat luas.',
    },
  ],
  delivery,
  service,
  limits: [
    'Pembayaran non-tunai diperiksa admin secara manual oleh siswa, jadi konfirmasi mengikuti jam balas.',
    'Stok baru berkurang setelah pembayaran diverifikasi, sehingga pesanan bisa dibatalkan bila stok habis lebih dulu.',
    'Pengantaran hanya ke area dan zona yang tersedia di halaman checkout.',
  ],
  faq: [
    {
      question: 'Apakah harus membuat akun?',
      answer:
        'Tidak. Kamu bisa memesan sebagai tamu dan melacak pesanan dengan kode pesanan dan nomor HP. Akun hanya memudahkan melihat semua pesananmu di satu tempat.',
    },
    {
      question: 'Bagaimana cara membayar?',
      answer:
        'Pilih metode saat checkout: QRIS, e-wallet (DANA, OVO, GoPay), transfer bank, atau COD. Untuk pembayaran non-tunai, unggah screenshot bukti transfer di halaman pembayaran.',
    },
    {
      question: 'Kapan pesananku sampai?',
      answer: `Area sekolah: ${delivery.school.method.toLowerCase()}, ${delivery.school.schedule.toLowerCase()}, tanpa ongkir. Luar sekolah: ${delivery.outside.weekdaySchedule.toLowerCase()}; ${delivery.outside.weekendSchedule.toLowerCase()}. Tarif luar sekolah tampil di checkout sesuai zona.`,
    },
    {
      question: 'Berapa lama pembayaranku dikonfirmasi?',
      answer: `Maksimal ${service.confirmationHours} jam pada jam balas (${replyHours.toLowerCase()}). Di luar jam itu, konfirmasi menunggu jam balas berikutnya.`,
    },
    {
      question: 'Bagaimana bila bukti transferku ditolak?',
      answer:
        'Admin menulis alasannya di halaman pesananmu, lalu kamu bisa mengunggah bukti yang baru.',
    },
    {
      question: 'Bagaimana kalau barangnya cacat atau rusak?',
      answer: delivery.returnPolicy,
    },
    {
      question: 'Apakah SmartGloves dijual?',
      answer:
        'Belum. SmartGloves adalah prototipe edukasi untuk isyarat SIBI dan BISINDO. Kamu bisa mencobanya langsung di situs SmartGloves.',
    },
    {
      question: 'Apakah data pribadiku aman?',
      answer:
        'Data hanya dipakai untuk memproses pesanan, disimpan sekitar 12 bulan, dan bukti transfer hanya bisa dilihat admin. Baca selengkapnya di halaman Kebijakan privasi.',
    },
    {
      question: 'Bagaimana kalau aku lupa kode pesananku?',
      answer:
        'Buka halaman Pesanan. Pesanan yang dibuat di perangkat yang sama tampil otomatis tanpa mengetik kode. Kalau berganti perangkat, hubungi admin lewat WhatsApp dengan nomor HP yang kamu pakai saat memesan.',
    },
    {
      question: 'Bagaimana kalau jadwal pengantaranku berubah?',
      answer:
        'Admin memperbarui perkiraan jadwal dan catatan langsung di halaman pesananmu, dan halaman itu menyegarkan diri tiap 30 detik. Untuk perubahan penting, admin juga bisa menghubungimu lewat WhatsApp.',
    },
  ],
  testimonials: [],
  partners: [
    {
      name: 'SmartGloves',
      url: 'https://smartgloves.vercel.app',
      status: 'Prototipe edukasi',
      description:
        'Sarung tangan pintar yang menerjemahkan isyarat tangan SIBI dan BISINDO menjadi teks dan suara. Dikembangkan oleh tim kami dan diuji secara terbuka.',
    },
  ],
  contact: {
    whatsapp: '0882000647705',
    instagram: 'karsa_pandiga',
    email: 'karsapandiga@gmail.com',
    replyHours,
  },
  school: {
    name: 'SMKN 2 Klaten',
    city: 'Klaten',
    programName: 'PPLG',
  },
  members: [
    { name: 'Reza', role: '' },
    { name: 'Azizah', role: '' },
    { name: 'Fatin', role: '' },
    { name: 'Pivel', role: '' },
  ],
  footerDisclaimer:
    '© 2026 Karsa Pandiga – SMKN 2 Klaten. Seluruh hak cipta dilindungi. Dikembangkan sebagai bagian dari proyek kewirausahaan dan inovasi siswa vokasi.',
  independenceNote: 'Karsa Pandiga adalah usaha kelompok siswa dan bukan produk resmi sekolah.',
};
