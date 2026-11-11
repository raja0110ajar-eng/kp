import { createClient } from '@/lib/supabase/client';

export interface ReviewableItem {
  order_item_id: string;
  product_name: string;
  review_status: 'pending' | 'approved' | 'rejected' | null;
}

/** null bila kode/nomor HP tidak cocok. Untuk pembeli yang login, phone boleh ''. */
export async function listReviewableItems(
  orderCode: string,
  phone: string
): Promise<ReviewableItem[] | null> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc('list_reviewable_items', {
    p_order_code: orderCode,
    p_phone: phone,
  });
  if (error) throw new Error(error.message);
  return (data as ReviewableItem[] | null) ?? null;
}

export interface SubmitReviewArgs {
  orderCode: string;
  phone: string;
  orderItemId: string;
  rating: number;
  body: string;
}

export async function submitReview(args: SubmitReviewArgs): Promise<void> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc('submit_review', {
    p_order_code: args.orderCode,
    p_phone: args.phone,
    p_order_item_id: args.orderItemId,
    p_rating: args.rating,
    p_body: args.body,
  });
  if (error) throw new Error(error.message);

  const result = data as { status: string } | { error: string };
  if ('error' in result) throw new Error(result.error);
}