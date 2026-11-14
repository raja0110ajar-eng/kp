const etaFormatter = new Intl.DateTimeFormat('id-ID', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'Asia/Jakarta',
});

/** Mengubah tanggal "2026-11-14" menjadi "Sabtu, 14 November 2026". */
export function formatEtaDate(value: string): string {
  const date = new Date(`${value}T00:00:00+07:00`);
  return Number.isNaN(date.getTime()) ? value : etaFormatter.format(date);
}