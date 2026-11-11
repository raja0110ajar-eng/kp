const DELIMITER = ';';

/** Mencegah "CSV injection": sel yang diawali = + - @ dianggap rumus oleh Excel. */
function escapeCell(value: string | number | null): string {
  if (value === null) return '';
  let text = String(value);
  if (typeof value === 'string' && /^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[";\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** Titik koma dipakai sebagai pemisah karena Excel berbahasa Indonesia membukanya dengan benar. */
export function toCsv(rows: ReadonlyArray<ReadonlyArray<string | number | null>>): string {
  const body = rows.map((row) => row.map(escapeCell).join(DELIMITER)).join('\r\n');
  return `\uFEFF${body}\r\n`;
}