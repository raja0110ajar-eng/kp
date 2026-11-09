const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
type AllowedType = (typeof ALLOWED_TYPES)[number];

const MAX_INPUT_BYTES = 20 * 1024 * 1024;
/** Harus sama dengan file_size_limit bucket public-assets (2 MB). */
const MAX_OUTPUT_BYTES = 2 * 1024 * 1024;
const QUALITY_STEPS = [0.9, 0.8, 0.7, 0.6] as const;

export type AssetImageErrorCode =
  | 'unsupported_type'
  | 'too_large'
  | 'decode_failed'
  | 'encode_failed';

export class AssetImageError extends Error {
  readonly code: AssetImageErrorCode;

  constructor(code: AssetImageErrorCode) {
    super(code);
    this.name = 'AssetImageError';
    this.code = code;
  }
}

export interface PreparedAsset {
  blob: Blob;
  contentType: AllowedType;
  extension: 'jpg' | 'png' | 'webp';
}

export interface PrepareOptions {
  maxSidePx: number;
  /** true: file asli dipakai apa adanya bila sudah <= 2 MB (untuk QRIS). */
  keepOriginalIfFits: boolean;
}

const EXTENSION_BY_TYPE: Record<AllowedType, PreparedAsset['extension']> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

function findAllowedType(type: string): AllowedType | null {
  return ALLOWED_TYPES.find((candidate) => candidate === type) ?? null;
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
}

export async function prepareAssetImage(file: File, options: PrepareOptions): Promise<PreparedAsset> {
  const type = findAllowedType(file.type);
  if (!type) throw new AssetImageError('unsupported_type');
  if (file.size > MAX_INPUT_BYTES) throw new AssetImageError('too_large');

  if (options.keepOriginalIfFits && file.size <= MAX_OUTPUT_BYTES) {
    return { blob: file, contentType: type, extension: EXTENSION_BY_TYPE[type] };
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new AssetImageError('decode_failed');
  }

  try {
    const scale = Math.min(1, options.maxSidePx / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) throw new AssetImageError('encode_failed');

    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);
    context.drawImage(bitmap, 0, 0, width, height);

    for (const quality of QUALITY_STEPS) {
      const blob = await canvasToBlob(canvas, quality);
      if (blob && blob.size <= MAX_OUTPUT_BYTES) {
        return { blob, contentType: 'image/jpeg', extension: 'jpg' };
      }
    }
    throw new AssetImageError('too_large');
  } finally {
    bitmap.close();
  }
}

export function getAssetImageErrorMessage(error: unknown): string {
  if (error instanceof AssetImageError) {
    switch (error.code) {
      case 'unsupported_type':
        return 'Format gambar harus JPG, PNG, atau WebP.';
      case 'too_large':
        return 'Ukuran gambar terlalu besar (maksimal 2 MB setelah diproses).';
      case 'decode_failed':
        return 'Gambar tidak bisa dibaca. Coba file lain.';
      case 'encode_failed':
        return 'Gambar gagal diproses di browser ini.';
    }
  }
  const message = error instanceof Error ? error.message : '';
  return message ? `Gagal mengunggah gambar: ${message}` : 'Gagal mengunggah gambar.';
}