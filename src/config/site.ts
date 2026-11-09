export interface SiteValue {
  title: string;
  description: string;
}

export interface SiteMember {
  name: string;
  /** Kosongkan ('') bila tidak ingin menampilkan peran. */
  role: string;
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
  /** Kosongkan field kontak ('') untuk menyembunyikan bagian terkait. */
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

export const siteConfig: SiteConfig = {
  name: 'Karsa Pandiga',
  tagline: 'Karsa Pandiga: Inovasi Teknologi & Kreativitas Berkelanjutan untuk Sesama.',
  nameMeaning: '',
  // Tagline di atas tanpa awalan nama usaha, dipakai sebagai judul besar di hero.
  heroHeadline: 'Inovasi Teknologi & Kreativitas Berkelanjutan untuk Sesama.',
  heroDescription:
    'Selamat datang di etalase inovasi kreatif siswa PPLG SMKN 2 Klaten. Kami menggabungkan keahlian teknologi digital dan kriya ramah lingkungan untuk menghadirkan produk unik—mulai dari solusi pintar Smartgloves dan Website, hingga fashion daur ulang serta plantable paper yang siap membantu sesama dan menjaga bumi.',
  // Ringkasan untuk mesin pencari (ditulis ulang dari deskripsi hero agar lebih pendek).
  metaDescription:
    'Etalase inovasi kreatif siswa PPLG SMKN 2 Klaten: Smartgloves, website, fashion daur ulang, dan plantable paper.',
  about: [
    'Karsa Pandiga adalah wadah kolaborasi kreatif berbasis vokasi dari kompetensi keahlian PPLG SMKN 2 Klaten. Tidak hanya berfokus pada pengembangan perangkat lunak dan gim, kami juga memperluas batas kreativitas untuk menciptakan produk inovatif yang solutif dan berdampak nyata. Dari sarung tangan pintar pengendali teknologi, platform digital, tas unik berbahan perpaduan kain dan kabel, hingga kemasan dan label kertas yang dapat tumbuh menjadi tanaman (plantable paper), setiap karya kami didedikasikan untuk memberikan solusi terbaik, membantu sesama, dan menjaga kelestarian lingkungan.',
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
  delivery: {
    school: {
      schedule: 'Saat jam istirahat',
      method: 'Diantar langsung ke kelas',
    },
    outside: {
      weekdaySchedule: 'Hari biasa: 17.00–19.00',
      weekendSchedule: 'Akhir pekan: 09.00–15.00',
    },
    // Dirapikan dari catatan kebijakan yang dikirim; ubah di sini bila ingin redaksi lain.
    returnPolicy:
      'Pembatalan atau retur karena barang cacat/rusak harus disertai bukti kecacatan atau kerusakan. Untuk produk makanan, sertakan juga penyebab masalahnya.',
  },
  contact: {
    whatsapp: '08895636315',
    instagram: 'karsa_pandiga',
    email: 'karsapandiga@gmail.com',
    replyHours: 'Setiap hari, 07.00–21.00',
  },
  school: {
    name: 'SMKN 2 Klaten',
    city: 'Klaten',
    programName: 'PPLG',
  },
  members: [
    { name: 'Reza Alvino Oktavianto', role: '' },
    { name: 'Azizah Naswa Nur Alifia', role: '' },
    { name: 'Fatin Nada Salsabila', role: '' },
    { name: 'Pivel Faith Wibowo', role: '' },
  ],
  footerDisclaimer:
    '© 2026 Karsa Pandiga – SMKN 2 Klaten. Seluruh hak cipta dilindungi. Dikembangkan sebagai bagian dari proyek kewirausahaan dan inovasi siswa vokasi.',
  // Kalimat tambahan dari konteks proyek (usaha ini bukan produk resmi sekolah).
  // Kosongkan ('') untuk menghapusnya dari footer.
  independenceNote: 'Karsa Pandiga adalah usaha kelompok siswa dan bukan produk resmi sekolah.',
};