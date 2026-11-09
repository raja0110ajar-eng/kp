const MAX_INPUT_BYTES = 15 * 1024 * 1024;
const MAX_SIDE_PX = 2000;
/** Harus sama dengan file_size_limit bucket payment-proofs (2 MB). */
const MAX_OUTPUT_BYTES = 2 * 1024 * 1024;
const QUALITY_STEPS = [0.85, 0.75, 0.65, 0.55] as const;

export type ProofImageErrorCode = 'not_image' | 'too_large' | 'decode_failed' | 'encode_failed';

export class ProofImageError extends Error {
  readonly code: ProofImageErrorCode;

  constructor(code: ProofImageErrorCode) {
    super(code);
    this.name = 'ProofImageError';
    this.code = code;
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
}

/** Hanya untuk browser. Mengecilkan dan mengompres ke JPEG (latar putih agar PNG transparan tidak jadi hitam). */
export async function prepareProofImage(file: File): Promise<Blob> {
  if (!file.type.startsWith('image/')) throw new ProofImageError('not_image');
  if (file.size > MAX_INPUT_BYTES) throw new ProofImageError('too_large');

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new ProofImageError('decode_failed');
  }

  try {
    const scale = Math.min(1, MAX_SIDE_PX / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    if (!context) throw new ProofImageError('encode_failed');

    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);
    context.drawImage(bitmap, 0, 0, width, height);

    for (const quality of QUALITY_STEPS) {
      const blob = await canvasToBlob(canvas, quality);
      if (blob && blob.size <= MAX_OUTPUT_BYTES) return blob;
    }
    throw new ProofImageError('too_large');
  } finally {
    bitmap.close();
  }
}