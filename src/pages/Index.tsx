import { FloatingNav } from '@/components/landing/FloatingNav';
import Footer from '@/components/Footer';
import { Hero } from '@/components/landing/Hero';
import { TechStack } from '@/components/landing/TechStack';
import { DualServices } from '@/components/landing/DualServices';
import { CaseStudies } from '@/components/landing/CaseStudies';
import { PricingTeaser } from '@/components/landing/PricingTeaser';

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased dark">
      <FloatingNav />

      <main>
        <Hero />
        <TechStack />
        <DualServices />
        <CaseStudies />
        <PricingTeaser />
      </main>

      <Footer />
    </div>
  );
};

export default Index;
