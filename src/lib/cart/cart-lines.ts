import type { CartItem } from '@/lib/cart/cart-store';
import type { ProductSummary } from '@/types/catalog';

/** Sama dengan batas quantity di RPC create_order. */
export const MAX_LINE_QUANTITY = 99;

export interface CartLine {
  product: ProductSummary;
  /** Jumlah efektif: sudah dibatasi stok terkini dan batas maksimum. */
  quantity: number;
  lineTotal: number;
  /** true jika jumlah di keranjang melebihi stok terkini sehingga diturunkan. */
  adjusted: boolean;
}

export interface BlockedLine {
  productId: string;
  reason: 'unavailable' | 'out_of_stock';
  product: ProductSummary | null;
}

export interface CartLines {
  lines: CartLine[];
  blocked: BlockedLine[];
  subtotal: number;
}

/** Menggabungkan isi keranjang (id + jumlah) dengan data produk terkini dari database. */
export function buildCartLines(items: CartItem[], products: ProductSummary[]): CartLines {
  const productById = new Map(products.map((product) => [product.id, product] as const));
  const lines: CartLine[] = [];
  const blocked: BlockedLine[] = [];
  let subtotal = 0;

  for (const item of items) {
    const product = productById.get(item.productId);

    if (!product) {
      blocked.push({ productId: item.productId, reason: 'unavailable', product: null });
      continue;
    }
    if (product.stock <= 0) {
      blocked.push({ productId: item.productId, reason: 'out_of_stock', product });
      continue;
    }

    const quantity = Math.min(item.quantity, product.stock, MAX_LINE_QUANTITY);
    const lineTotal = product.price * quantity;
    subtotal += lineTotal;
    lines.push({ product, quantity, lineTotal, adjusted: quantity < item.quantity });
  }

  return { lines, blocked, subtotal };
}