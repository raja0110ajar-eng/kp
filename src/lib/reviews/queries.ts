import { createPublicClient } from '@/lib/supabase/public';
import {
  summarizeRatings,
  type FeaturedReview,
  type RatingSummary,
  type ReviewItem,
} from '@/lib/reviews/summary';

interface RawReview {
  id: string;
  rating: number;
  body: string;
  display_name: string;
  created_at: string;
}

interface RawFeaturedReview extends RawReview {
  products: { name: string; slug: string } | { name: string; slug: string }[] | null;
}

function mapReview(row: RawReview): ReviewItem {
  return {
    id: row.id,
    rating: row.rating,
    body: row.body,
    displayName: row.display_name,
    createdAt: row.created_at,
  };
}

const MAX_REVIEWS_FOR_SUMMARY = 200;
const VISIBLE_REVIEWS = 10;

export async function getApprovedReviews(
  productId: string
): Promise<{ items: ReviewItem[]; summary: RatingSummary | null }> {
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from('reviews')
      .select('id, rating, body, display_name, created_at')
      .eq('product_id', productId)
      .order('created_at', { ascending: false })
      .limit(MAX_REVIEWS_FOR_SUMMARY);

    if (error) {
      console.error('Gagal memuat ulasan:', error.message);
      return { items: [], summary: null };
    }

    const rows = (data ?? []) as unknown as RawReview[];
    return {
      items: rows.slice(0, VISIBLE_REVIEWS).map(mapReview),
      summary: summarizeRatings(rows.map((row) => row.rating)),
    };
  } catch (caught) {
    console.error('Gagal memuat ulasan:', caught);
    return { items: [], summary: null };
  }
}

export async function getFeaturedReviews(limit: number): Promise<FeaturedReview[]> {
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from('reviews')
      .select('id, rating, body, display_name, created_at, products(name, slug)')
      .eq('is_featured', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Gagal memuat ulasan pilihan:', error.message);
      return [];
    }

    const rows = (data ?? []) as unknown as RawFeaturedReview[];
    const featured: FeaturedReview[] = [];
    for (const row of rows) {
      const product = Array.isArray(row.products) ? row.products[0] : row.products;
      if (!product) continue;
      featured.push({ ...mapReview(row), productName: product.name, productSlug: product.slug });
    }
    return featured;
  } catch (caught) {
    console.error('Gagal memuat ulasan pilihan:', caught);
    return [];
  }
}