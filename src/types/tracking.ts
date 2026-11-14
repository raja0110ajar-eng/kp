import type {
  AiStatus,
  DeliveryArea,
  OrderStatus,
  PaymentMethod,
  TrackedOrderItem,
  VerificationStatus,
} from '@/types/domain';

/** Hasil RPC track_order dan query pesanan milik pembeli login. */
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
  /** Tanggal (YYYY-MM-DD) perkiraan diantar. */
  eta_date: string | null;
  eta_note: string | null;
  customer_note: string | null;
  /** null bila jadwal masih perkiraan otomatis dan belum pernah diubah admin. */
  schedule_updated_at: string | null;
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