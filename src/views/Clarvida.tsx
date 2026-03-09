import { ClarvidaNavHeader } from "@/components/clarvida/ClarvidaNavHeader";
import { ClarvidaHero } from "@/components/clarvida/ClarvidaHero";
import { ClarvidaAboutSection } from "@/components/clarvida/ClarvidaAboutSection";
import { ClarvidaToolsGrid } from "@/components/clarvida/ClarvidaToolsGrid";
import { ClarvidaWhyJoinSection } from "@/components/clarvida/ClarvidaWhyJoinSection";
import { ClarvidaValuesSection } from "@/components/clarvida/ClarvidaValuesSection";
import { ClarvidaFooter } from "@/components/clarvida/ClarvidaFooter";

const Clarvida = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <ClarvidaNavHeader />

      {/* Hero Section */}
      <ClarvidaHero />

      {/* About Section */}
      <ClarvidaAboutSection />

      {/* Tools Grid */}
      <ClarvidaToolsGrid />

      {/* Why Join Section */}
      <ClarvidaWhyJoinSection />

      {/* Values Section */}
      <ClarvidaValuesSection />

      {/* Footer */}
      <ClarvidaFooter />
    </div>
  );
};

export default Clarvida;
