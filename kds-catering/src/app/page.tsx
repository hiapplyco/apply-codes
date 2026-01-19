import {
  Hero,
  ValuePropositions,
  ServicesGrid,
  HowItWorks,
  TestimonialsCarousel,
  MenuPreview,
  CTASection,
} from "@/components/sections";

export default function HomePage() {
  return (
    <>
      <Hero />
      <ValuePropositions />
      <ServicesGrid />
      <HowItWorks />
      <MenuPreview />
      <TestimonialsCarousel />
      <CTASection />
    </>
  );
}
