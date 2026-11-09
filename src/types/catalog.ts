import type { PaymentMethod, ProductType } from '@/types/domain';

export interface ProductSummary {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  image_path: string | null;
  product_type: ProductType;
}

export interface ShippingZone {
  id: string;
  name: string;
  fee: number;
}

export type OnlinePaymentMethod = Exclude<PaymentMethod, 'cod'>;

export interface PaymentSetting {
  method: OnlinePaymentMethod;
  display_name: string;
  account_name: string | null;
  account_number: string | null;
  instructions: string;
  qris_image_path: string | null;
}