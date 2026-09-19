import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { HeroHeadline } from '../components/hero/HeroHeadline';
import { FloatingCardComposition } from '../components/hero/FloatingCardComposition';
import { VerifiedSourcesTicker } from '../components/common/VerifiedSourcesTicker';
import { PopularCategoriesSection } from '../components/sections/PopularCategoriesSection';
import { PopularSchemesSection } from '../components/sections/PopularSchemesSection';
import { LICHomeSection } from '../components/sections/LICHomeSection';
import { FreeBenefitsHomeSection } from '../components/free_benefits/FreeBenefitsHomeSection';
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
    <div className="min-h-screen bg-[#FAF9F5] text-sanchay-navy-950 flex flex-col selection:bg-sanchay-emerald-600 selection:text-white">
      {/* Sticky Editorial Header */}
      <Navbar />

      <main className="flex-1">
        {/* 1. LATEST FREE BENEFITS LIVE TICKER (Directly below Sanchay Navbar Header) */}
        <LatestFreeBenefitsSection />

        {/* 2. HERO SECTION (Showcasing Schemes, LIC Plans, and Free Benefits) */}
        <section className="relative overflow-hidden pt-8 pb-16 sm:pt-14 sm:pb-24 bg-[#FAF9F5]">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000008_1px,transparent_1px),linear-gradient(to_bottom,#00000008_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
              <div className="lg:col-span-7">
                <HeroHeadline />
              </div>
              <div className="lg:col-span-5 relative">
                <FloatingCardComposition onSelectScheme={(scheme) => setSelectedItem(scheme)} />
              </div>
            </div>
          </div>
        </section>

        {/* Verified Data Sources Ticker */}
        <VerifiedSourcesTicker />

        {/* FINANCIAL OPTIONS ENTRY GATE */}
        <section className="py-16 bg-[#FAF9F5] border-y border-slate-200 relative">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-mono font-bold uppercase tracking-wider mb-4 border border-slate-200">
                <span>Explore Your Financial Options</span>
              </div>
              <h2 className="font-serif font-extrabold text-3xl sm:text-4xl text-sanchay-navy-950 mb-4">
                What type of financial options<br className="hidden sm:block" /> would you like to explore?
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {/* Government Schemes Card */}
              <Link 
                to="/schemes" 
                className="group flex flex-col bg-white rounded-2xl p-8 border border-slate-200 shadow-sm hover:shadow-md transition-all hover:border-sanchay-emerald-300"
              >
                <div className="w-14 h-14 rounded-xl bg-slate-50 flex items-center justify-center text-3xl mb-6 group-hover:bg-sanchay-emerald-50 transition-colors">
                  🏛️
                </div>
                <h3 className="font-serif font-bold text-2xl text-sanchay-navy-950 mb-3">
                  Government Schemes
                </h3>
                <p className="text-slate-600 text-base leading-relaxed mb-8 flex-1">
                  Explore verified government savings, pension, protection and welfare schemes.
                </p>
                <div className="inline-flex items-center text-sm font-bold text-sanchay-emerald-600 group-hover:text-sanchay-emerald-700 uppercase tracking-wide">
                  Explore Government Schemes <ArrowRight className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>

              {/* Market Options Card */}
              <Link 
                to="/markets" 
                className="group flex flex-col bg-white rounded-2xl p-8 border border-slate-200 shadow-sm hover:shadow-md transition-all hover:border-blue-300"
              >
                <div className="w-14 h-14 rounded-xl bg-slate-50 flex items-center justify-center text-3xl mb-6 group-hover:bg-blue-50 transition-colors">
                  📈
                </div>
                <h3 className="font-serif font-bold text-2xl text-sanchay-navy-950 mb-3">
                  Market & Other Financial Options
                </h3>
                <p className="text-slate-600 text-base leading-relaxed mb-8 flex-1">
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

        {/* 3. POPULAR GOVERNMENT SCHEMES SECTION (Curated) */}
        <PopularSchemesSection schemes={schemesList} />

        {/* 4. DEDICATED LIC PLANS & LIFE SOLUTIONS SECTION */}
        {/* <LICHomeSection /> */}

        {/* 5. DEDICATED SOVEREIGN FREE BENEFITS & WELFARE DIRECT AID SECTION */}
        {/* <FreeBenefitsHomeSection /> */}

        {/* 6. EDITORIAL FEATURE SECTION */}
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
        <section className="py-20 bg-sanchay-navy-950 text-white relative overflow-hidden border-t border-sanchay-navy-850">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sanchay-emerald-500/20 text-sanchay-emerald-400 text-xs font-mono font-bold uppercase tracking-wider mb-6 border border-sanchay-emerald-500/30">
              <Sparkles className="w-3.5 h-3.5 text-sanchay-gold-500" />
              <span>{t('hero.badge', '100% Grounded in Official Gazettes')}</span>
            </div>

            <h2 className="font-serif font-extrabold text-3xl sm:text-5xl text-white tracking-tight leading-tight">
              {t('hero.readyToDiscover', 'Ready to discover the verified schemes you are eligible for?')}
            </h2>

            <p className="text-base text-slate-300 max-w-2xl mx-auto mt-4 leading-relaxed font-normal">
              {t('hero.readySubtitle', 'Enter your life stage, goal, and monthly budget. Sanchay calculates your deterministic eligibility and fit score in seconds.')}
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/profile"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-sanchay-emerald-600 hover:bg-sanchay-emerald-700 text-white font-extrabold text-xs uppercase tracking-wider shadow-editorial hover:scale-105 transition-all"
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
