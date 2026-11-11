export interface ReviewItem {
  id: string;
  rating: number;
  body: string;
  displayName: string;
  createdAt: string;
}

export interface FeaturedReview extends ReviewItem {
  productName: string;
  productSlug: string;
}

export interface RatingSummary {
  average: number;
  count: number;
}

export function summarizeRatings(ratings: number[]): RatingSummary | null {
  if (ratings.length === 0) return null;
  const total = ratings.reduce((sum, rating) => sum + rating, 0);
  return { average: total / ratings.length, count: ratings.length };
}