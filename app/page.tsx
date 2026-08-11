import type { Metadata } from 'next';
import Hero from '@/components/home/Hero';
import MaterialTiers from '@/components/home/MaterialTiers';
import FeaturedBelts from '@/components/home/FeaturedBelts';
import LeagueGrid from '@/components/home/LeagueGrid';
import WhyUs from '@/components/home/WhyUs';
import CustomShowcase from '@/components/home/CustomShowcase';
import Reviews from '@/components/home/Reviews';
import BlogTeasers from '@/components/home/BlogTeasers';
import Newsletter from '@/components/home/Newsletter';

export const metadata: Metadata = {
  title: 'Custom Championship Belts & Replica Title Belts',
  description:
    'Custom championship belts and replica title belts made in-house from real cowhide and deep-etched metal with 24k gold plating. Build your own belt or shop by material. Worldwide shipping.',
  alternates: { canonical: '/' },
};

export default function HomePage() {
  return (
    <>
      <Hero />
      {/*
        Products come FIRST, directly under the hero. A shopper landing here is
        looking for belts, not for our manufacturing story — making them scroll
        past three explainer sections to reach a product is the main thing wrong
        with the sites we are competing against.
      */}
      <FeaturedBelts />
      <MaterialTiers />
      <LeagueGrid />
      <WhyUs />
      <CustomShowcase />
      {/* Reviews and BlogTeasers self-hide until real data exists. */}
      <Reviews />
      <BlogTeasers />
      <Newsletter />
    </>
  );
}
