// Migrasi warna lama (hex tetap dan kelas neutral/merah/hijau) ke token tema Karsa Pandiga.
// Simulasi:  node scripts/migrate-colors.mjs
// Terapkan:  node scripts/migrate-colors.mjs --write
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const SRC_DIR = join(ROOT, 'src');
const WRITE = process.argv.includes('--write');

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Nama kelas harus diawali spasi/kutip/titik dua (varian seperti hover:) dan boleh diakhiri /opasitas.
const START = '(?<=^|[\\s"\'`:])';
const END = '(?=(?:\\/\\d{1,3})?(?![\\w-]))';

function utility(prefix, oldColor) {
  return new RegExp(`${START}${prefix}-${escapeRegExp(oldColor)}${END}`, 'gm');
}

// [awalan, warna lama, token baru]
const PAIRS = [
  // latar
  ['bg', 'white', 'surface'],
  ['bg', 'neutral-50', 'soft'],
  ['bg', 'neutral-100', 'soft'],
  ['bg', 'neutral-200', 'sunken'],
  ['bg', 'red-50', 'danger-soft'],
  ['bg', 'red-100', 'danger-soft'],
  ['bg', 'emerald-100', 'success-soft'],
  ['bg', '[#0066FF]', 'primary'],
  ['bg', '[#1A73E8]', 'primary-hover'],
  ['bg', '[#FF6B00]', 'accent'],
  ['bg', '[#0D0D0D]', 'inverse'],
  // teks
  ['text', 'neutral-900', 'ink'],
  ['text', 'neutral-800', 'ink'],
  ['text', 'neutral-700', 'ink-soft'],
  ['text', 'neutral-600', 'muted'],
  ['text', 'neutral-500', 'muted'],
  ['text', 'neutral-400', 'muted'],
  ['text', 'red-700', 'danger-ink'],
  ['text', 'red-800', 'danger-ink'],
  ['text', 'emerald-700', 'success-ink'],
  ['text', '[#0066FF]', 'link'],
  ['text', '[#FF6B00]', 'accent-ink'],
  ['text', '[#C24E00]', 'accent-ink'],
  ['text', '[#0D0D0D]', 'ink'],
  // garis
  ['border', 'neutral-100', 'line'],
  ['border', 'neutral-200', 'line'],
  ['border', 'neutral-300', 'line-strong'],
  ['border', 'neutral-400', 'line-strong'],
  ['border', 'neutral-500', 'line-strong'],
  ['border', 'red-200', 'danger-line'],
  ['border', '[#0066FF]', 'primary'],
  ['border', '[#FF6B00]', 'accent'],
  ['divide', 'neutral-100', 'line'],
  ['divide', 'neutral-200', 'line'],
  ['ring', 'neutral-200', 'line'],
];

const RULES = [
  // Kasus khusus lebih dulu.
  { re: /hover:border-neutral-(?:400|500)(?![\w-])/g, to: 'hover:border-muted' },
  { re: new RegExp(`${START}bg-white(?=\\/\\d)`, 'gm'), to: 'bg-canvas' },
  ...PAIRS.map(([prefix, from, to]) => ({ re: utility(prefix, from), to: `${prefix}-${to}` })),
  // Cincin fokus global (dari globals.css) menggantikan outline-none.
  { re: /(?<=[\s"'`])outline-none\s?/g, to: '' },
];

const LEFTOVER =
  /#0066FF|#1A73E8|#FF6B00|#C24E00|#0D0D0D|neutral-\d|\bbg-white\b|(?:bg|text|border)-(?:red|emerald)-\d/;

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(full)));
    else if (/\.(ts|tsx)$/.test(entry.name)) files.push(full);
  }
  return files;
}

const files = await walk(SRC_DIR);
let changedFiles = 0;
let totalReplacements = 0;
const leftovers = [];

for (const file of files) {
  const original = await readFile(file, 'utf8');
  let next = original;
  let count = 0;

  for (const rule of RULES) {
    next = next.replace(rule.re, () => {
      count += 1;
      return rule.to;
    });
  }

  if (count > 0) {
    changedFiles += 1;
    totalReplacements += count;
    console.log(`${String(count).padStart(4)}  ${relative(ROOT, file)}`);
    if (WRITE) await writeFile(file, next, 'utf8');
  }

  next.split(/\r?\n/).forEach((line, index) => {
    if (LEFTOVER.test(line)) leftovers.push(`${relative(ROOT, file)}:${index + 1}  ${line.trim()}`);
  });
}

console.log(
  `\n${WRITE ? 'DITERAPKAN' : 'SIMULASI (tidak ada file yang diubah)'}: ${totalReplacements} penggantian di ${changedFiles} file.`
);

if (leftovers.length > 0) {
  console.log(`\nSisa pola lama yang perlu dicek manual (${leftovers.length} baris):`);
  for (const item of leftovers) console.log(`  ${item}`);
} else {
  console.log('\nTidak ada sisa pola lama.');
}

if (!WRITE) console.log('\nJalankan lagi dengan --write untuk menerapkan.');