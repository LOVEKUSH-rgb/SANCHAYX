import React, { useState } from 'react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { SakhiFloatingButton } from '../components/assistant/SakhiFloatingButton';
import { SakhiChatPanel } from '../components/assistant/SakhiChatPanel';

import { MarketsHero } from '../components/markets/MarketsHero';
import { FinancialDiscoveryWizard } from '../components/markets/FinancialDiscoveryWizard';
import { ScalabilityStory } from '../components/markets/ScalabilityStory';
import { MarketCategoriesExplorer } from '../components/markets/MarketCategoriesExplorer';
import { MarketComparisonTable } from '../components/markets/MarketComparisonTable';
import { IllustrativeSimulator } from '../components/markets/IllustrativeSimulator';

export const MarketsPage = () => {
  const [sakhiChatOpen, setSakhiChatOpen] = useState(false);

  const handleStartDiscovery = () => {
    const wizardElement = document.getElementById('discovery-wizard');
    if (wizardElement) {
      wizardElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-sanchay-navy-950 flex flex-col selection:bg-sanchay-emerald-600 selection:text-white">
      <Navbar />
      
      <main className="flex-1">
        <MarketsHero onStartDiscovery={handleStartDiscovery} />
        <FinancialDiscoveryWizard />
        <ScalabilityStory />
        <MarketCategoriesExplorer />
        <MarketComparisonTable />
        <IllustrativeSimulator />
      </main>

      <Footer />
      
      <SakhiFloatingButton
        isOpen={sakhiChatOpen}
        onClick={() => setSakhiChatOpen(!sakhiChatOpen)}
      />
      <SakhiChatPanel
        isOpen={sakhiChatOpen}
        onClose={() => setSakhiChatOpen(false)}
      />
    </div>
  );
};
