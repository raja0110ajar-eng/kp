// Format kode dari kolom orders.order_code: "KP-" + 10 karakter heksadesimal huruf besar.
export const ORDER_CODE_REGEX = /^KP-[0-9A-F]{10}$/;

export function normalizeOrderCode(input: string): string {
  return input.trim().toUpperCase();
}