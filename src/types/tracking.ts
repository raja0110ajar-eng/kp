import type {
  AiStatus,
  DeliveryArea,
  OrderStatus,
  PaymentMethod,
  TrackedOrderItem,
  VerificationStatus,
} from '@/types/domain';

/** Hasil RPC track_order (setelah migrasi 0003) dan hasil query pesanan milik pembeli login. */
export interface TrackedOrderDetail {
  order_id: string;
  order_code: string;
  status: OrderStatus;
  delivery_area: DeliveryArea;
  customer_name: string;
  delivery_address: string;
  shipping_zone_name: string | null;
  notes: string | null;
  subtotal: number;
  shipping_fee: number;
  total: number;
  created_at: string;
  updated_at: string;
  items: TrackedOrderItem[];
  payment: {
    id: string;
    method: PaymentMethod;
    expected_amount: number;
    ai_status: AiStatus;
    verification_status: VerificationStatus;
    admin_note: string | null;
  };
}

export interface MyOrderSummary {
  orderCode: string;
  status: OrderStatus;
  total: number;
  createdAt: string;
  paymentMethod: PaymentMethod | null;
  verificationStatus: VerificationStatus | null;
}

export interface MyOrderList {
  items: MyOrderSummary[];
  total: number;
  page: number;
  pageSize: number;
}