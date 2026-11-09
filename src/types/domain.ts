export type ProductType = 'own_product' | 'reseller';
export type DeliveryArea = 'school' | 'outside';
export type PaymentMethod = 'cod' | 'qris' | 'dana' | 'ovo' | 'gopay' | 'bank_transfer';
export type OrderStatus =
  | 'awaiting_payment'
  | 'awaiting_verification'
  | 'processing'
  | 'delivering'
  | 'completed'
  | 'cancelled';
export type AiStatus = 'not_applicable' | 'pending' | 'matched' | 'mismatch' | 'unreadable';
export type VerificationStatus = 'awaiting_proof' | 'awaiting_review' | 'verified' | 'rejected';

export interface OrderItemInput {
  product_id: string;
  quantity: number;
}

export interface CreateOrderInput {
  customerName: string;
  customerPhone: string;
  deliveryArea: DeliveryArea;
  shippingZoneId: string | null;
  deliveryAddress: string;
  paymentMethod: PaymentMethod;
  notes: string | null;
  items: OrderItemInput[];
}

export interface CreateOrderResult {
  order_id: string;
  order_code: string;
  total: number;
  payment_method: PaymentMethod;
}

export interface TrackedOrderItem {
  product_name: string;
  unit_price: number;
  quantity: number;
  line_total: number;
}

export interface TrackedOrder {
  order_id: string;
  order_code: string;
  status: OrderStatus;
  delivery_area: DeliveryArea;
  customer_name: string;
  subtotal: number;
  shipping_fee: number;
  total: number;
  created_at: string;
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

export interface SubmitProofResult {
  ai_status: 'matched' | 'mismatch' | 'unreadable';
  verification_status: VerificationStatus;
}