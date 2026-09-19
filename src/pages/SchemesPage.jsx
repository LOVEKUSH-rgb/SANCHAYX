import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { FeaturedSchemesSection } from '../components/sections/FeaturedSchemesSection';
import { ProductDetailsModal } from '../components/common/ProductDetailsModal';
import { SakhiFloatingButton } from '../components/assistant/SakhiFloatingButton';
import { SakhiChatPanel } from '../components/assistant/SakhiChatPanel';
import { MOCK_SCHEMES } from '../data/mockSchemes';
import { fetchSchemes } from '../services/api';
import { useLocation } from 'react-router-dom';

export const SchemesPage = () => {
  const [sakhiChatOpen, setSakhiChatOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [schemesList, setSchemesList] = useState(
    MOCK_SCHEMES.map(s => ({ ...s, isInsurance: false }))
  );
  
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialCategory = searchParams.get('category') || 'all';
  const initialSearch = searchParams.get('q') || '';
  const initialLifeStage = searchParams.get('stage') || 'all';

  useEffect(() => {
    let isMounted = true;
    async function loadSchemes() {
      try {
        const liveSchemes = await fetchSchemes({ limit: 300 });
        if (isMounted && liveSchemes && Array.isArray(liveSchemes) && liveSchemes.length > 0) {
          const govtOnly = liveSchemes.filter(s => !s.isInsurance && s.category !== 'insurance' && s.source !== 'lic');
          setSchemesList(govtOnly.length > 0 ? govtOnly : MOCK_SCHEMES);
        }
      } catch (err) {
        console.warn('API scheme load notice, using local verified dataset:', err);
      }
    }
    loadSchemes();
    return () => { isMounted = false; };
  }, []);

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-sanchay-navy-950 flex flex-col selection:bg-sanchay-emerald-600 selection:text-white">
      <Navbar />
      <main className="flex-1 pt-4 sm:pt-6">
        <FeaturedSchemesSection
          schemes={schemesList}
          onSelectScheme={(scheme) => setSelectedItem(scheme)}
          initialCategory={initialCategory}
          initialSearch={initialSearch}
          initialLifeStage={initialLifeStage}
        />
      </main>
      <ProductDetailsModal
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
      />
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
