export interface CostInput {
  /** Bahan atau harga beli per unit. null berarti belum diisi. */
  costPrice: number | null;
  packagingCost: number;
  laborMinutes: number;
}

/** HPP per unit = bahan + kemasan + (menit tenaga x tarif per jam / 60). null bila bahan belum diisi. */
export function computeUnitCost(input: CostInput, laborRatePerHour: number): number | null {
  if (input.costPrice === null) return null;
  return input.costPrice + input.packagingCost + Math.round((input.laborMinutes * laborRatePerHour) / 60);
}