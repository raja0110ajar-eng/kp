import type { Metadata } from 'next';
import { AboutSection } from '@/components/landing/AboutSection';
import { ContactSection } from '@/components/landing/ContactSection';
import { FeaturedProducts } from '@/components/landing/FeaturedProducts';
import { Hero } from '@/components/landing/Hero';
import { HowToOrder } from '@/components/landing/HowToOrder';
import { OcrHighlight } from '@/components/landing/OcrHighlight';
import { ShippingPayment } from '@/components/landing/ShippingPayment';
import { siteConfig } from '@/config/site';

export const metadata: Metadata = {
  title: siteConfig.tagline,
  description: siteConfig.metaDescription,
};

// Landing dibuat statis dan disegarkan tiap 60 detik (produk pilihan tidak perlu real-time).
export const revalidate = 60;

export default function LandingPage() {
  return (
    <main>
      <Hero />
      <FeaturedProducts />
      <AboutSection />
      <HowToOrder />
      <ShippingPayment />
      <OcrHighlight />
      <ContactSection />
    </main>
  );
}