import { createClient } from '@/lib/supabase/client';
import type { TransferVerificationResult } from '@/lib/ocr/types';
import type {
  CreateOrderInput,
  CreateOrderResult,
  SubmitProofResult,
  TrackedOrder,
} from '@/types/domain';

// Semua fungsi di sini melempar Error(message) berisi kode dari database.
// Terjemahkan ke pesan pengguna dengan getOrderErrorMessage().

export async function createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc('create_order', {
    p_customer_name: input.customerName,
    p_customer_phone: input.customerPhone,
    p_delivery_area: input.deliveryArea,
    p_shipping_zone_id: input.shippingZoneId,
    p_delivery_address: input.deliveryAddress,
    p_payment_method: input.paymentMethod,
    p_notes: input.notes,
    p_items: input.items,
  });
  if (error) throw new Error(error.message);
  return data as CreateOrderResult;
}

export async function trackOrder(orderCode: string, phone: string): Promise<TrackedOrder | null> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc('track_order', {
    p_order_code: orderCode,
    p_phone: phone,
  });
  if (error) throw new Error(error.message);
  return (data as TrackedOrder | null) ?? null;
}

export interface SubmitPaymentProofArgs {
  orderCode: string;
  phone: string;
  proofPath: string;
  verification: TransferVerificationResult;
}

export async function submitPaymentProof(args: SubmitPaymentProofArgs): Promise<SubmitProofResult> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc('submit_payment_proof', {
    p_order_code: args.orderCode,
    p_phone: args.phone,
    p_proof_path: args.proofPath,
    p_ocr_raw_text: args.verification.rawText,
    p_detected_amounts: args.verification.detectedAmounts,
    p_matched_amount: args.verification.matchedAmount,
    p_confidence: args.verification.confidence,
    p_ai_status: args.verification.aiStatus,
  });
  if (error) throw new Error(error.message);

  // Pesanan yang tidak cocok dikembalikan sebagai nilai (bukan exception) oleh database.
  const result = data as SubmitProofResult | { error: string };
  if ('error' in result) throw new Error(result.error);
  return result;
}