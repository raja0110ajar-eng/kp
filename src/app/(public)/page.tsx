import type { Metadata } from 'next';
import { AboutSection } from '@/components/landing/AboutSection';
import { ContactSection } from '@/components/landing/ContactSection';
import { Faq } from '@/components/landing/Faq';
import { FeaturedProducts } from '@/components/landing/FeaturedProducts';
import { Hero } from '@/components/landing/Hero';
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

  return (
    <main>
      <Hero />
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