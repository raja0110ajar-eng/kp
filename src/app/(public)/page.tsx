import type { Metadata } from 'next';
import { AboutSection } from '@/components/landing/AboutSection';
import { ContactSection } from '@/components/landing/ContactSection';
import { Faq } from '@/components/landing/Faq';
import { FeaturedProducts } from '@/components/landing/FeaturedProducts';
import { Hero, type HeroPhoto } from '@/components/landing/Hero';
import { HowToOrder } from '@/components/landing/HowToOrder';
import { InnovationShowcase } from '@/components/landing/InnovationShowcase';
import { OcrHighlight } from '@/components/landing/OcrHighlight';
import { ShippingPayment } from '@/components/landing/ShippingPayment';
import { Testimonials } from '@/components/landing/Testimonials';
import { TrustSection } from '@/components/landing/TrustSection';
import { siteConfig } from '@/config/site';
import { getFeaturedProducts } from '@/lib/catalog/featured';
import { getFeaturedReviews } from '@/lib/reviews/queries';

export const metadata: Metadata = {
  title: siteConfig.tagline,
  description: siteConfig.metaDescription,
};

// Landing dibuat statis dan disegarkan tiap 60 detik (produk dan ulasan pilihan tidak perlu real-time).
export const revalidate = 60;

export default async function LandingPage() {
  const [products, reviews] = await Promise.all([getFeaturedProducts(4), getFeaturedReviews(3)]);

  const photos: HeroPhoto[] = [];
  for (const product of products) {
    if (product.image_path) photos.push({ path: product.image_path, alt: product.name });
  }

  return (
    <main>
      <Hero photos={photos} />
      <FeaturedProducts products={products} />
      <Testimonials reviews={reviews} />
      <InnovationShowcase />
      <HowToOrder />
      <AboutSection />
      <ShippingPayment />
      <TrustSection />
      <OcrHighlight />
      <Faq />
      <ContactSection />
    </main>
  );
}