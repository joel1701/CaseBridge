import { useEffect } from 'react';
import { LandingNav } from './components/LandingNav';
import { HeroSection } from './components/HeroSection';
import { ProductShowcase } from './components/ProductShowcase';
import { ProblemSolutionSection } from './components/ProblemSolutionSection';
import { HowItWorksSection } from './components/HowItWorksSection';
import { KeyBenefitsSection } from './components/KeyBenefitsSection';
import { WhoItsForSection } from './components/WhoItsForSection';
import { TrustSection } from './components/TrustSection';
import { ClosingCtaSection } from './components/ClosingCtaSection';
import { LandingFooter } from './components/LandingFooter';

export function LandingPage() {
  useEffect(() => {
    // Scroll to top on initial page load if no hash
    if (!window.location.hash) {
      window.scrollTo(0, 0);
    }
  }, []);

  return (
    <div
      id="top"
      className="min-h-screen bg-[#FFFCF0] text-[#171717] font-sans-ui selection:bg-[#A88BFF] selection:text-[#171717]"
    >
      {/* Top Navigation */}
      <LandingNav />

      {/* Main Content Landmark */}
      <main>
        {/* Section B: Hero Section */}
        <HeroSection />

        {/* Section C: Product Showcase */}
        <ProductShowcase />

        {/* Section D: Problem and Solution */}
        <ProblemSolutionSection />

        {/* Section E: How CaseBridge Works */}
        <HowItWorksSection />

        {/* Section F: Key Benefits */}
        <KeyBenefitsSection />

        {/* Section G: Who It's For */}
        <WhoItsForSection />

        {/* Section H: Trust, Privacy, and Human Oversight */}
        <TrustSection />

        {/* Section I: Closing CTA */}
        <ClosingCtaSection />
      </main>

      {/* Section J: Footer */}
      <LandingFooter />
    </div>
  );
}

