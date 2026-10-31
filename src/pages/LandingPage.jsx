import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { HeroHeadline } from '../components/hero/HeroHeadline';
import { FloatingCardComposition } from '../components/hero/FloatingCardComposition';
import { VerifiedSourcesTicker } from '../components/common/VerifiedSourcesTicker';
import { PopularCategoriesSection } from '../components/sections/PopularCategoriesSection';
import { PopularSchemesSection } from '../components/sections/PopularSchemesSection';
import { LatestFreeBenefitsSection } from '../components/free_benefits/LatestFreeBenefitsSection';
import { EditorialFeatureSection } from '../components/sections/EditorialFeatureSection';
import { HowItWorksSection } from '../components/sections/HowItWorksSection';
import { ProblemSolutionSection } from '../components/sections/ProblemSolutionSection';
import { KeyFeaturesSection } from '../components/sections/KeyFeaturesSection';
import { SakhiFloatingButton } from '../components/assistant/SakhiFloatingButton';
import { SakhiChatPanel } from '../components/assistant/SakhiChatPanel';
import { ProductDetailsModal } from '../components/common/ProductDetailsModal';
import { MOCK_SCHEMES } from '../data/mockSchemes';
import { fetchSchemes } from '../services/api';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export const LandingPage = () => {
  const { t } = useLanguage();
  const [sakhiChatOpen, setSakhiChatOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [schemesList, setSchemesList] = useState(
    MOCK_SCHEMES.map(s => ({ ...s, isInsurance: false }))
  );
  const [selectedLifeStage, setSelectedLifeStage] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    async function loadSchemes() {
      try {
        const liveSchemes = await fetchSchemes({ limit: 300 });
        if (isMounted && liveSchemes && Array.isArray(liveSchemes) && liveSchemes.length > 0) {
          setSchemesList(liveSchemes.map(s => ({ ...s, isInsurance: false })));
        }
      } catch (err) {
        console.error('Failed to load live schemes on landing:', err);
      }
    }
    loadSchemes();
    return () => { isMounted = false; };
  }, []);

  const handleSelectGoal = (goalId) => {
    navigate(`/profile?goal=${goalId}`);
  };

  const handleSelectLifeStage = (stageId) => {
    setSelectedLifeStage(stageId);
    const element = document.getElementById('verified-schemes');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAF8] text-[#202B26] flex flex-col font-sans">
      {/* Sticky Navigation Header */}
      <Navbar />

      <main className="flex-1 pt-16">
        {/* 1. LATEST FREE BENEFITS LIVE TICKER (Directly below Navbar Header) */}
        <LatestFreeBenefitsSection />

        {/* 2. HERO SECTION (Showcasing Schemes, LIC Plans, and Free Benefits + 3D Orbital Medallion) */}
        <section className="relative overflow-hidden pt-8 pb-16 sm:pt-14 sm:pb-24 bg-[#F8FAF8]">
          {/* Subtle Civic Grid & Ambient Illumination */}
          <div className="absolute inset-0 civic-grid-pattern opacity-60 pointer-events-none" />
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[450px] bg-[#E7F1EB]/70 rounded-full blur-[120px] pointer-events-none -z-10" />
          <div className="absolute top-10 right-10 w-96 h-96 bg-[#FEF3C7]/40 rounded-full blur-[100px] pointer-events-none -z-10" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
              <div className="lg:col-span-7">
                <HeroHeadline />
              </div>
              <div className="lg:col-span-5 relative flex items-center justify-center w-full">
                <FloatingCardComposition />
              </div>
            </div>
          </div>
        </section>

        {/* Verified Data Sources Ticker */}
        <VerifiedSourcesTicker />

        {/* FINANCIAL OPTIONS ENTRY GATE */}
        <section className="py-16 bg-[#F8FAF8] border-y border-[#E7ECE8] relative">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E7F1EB] text-[#176B50] text-xs font-semibold uppercase tracking-wider mb-4 border border-[#D5E4DC]">
                <span>Explore Your Financial Options</span>
              </div>
              <h2 className="font-serif font-extrabold text-3xl sm:text-4xl text-[#202B26] mb-4">
                What type of financial options<br className="hidden sm:block" /> would you like to explore?
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {/* Government Schemes Card */}
              <Link 
                to="/schemes" 
                className="group flex flex-col bg-white rounded-2xl p-8 border border-[#E7ECE8] shadow-card hover:shadow-card-hover transition-all hover:border-[#176B50]/40 hover:-translate-y-1"
              >
                <div className="w-14 h-14 rounded-xl bg-[#E7F1EB] border border-[#D5E4DC] flex items-center justify-center text-3xl mb-6 group-hover:scale-105 transition-transform">
                  🏛️
                </div>
                <h3 className="font-serif font-bold text-2xl text-[#202B26] group-hover:text-[#176B50] transition-colors mb-3">
                  Government Schemes
                </h3>
                <p className="text-[#66736C] text-base leading-relaxed mb-8 flex-1 font-normal">
                  Explore verified government savings, pension, protection and welfare schemes.
                </p>
                <div className="inline-flex items-center text-sm font-bold text-[#176B50] group-hover:text-[#125540] uppercase tracking-wide">
                  Explore Government Schemes <ArrowRight className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>

              {/* Market Options Card */}
              <Link 
                to="/markets" 
                className="group flex flex-col bg-white rounded-2xl p-8 border border-[#E7ECE8] shadow-card hover:shadow-card-hover transition-all hover:border-blue-300 hover:-translate-y-1"
              >
                <div className="w-14 h-14 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-3xl mb-6 group-hover:scale-105 transition-transform">
                  📈
                </div>
                <h3 className="font-serif font-bold text-2xl text-[#202B26] group-hover:text-blue-700 transition-colors mb-3">
                  Market & Other Financial Options
                </h3>
                <p className="text-[#66736C] text-base leading-relaxed mb-8 flex-1 font-normal">
                  Explore mutual funds, ETFs, stocks and fixed-income products through an educational, comparison-focused experience.
                </p>
                <div className="inline-flex items-center text-sm font-bold text-blue-600 group-hover:text-blue-700 uppercase tracking-wide">
                  Explore Market Options <ArrowRight className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            </div>
          </div>
        </section>

        {/* POPULAR CATEGORIES */}
        <PopularCategoriesSection />

        {/* 3. POPULAR GOVERNMENT SCHEMES SECTION (Curated Live Schemes from API) */}
        <PopularSchemesSection schemes={schemesList} />

        {/* 4. EDITORIAL FEATURE SECTION */}
        <EditorialFeatureSection
          onSelectGoal={handleSelectGoal}
        />

        {/* HOW SANCHAY WORKS */}
        <HowItWorksSection />

        {/* PROBLEM & SOLUTION SECTION */}
        <ProblemSolutionSection />

        {/* KEY FEATURES & DIFFERENTIATORS */}
        <KeyFeaturesSection />

        {/* Editorial CTA Callout Banner */}
        <section className="py-20 bg-gradient-to-b from-[#E7F1EB]/50 to-[#F8FAF8] text-[#202B26] relative overflow-hidden border-t border-[#E7ECE8]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white text-[#176B50] text-xs font-semibold uppercase tracking-wider mb-6 border border-[#D5E4DC] shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>{t('hero.badge', '100% Grounded in Official Gazettes')}</span>
            </div>

            <h2 className="font-serif font-extrabold text-3xl sm:text-5xl text-[#202B26] tracking-tight leading-tight">
              {t('hero.readyToDiscover', 'Ready to discover the verified schemes you are eligible for?')}
            </h2>

            <p className="text-base text-[#66736C] max-w-2xl mx-auto mt-4 leading-relaxed font-normal">
              {t('hero.readySubtitle', 'Enter your life stage, goal, and monthly budget. Sanchay calculates your deterministic eligibility and fit score in seconds.')}
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/profile"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-[#176B50] hover:bg-[#125540] text-white font-semibold text-sm uppercase tracking-wider shadow-xs hover:shadow-sm hover:scale-[1.01] transition-all cursor-pointer"
              >
                <span>{t('nav.findMySchemes', 'Find My Schemes')}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Modal Dialog for Scheme Details */}
      <ProductDetailsModal
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
      />

      {/* Footer */}
      <Footer />

      {/* Persistent Sakhi AI Floating Assistant */}
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
