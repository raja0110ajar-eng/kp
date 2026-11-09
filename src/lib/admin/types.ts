import type {
  AiStatus,
  DeliveryArea,
  OrderStatus,
  PaymentMethod,
  ProductType,
  VerificationStatus,
} from '@/types/domain';
import type { OnlinePaymentMethod } from '@/types/catalog';

export type PaymentQueueFilter = 'all' | 'transfer' | 'cod';

export interface AdminPaymentReview {
  paymentId: string;
  orderId: string;
  orderCode: string;
  customerName: string;
  customerPhone: string;
  method: PaymentMethod;
  expectedAmount: number;
  aiStatus: AiStatus;
  detectedAmounts: number[];
  matchedAmount: number | null;
  confidence: number | null;
  rawText: string | null;
  /** Signed URL berumur 60 detik, null jika tidak ada bukti atau gagal dibuat. */
  proofUrl: string | null;
  waitingSince: string;
}

export interface AdminOrderListItem {
  id: string;
  orderCode: string;
  customerName: string;
  customerPhone: string;
  deliveryArea: DeliveryArea;
  total: number;
  status: OrderStatus;
  createdAt: string;
  paymentMethod: PaymentMethod | null;
  verificationStatus: VerificationStatus | null;
  aiStatus: AiStatus | null;
}

export interface AdminOrderList {
  items: AdminOrderListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AdminOrderItem {
  productName: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface AdminOrderPayment {
  id: string;
  method: PaymentMethod;
  expectedAmount: number;
  aiStatus: AiStatus;
  verificationStatus: VerificationStatus;
  adminNote: string | null;
  verifiedAt: string | null;
  proofUrl: string | null;
}

export interface AdminOrderDetail {
  id: string;
  orderCode: string;
  status: OrderStatus;
  createdAt: string;
  customerName: string;
  customerPhone: string;
  deliveryArea: DeliveryArea;
  shippingZoneName: string | null;
  deliveryAddress: string;
  notes: string | null;
  subtotal: number;
  shippingFee: number;
  total: number;
  items: AdminOrderItem[];
  payment: AdminOrderPayment | null;
}

export interface AdminProduct {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  imagePath: string | null;
  productType: ProductType;
  isActive: boolean;
  resellerName: string | null;
  costPrice: number | null;
}

export interface AdminShippingZone {
  id: string;
  name: string;
  fee: number;
  isActive: boolean;
  sortOrder: number;
}

export interface AdminPaymentSetting {
  method: OnlinePaymentMethod;
  isActive: boolean;
  displayName: string;
  accountName: string | null;
  accountNumber: string | null;
  instructions: string;
  qrisImagePath: string | null;
  sortOrder: number;
}

export interface DashboardSummary {
  awaitingReview: number;
  processing: number;
  delivering: number;
  lowStock: number;
  verifiedOrders: number;
  revenue: number;
}