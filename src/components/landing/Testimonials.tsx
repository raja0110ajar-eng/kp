import Link from 'next/link';
import { RatingStars } from '@/components/ui/RatingStars';
import { siteConfig } from '@/config/site';
import type { FeaturedReview } from '@/lib/reviews/summary';

interface QuoteItem {
  key: string;
  quote: string;
  name: string;
  context: string;
  rating: number | null;
  href: string | null;
}

export function Testimonials({ reviews }: { reviews: FeaturedReview[] }) {
  const items: QuoteItem[] = [
    ...siteConfig.testimonials.map((testimonial, index) => ({
      key: `manual-${index}`,
      quote: testimonial.quote,
      name: testimonial.name,
      context: testimonial.context,
      rating: null,
      href: null,
    })),
    ...reviews
      .filter((review) => review.body !== '')
      .map((review) => ({
        key: review.id,
        quote: review.body,
        name: review.displayName,
        context: `Pembeli terverifikasi · ${review.productName}`,
        rating: review.rating,
        href: `/products/${review.productSlug}`,
      })),
  ].slice(0, 3);

  if (items.length === 0) return null;

  return (
    <section id="testimoni" className="py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="text-balance text-3xl font-extrabold tracking-tight sm:text-4xl">
          Kata mereka
        </h2>
        <ul className="mt-8 grid gap-8 md:grid-cols-3">
          {items.map((item) => (
            <li key={item.key} className="border-l-2 border-accent pl-5">
              {item.rating !== null ? <RatingStars value={item.rating} /> : null}
              <blockquote className="mt-2 leading-relaxed text-ink-soft">{item.quote}</blockquote>
              <p className="mt-3 font-semibold">{item.name}</p>
              <p className="text-sm text-muted">
                {item.href ? (
                  <Link href={item.href} className="hover:text-link hover:underline">
                    {item.context}
                  </Link>
                ) : (
                  item.context
                )}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}