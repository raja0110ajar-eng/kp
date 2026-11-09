import type { ProductType } from '@/types/domain';

export const PRODUCT_TYPE_LABEL: Record<ProductType, string> = {
  own_product: 'Karya Kami',
  reseller: 'Reseller',
};

export const PRODUCT_TYPE_BADGE_CLASS: Record<ProductType, string> = {
  own_product: 'bg-[#0066FF]/10 text-[#0066FF]',
  reseller: 'bg-[#FF6B00]/10 text-[#FF6B00]',
};