import type { ProductType } from '@/types/domain';

export const PRODUCT_TYPE_LABEL: Record<ProductType, string> = {
  own_product: 'Karya Kami',
  reseller: 'Reseller',
};

export const PRODUCT_TYPE_BADGE_CLASS: Record<ProductType, string> = {
  own_product: 'bg-primary/10 text-link',
  reseller: 'bg-accent/10 text-accent-ink',
};