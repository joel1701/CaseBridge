import { useEffect } from 'react';
import { LandingNav } from './components/LandingNav';
import { HeroSection } from './components/HeroSection';
import { ProductWorkbench } from './components/ProductWorkbench';
import { HowItWorksSection } from './components/HowItWorksSection';
import { ActionFirewallSection } from './components/ActionFirewallSection';
import { TrustGovernanceSection } from './components/TrustGovernanceSection';
import { ExploreWorkspaceCta } from './components/ExploreWorkspaceCta';
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
      className="min-h-screen bg-white text-slate-900 font-body selection:bg-blue-100 selection:text-blue-900"
    >
      {/* Navigation */}
      <LandingNav />

      {/* Main Flow */}
      <main>
        {/* Section 1: Hero Briefing */}
        <HeroSection />

        {/* Section 2: Interactive Product Workbench (Borrowing Direction 2's Product-First Layout) */}
        <ProductWorkbench />

        {/* Section 3: How It Works */}
        <HowItWorksSection />

        {/* Section 4: Action Firewall Feature */}
        <ActionFirewallSection />

        {/* Section 5: Trust, Governance & Regulatory Boundaries */}
        <TrustGovernanceSection />

        {/* Section 6: Explore Working Workspace Prototype */}
        <ExploreWorkspaceCta />
      </main>

      {/* Footer */}
      <LandingFooter />
    </div>
  );
}
